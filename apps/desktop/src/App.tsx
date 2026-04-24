import type { DocumentState } from '@doclocalizer/core'
import { convertPdfToMarkdown, estimateContextSize } from '@doclocalizer/core'
import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { formatError } from './lib/utils'
import { ExportFormat, contentToPdf, getFileExtension } from './lib/export'
import DiffView from './components/DiffView'
import DocumentList from './components/DocumentList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import HistoryPanel from './components/HistoryPanel'
import SettingsModal from './components/SettingsModal'

const DEFAULT_API_URL = 'http://localhost:8080/v1'
const DEFAULT_MODEL = 'llama:3.2:3b-instruct'

const DEFAULT_PROMPT = `STRICT LOCALIZATION RULES - FOLLOW EXACTLY:

CRITICAL - THIS IS WORD REPLACEMENT ONLY:
- You are NOT writing a story. You are NOT being creative. You are ONLY replacing words.
- NEVER invent, add, remove, or modify any content beyond word-level changes
- NEVER change sentence structure, punctuation, or paragraph structure
- NEVER add dialogue, descriptions, or narrative that wasn't in the original
- The text you output MUST contain EXACTLY the same words as the input, just with spelling/word replacements

TARGET LOCALE CONVERSIONS ONLY:
- color → colour (or vice versa depending on target)
- honor → honour (or vice versa)
- Words like "mom", "dad", "football", "soccer" → use the target locale equivalent
- Only make changes that match the target locale's spelling/word conventions

PRESERVE EVERYTHING EXACTLY:
- Keep every single word from the original
- Keep all punctuation exactly as written
- Keep all paragraph breaks exactly as in the original
- Keep all dialogue exactly as written - do NOT add speech tags like "he said" or "she whispered"
- Keep all capitalization exactly as in the original
- Keep all sentence structure exactly as in the original
- If a word has no locale-specific alternative, leave it EXACTLY as is

OUTPUT FORMAT:
- Output EXACTLY one paragraph of text
- NO markers, NO comments, NO explanations
- NO leading/trailing whitespace

---BEGIN TEXT---
{text}
---END TEXT---`

interface Locale {
	code: string
	name: string
}

interface Settings {
	apiUrl: string
	model: string
	chunkSize: string
	modelContext: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE'
	overlapSize: string
	sourceLocale: string
	targetLocale: string
	customLocales: Locale[]
	customPrompt?: string
}

async function loadSettings(): Promise<Settings> {
	try {
		const result = await window.electron.loadSettings()
		if (result && typeof result === 'object') {
			const r = result as Record<string, unknown>
			const model = (r.model as string) || DEFAULT_MODEL
			const modelContext = (r.modelContext as 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE') || estimateContextSize(model)
			return {
				apiUrl: (r.apiUrl as string) || DEFAULT_API_URL,
				model,
				chunkSize: (r.chunkSize as string) || '1000',
				modelContext,
				overlapSize: (r.overlapSize as string) || '100',
				sourceLocale: (r.sourceLocale as string) || '',
				targetLocale: (r.targetLocale as string) || '',
				customLocales: Array.isArray(r.customLocales) 
					? r.customLocales 
					: (typeof r.customLocales === 'string' ? JSON.parse(r.customLocales) : []),
			}
		}
	} catch (err) {
		console.error('Error loading settings:', err)
	}
	const model = DEFAULT_MODEL
	return {
		apiUrl: DEFAULT_API_URL,
		model,
		chunkSize: '1000',
		modelContext: estimateContextSize(model),
		overlapSize: '100',
		sourceLocale: '',
		targetLocale: '',
		customLocales: [],
	}
}

interface HistoryEntry {
	id: string
	fileName: string
	filePath: string
	sourceLocale: string
	targetLocale: string
	processedAt: string
	status: 'processed' | 'approved' | 'rejected' | 'error'
	errorMessage?: string
	chunksProcessed?: number
}

interface PersistedDocument {
	id: string
	name: string
	path: string
	status: 'idle' | 'parsing' | 'localizing' | 'paused' | 'review' | 'approved' | 'error'
	markdown?: string
	localizedText?: string
	error?: string
}

function toPersistedDocument(doc: DocumentState): PersistedDocument {
	return {
		id: doc.id,
		name: doc.name,
		path: doc.path,
		status: doc.status,
		markdown: doc.markdown,
		localizedText: doc.localizedText,
		error: doc.error,
	}
}

async function readPdfFile(filePath: string): Promise<Uint8Array> {
	const base64 = await window.electron.readFile(filePath)
	const binaryString = atob(base64)
	const bytes = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	return bytes
}

async function readTextFile(filePath: string): Promise<string> {
	const base64 = await window.electron.readFile(filePath)
	const binaryString = atob(base64)
	return binaryString
}

function isPdfPath(path: string): boolean {
	return /\.pdf$/i.test(path)
}

export default function App() {
	const [documents, setDocuments] = useState<DocumentState[]>([])
	const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
	const [showSettings, setShowSettings] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [settings, setSettings] = useState<Settings | null>(null)
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isPaused, setIsPaused] = useState(false)
	const [pausedChunkIndex, setPausedChunkIndex] = useState<Record<string, number>>({})

	// Load settings and history on mount
	useEffect(() => {
		async function init() {
			try {
				const loadedSettings = await loadSettings()
				setSettings(loadedSettings)

				const loadedHistory = await window.electron.getHistory()
				setHistory(loadedHistory)

				const loadedDocuments = await window.electron.loadDocuments()
				if (loadedDocuments && Array.isArray(loadedDocuments)) {
					setDocuments(loadedDocuments as DocumentState[])
				}
			} finally {
				setIsLoading(false)
			}
		}
		void init()
	}, [])

	// Persist documents when they change
	useEffect(() => {
		if (isLoading) return
		const persisted = documents.map(toPersistedDocument)
		void window.electron.saveDocuments(persisted)
	}, [documents, isLoading])

	// Connection test removed - errors show when processing starts instead

	const isConfigured = settings?.apiUrl && settings?.model

	const addFilesToDocuments = useCallback(
		(paths: string[]) => {
			const existingPaths = new Set(documents.map((d) => d.path))
			const newPaths = paths.filter((p) => !existingPaths.has(p))

			if (newPaths.length === 0) {
				toast.warning('Files already added')
				return
			}

			const newDocs: DocumentState[] = newPaths.map((path) => ({
				id: crypto.randomUUID(),
				name: path.split('/').pop() || path,
				path,
				status: 'idle' as const,
			}))
			setDocuments((prev) => [...prev, ...newDocs])
			toast.success(`Added ${newPaths.length} file(s)`)
		},
		[documents]
	)

	const handleSelectFiles = useCallback(async () => {
		try {
			const files = await window.electron.openFile({ multiple: true })
			if (files && files.length > 0) {
				addFilesToDocuments(files)
			}
		} catch {
			toast.error('Failed to select files')
		}
	}, [addFilesToDocuments])

	const handleProcess = useCallback(
		async (id: string) => {
			const doc = documents.find((d) => d.id === id)
			if (!doc) return

			if (!settings || !isConfigured) {
				toast.error('Please configure API URL, model, and target locale in settings')
				setShowSettings(true)
				return
			}

			// Create history entry
			const historyEntry = await window.electron.addHistory({
				fileName: doc.name,
				filePath: doc.path,
				sourceLocale: settings.sourceLocale,
				targetLocale: settings.targetLocale,
				processedAt: new Date().toISOString(),
				status: 'processed',
			})

			let markdown: string

			try {
				if (isPdfPath(doc.path)) {
					// PDF file - convert to markdown
					setDocuments((prev) =>
						prev.map((d) =>
							d.id === id ? { ...d, status: 'parsing', progress: { current: 0, total: 1, phase: 'parsing' } } : d
						)
					)

					const bytes = await readPdfFile(doc.path)
					markdown = await convertPdfToMarkdown(bytes)

					const mdPath = doc.path.replace(/\.pdf$/i, '.md')
					await window.electron.writeTextFile(mdPath, markdown)
				} else {
					// .md file - read directly
					markdown = await readTextFile(doc.path)
				}

				// Split markdown into paragraphs - one paragraph per API call
				const paragraphs = markdown.split(/\n\n+/).filter((p) => p.trim())
				const localizedPath = doc.path.replace(/\.pdf$/i, '.localized.md').replace(/\.md$/i, '.localized.md')
				await window.electron.writeTextFile(localizedPath, '')

				setDocuments((prev) =>
					prev.map((d) =>
						d.id === id
							? {
									...d,
									status: 'localizing',
									progress: { current: 0, total: paragraphs.length, phase: 'localizing' },
								}
							: d
					)
				)

				const promptTemplate = settings!.customPrompt || DEFAULT_PROMPT
				// Process ONE paragraph at a time - no chunking, no overlap, no dedup needed
				const localizedParagraphs: string[] = []

				// Check for resume from pause
				const resumeFrom = pausedChunkIndex[id]
				const startIndex = resumeFrom !== undefined ? resumeFrom : 0

				for (let i = startIndex; i < paragraphs.length; i++) {
					// Check current status by reading from state via setDocuments callback
					let shouldContinue = true
					setDocuments((prev) => {
						const currentDoc = prev.find((d) => d.id === id)
						if (!currentDoc || currentDoc.status === 'idle' || currentDoc.status === 'paused') {
							shouldContinue = false
							return prev
						}
						return prev.map((d) =>
							d.id === id
								? { ...d, progress: { current: i + 1, total: paragraphs.length, phase: 'localizing' } }
								: d
						)
					})

					if (!shouldContinue) break

					// Send ONLY this single paragraph to the LLM
					const userContent = promptTemplate
						.replace('{locale}', settings!.targetLocale)
						.replace('{text}', paragraphs[i])

					const result = await window.electron.generateAI({
						url: `${settings!.apiUrl}/chat/completions`,
						body: {
							model: settings!.model,
							messages: [{ role: 'user', content: userContent }],
							temperature: 0.2,
							max_tokens: 4096,
							stream: false,
						},
					})

					if (result.error) {
						throw new Error(result.error)
					}

					let content = result.content.trim()

					// Remove code fences if present
					if (content.startsWith('```')) {
						content = content
							.replace(/^```(?:markdown)?\n?/i, '')
							.replace(/\n?```$/i, '')
							.trim()
					}

					// Remove ---BEGIN TEXT--- marker and anything before it
					const beginMarker = content.indexOf('---BEGIN TEXT---')
					if (beginMarker !== -1) {
						content = content.slice(beginMarker + '---BEGIN TEXT---'.length)
					}

					// Remove ---END TEXT--- marker and anything after it
					const endMarker = content.indexOf('---END TEXT---')
					if (endMarker !== -1) {
						content = content.slice(0, endMarker)
					}

					// Remove any leading commentary
					content = content.replace(/^Here'?s? (?:the )?translation[.:].*/i, '').trim()
					content = content.replace(/^Translate the text above.*/i, '').trim()
					content = content.replace(/^Here(?:'|)s?.*translation.*/i, '').trim()

					// Remove trailing newlines
					content = content.trim()

					// Store result directly - no dedup needed since we process one paragraph at a time
					localizedParagraphs.push(content)

					// Write intermediate result
					await window.electron.writeTextFile(localizedPath, localizedParagraphs.join('\n\n'))
				}

				setDocuments((prev) =>
					prev.map((d) =>
						d.id === id
							? {
									...d,
									status: 'review',
									markdown,
									localizedText: localizedParagraphs.join('\n\n'),
									progress: undefined,
								}
							: d
					)
				)
				toast.success(`${doc.name} processed`)

				// Update history entry
				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'processed',
						chunksProcessed: paragraphs.length,
					})
				}
			} catch (err) {
				const cleanError = formatError(err)
				setDocuments((prev) =>
					prev.map((d) => (d.id === id ? { ...d, status: 'error', error: cleanError, progress: undefined } : d))
				)
				toast.error(`Failed to process ${doc.name}: ${cleanError}`)

				// Update history entry with error
				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'error',
						errorMessage: cleanError,
					})
				}
			}
		},
		[documents, isConfigured]
	)

	const handleProcessAll = useCallback(() => {
		documents
			.filter((d) => d.status === 'idle')
			.forEach((d) => {
				void handleProcess(d.id)
			})
	}, [documents, handleProcess])

	const handleStop = useCallback((id: string) => {
		setDocuments((prev) =>
			prev.map((d) => (d.id === id ? { ...d, status: 'idle', progress: undefined } : d))
		)
		setPausedChunkIndex((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})
		toast.info('Processing stopped')
	}, [])

	const handlePause = useCallback((id: string) => {
		const doc = documents.find((d) => d.id === id)
		if (!doc || doc.status !== 'localizing') return

		setIsPaused(true)
		setPausedChunkIndex((prev) => ({
			...prev,
			[id]: doc.progress?.current || 0,
		}))
		setDocuments((prev) =>
			prev.map((d) => (d.id === id ? { ...d, status: 'paused' } : d))
		)
		toast.info('Processing paused')
	}, [documents])

	const handleResume = useCallback((id: string) => {
		const resumeFrom = pausedChunkIndex[id] || 0
		setIsPaused(false)
		setPausedChunkIndex((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})
		setDocuments((prev) =>
			prev.map((d) =>
				d.id === id
					? { ...d, status: 'localizing', progress: { ...d.progress!, current: resumeFrom } }
					: d
			)
		)
	}, [pausedChunkIndex])

	const handleSaveSettings = useCallback(async () => {
		if (!settings) return
		await window.electron.saveSettings(settings)
		setShowSettings(false)
		toast.success('Settings saved')
	}, [settings])

	const handleClearHistory = useCallback(async () => {
		await window.electron.clearHistory()
		setHistory([])
	}, [])

	const handleApprove = useCallback(async () => {
		const doc = documents.find((d) => d.id === selectedDocId)
		setDocuments((prev) => prev.map((d) => (d.id === selectedDocId ? { ...d, status: 'approved', error: undefined } : d)))
		setSelectedDocId(null)
		toast.success('Document approved')

		// Update history with approved status
		if (doc) {
			const historyEntries = await window.electron.getHistory()
			const entry = historyEntries.find((h) => h.filePath === doc.path)
			if (entry) {
				await window.electron.updateHistory(entry.id, { status: 'approved' })
				setHistory(await window.electron.getHistory())
			}
		}
	}, [selectedDocId, documents])

	const handleReject = useCallback(async () => {
		const doc = documents.find((d) => d.id === selectedDocId)
		setDocuments((prev) => prev.map((d) => (d.id === selectedDocId ? { ...d, status: 'idle' } : d)))
		setSelectedDocId(null)

		// Update history with rejected status
		if (doc) {
			const historyEntries = await window.electron.getHistory()
			const entry = historyEntries.find((h) => h.filePath === doc.path)
			if (entry) {
				await window.electron.updateHistory(entry.id, { status: 'rejected' })
				setHistory(await window.electron.getHistory())
			}
		}
	}, [selectedDocId, documents])

	const handleUpdateLocalizedText = useCallback(
		(paragraphIndex: number, newText: string) => {
			setDocuments((prev) =>
				prev.map((d) => {
					if (d.id !== selectedDocId) return d

					const paragraphs = (d.localizedText || '').split(/\n\n+/)
					paragraphs[paragraphIndex] = newText

					return {
						...d,
						localizedText: paragraphs.join('\n\n'),
					}
				})
			)
			toast.success('Paragraph updated')
		},
		[selectedDocId]
	)

	const handleShiftLocalizedParagraph = useCallback(
		(paragraphIndex: number, direction: 'up' | 'down') => {
			setDocuments((prev) =>
				prev.map((d) => {
					if (d.id !== selectedDocId) return d

					const paragraphs = (d.localizedText || '').split(/\n\n+/)
					const swapIndex = direction === 'up' ? paragraphIndex - 1 : paragraphIndex + 1

					// Check bounds
					if (swapIndex < 0 || swapIndex >= paragraphs.length) {
						return d
					}

					// Swap paragraphs
					const temp = paragraphs[paragraphIndex]
					paragraphs[paragraphIndex] = paragraphs[swapIndex]
					paragraphs[swapIndex] = temp

					return {
						...d,
						localizedText: paragraphs.join('\n\n'),
					}
				})
			)
			toast.success(`Paragraph shifted ${direction}`)
		},
		[selectedDocId]
	)

	const handleInsertLocalizedParagraph = useCallback(
		(paragraphIndex: number, direction: 'above' | 'below') => {
			setDocuments((prev) =>
				prev.map((d) => {
					if (d.id !== selectedDocId) return d

					const paragraphs = (d.localizedText || '').split(/\n\n+/)
					const insertAt = direction === 'above' ? paragraphIndex : paragraphIndex + 1
					paragraphs.splice(insertAt, 0, '[New paragraph - edit this]')

					return {
						...d,
						localizedText: paragraphs.join('\n\n'),
					}
				})
			)
			toast.success(`Paragraph inserted ${direction}`)
		},
		[selectedDocId]
	)

	const handleDeleteLocalizedParagraph = useCallback(
		(paragraphIndex: number) => {
			setDocuments((prev) =>
				prev.map((d) => {
					if (d.id !== selectedDocId) return d

					const paragraphs = (d.localizedText || '').split(/\n\n+/)
					if (paragraphs.length <= 1) {
						toast.error('Cannot delete - document must have at least one paragraph')
						return d
					}
					paragraphs.splice(paragraphIndex, 1)

					return {
						...d,
						localizedText: paragraphs.join('\n\n'),
					}
				})
			)
			toast.success('Paragraph deleted')
		},
		[selectedDocId]
	)

	const handleExport = useCallback(
		async (id: string, format: ExportFormat) => {
			const doc = documents.find((d) => d.id === id)
			if (!doc) {
				toast.error('Document not found')
				return
			}
			if (!doc.localizedText) {
				toast.error('No localized text to export')
				return
			}

			try {
				const baseFilename = doc.name.replace(/\.[^.]+$/, '')
				const extension = getFileExtension(format)
				const defaultFilename = `${baseFilename}.localized${extension}`

				const savePath = await window.electron.saveFile({
					defaultPath: defaultFilename,
					filters: [format === 'pdf' ? { name: 'PDF', extensions: ['pdf'] } : { name: 'Markdown', extensions: ['md'] }],
				})

				if (!savePath) {
					return
				}

				if (format === 'pdf') {
					const pdfBlob = contentToPdf(doc.localizedText, baseFilename)
					const arrayBuffer = await pdfBlob.arrayBuffer()
					const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
					await window.electron.writeBase64File(savePath, base64)
				} else {
					await window.electron.writeTextFile(savePath, doc.localizedText)
				}
				toast.success(`Exported to ${savePath}`)
			} catch (err) {
				const cleanError = formatError(err)
				toast.error(`Export failed: ${cleanError}`)
			}
		},
		[documents]
	)

	const selectedDoc = documents.find((d) => d.id === selectedDocId)

	// Loading state
	if (isLoading) {
		return (
			<div className="h-screen bg-background text-foreground flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p>Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
			<Toaster position="bottom-right" richColors closeButton />

			<Header
				documents={documents}
				model={settings?.model}
				apiUrl={settings?.apiUrl}
				isConfigured={!!isConfigured}
				onSelectFiles={handleSelectFiles}
				onProcessAll={handleProcessAll}
				onOpenSettings={() => setShowSettings(true)}
				onOpenHistory={() => setShowHistory(true)}
			/>

			<main className="flex-1 p-6 overflow-auto">
				{selectedDocId && selectedDoc && (
					<DiffView
						document={selectedDoc}
						onApprove={handleApprove}
						onReject={handleReject}
						onBack={() => setSelectedDocId(null)}
						onUpdateLocalizedText={handleUpdateLocalizedText}
						onShiftLocalizedParagraph={handleShiftLocalizedParagraph}
						onInsertLocalizedParagraph={handleInsertLocalizedParagraph}
						onDeleteLocalizedParagraph={handleDeleteLocalizedParagraph}
					/>
				)}

				{!selectedDocId && documents.length === 0 && <EmptyState onFilesAdded={addFilesToDocuments} />}

				{!selectedDocId && documents.length > 0 && (
					<DocumentList
						documents={documents}
						onProcess={handleProcess}
						onReview={setSelectedDocId}
						onRemove={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
						onStop={handleStop}
						onPause={handlePause}
						onResume={handleResume}
						onFilesAdded={addFilesToDocuments}
						onExport={handleExport}
					/>
				)}
			</main>

			{showSettings && settings && (
				<SettingsModal
					settings={settings}
					onChange={setSettings}
					onSave={handleSaveSettings}
					onClose={() => setShowSettings(false)}
				/>
			)}

			<HistoryPanel
				history={history}
				isOpen={showHistory}
				onClose={() => setShowHistory(false)}
				onClear={handleClearHistory}
			/>
		</div>
	)
}
