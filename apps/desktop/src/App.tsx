import { convertPdfToMarkdown } from '@doclocalizer/core'
import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import DiffView from './components/DiffView'
import DocumentList from './components/DocumentList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import HistoryPanel from './components/HistoryPanel'
import SettingsModal from './components/SettingsModal'
import { contentToPdf, ExportFormat, getFileExtension } from './lib/export'
import { formatError } from './lib/utils'

const DEFAULT_API_URL = 'http://localhost:8080/v1'
const DEFAULT_MODEL = 'llama:3.2:3b-instruct'

const DEFAULT_PROMPT = `You are a professional translator. Translate the following text from {sourceLocale} to {targetLocale}.

REQUIREMENTS:
- Translate meaning accurately, not word-for-word
- Use natural, fluent {targetLocale} phrasing
- Maintain the same tone and formality level as the original
- Preserve all punctuation and paragraph structure
- Keep proper nouns (names, places) in their localized form if known

---BEGIN TEXT---
{text}
---END TEXT---

OUTPUT ONLY the translation. No explanations, comments, or markers.`

interface Locale {
	code: string
	name: string
}

interface ModelConfig {
	id: string
	name: string
}

interface Settings {
	apiUrl: string
	models: ModelConfig[]
	activeModelId: string
	chunkSize: string
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

			// Handle legacy single model or new models array
			const existingModels = (r.models as ModelConfig[]) || []
			const legacyModel = r.model as string

			// If we have a legacy model but no models array, convert
			let models = existingModels
			let activeModelId = (r.activeModelId as string) || ''

			if (legacyModel && models.length === 0) {
				const newModel: ModelConfig = {
					id: crypto.randomUUID(),
					name: legacyModel,
				}
				models = [newModel]
				activeModelId = newModel.id
			} else if (models.length > 0 && !activeModelId) {
				activeModelId = models[0].id
			}

			return {
				apiUrl: (r.apiUrl as string) || DEFAULT_API_URL,
				models,
				activeModelId,
				chunkSize: (r.chunkSize as string) || '1000',
				overlapSize: (r.overlapSize as string) || '100',
				sourceLocale: (r.sourceLocale as string) || '',
				targetLocale: (r.targetLocale as string) || '',
				customLocales: Array.isArray(r.customLocales)
					? r.customLocales
					: typeof r.customLocales === 'string'
						? JSON.parse(r.customLocales)
						: [],
			}
		}
	} catch (err) {
		console.error('Error loading settings:', err)
	}

	// Default with one model
	const defaultModel: ModelConfig = {
		id: crypto.randomUUID(),
		name: DEFAULT_MODEL,
	}
	return {
		apiUrl: DEFAULT_API_URL,
		models: [defaultModel],
		activeModelId: defaultModel.id,
		chunkSize: '1000',
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
	status: 'processed' | 'review' | 'approved' | 'rejected' | 'error'
	errorMessage?: string
	chunksProcessed?: number
}

// Source document type - uploaded files are permanent library, never modified
interface SourceDocument {
	id: string
	name: string
	path: string
	sourceLocale?: string
	targetLocale?: string
}

// Processing output type - created when processing starts
interface ProcessingOutput {
	id: string
	sourceDocId: string // Reference to source document
	sourceDocName: string // Original filename
	name: string // Output filename (e.g., "document.de-DE.localized.md")
	path: string // Path to output file
	sourceLocale: string
	targetLocale: string
	status: 'parsing' | 'localizing' | 'paused' | 'review' | 'approved' | 'rejected' | 'exported' | 'error'
	markdown?: string
	localizedText?: string
	progress?: { current: number; total: number }
	error?: string
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
	const [sourceDocs, setSourceDocs] = useState<SourceDocument[]>([])
	const [tasksDocs, setTasksDocs] = useState<ProcessingOutput[]>([])
	const [processedDocs, setProcessedDocs] = useState<ProcessingOutput[]>([])
	const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null)
	const [showSettings, setShowSettings] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [settings, setSettings] = useState<Settings | null>(null)
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [pausedChunkIndex, setPausedChunkIndex] = useState<Record<string, number>>({})
	const [connectionRefreshKey, setConnectionRefreshKey] = useState(0)

	// Load settings, history, source docs, tasks, and processed docs on mount
	useEffect(() => {
		async function init() {
			try {
				const loadedSettings = await loadSettings()
				setSettings(loadedSettings)

				const loadedHistory = (await window.electron.getHistory()) as HistoryEntry[]
				setHistory(loadedHistory)

				const loadedSource = (await window.electron.loadUploaded()) as SourceDocument[]
				if (loadedSource && Array.isArray(loadedSource)) {
					setSourceDocs(loadedSource)
				}

				const loadedTasks = (await window.electron.loadTasks()) as ProcessingOutput[]
				if (loadedTasks && Array.isArray(loadedTasks)) {
					setTasksDocs(loadedTasks)
				}

				const loadedProcessed = (await window.electron.loadProcessed()) as ProcessingOutput[]
				if (loadedProcessed && Array.isArray(loadedProcessed)) {
					setProcessedDocs(loadedProcessed)
				}
			} finally {
				setIsLoading(false)
			}
		}
		void init()
	}, [])

	// Persist source docs when they change
	useEffect(() => {
		if (isLoading) return
		void window.electron.saveUploaded(sourceDocs)
	}, [sourceDocs, isLoading])

	// Persist tasks docs when they change
	useEffect(() => {
		if (isLoading) return
		void window.electron.saveTasks(tasksDocs)
	}, [tasksDocs, isLoading])

	// Persist processed docs when they change
	useEffect(() => {
		if (isLoading) return
		void window.electron.saveProcessed(processedDocs)
	}, [processedDocs, isLoading])

	// Connection test removed - errors show when processing starts instead

	const isConfigured = settings?.apiUrl && settings?.models?.length

	// Get active model name
	const activeModelName =
		settings?.models?.find((m) => m.id === settings.activeModelId)?.name || settings?.models?.[0]?.name || ''
	const currentModel = activeModelName

	const addFilesToDocuments = useCallback(
		(paths: string[]) => {
			console.log('[addFilesToDocuments] called with paths:', paths)
			const existingPaths = new Set(sourceDocs.map((d) => d.path))
			const newPaths = paths.filter((p) => !existingPaths.has(p))

			if (newPaths.length === 0) {
				toast.warning('Files already added')
				return
			}

			// Source documents are permanent library entries
			const newDocs: SourceDocument[] = newPaths.map((path) => ({
				id: crypto.randomUUID(),
				name: path.split('/').pop() || path,
				path,
			}))
			console.log('[addFilesToDocuments] adding docs:', newDocs.map((d) => d.name))
			setSourceDocs((prev) => [...prev, ...newDocs])
			toast.success(`Added ${newPaths.length} file(s)`)
		},
		[sourceDocs]
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
		async (sourceDocId: string) => {
			console.log('[handleProcess] called with sourceDocId:', sourceDocId)

			const sourceDoc = sourceDocs.find((d) => d.id === sourceDocId)
			if (!sourceDoc) {
				console.log('[handleProcess] source document not found!')
				toast.error('Document not found')
				return
			}

			console.log('[handleProcess] found source doc:', sourceDoc.name)

			if (!settings || !isConfigured) {
				console.log('[handleProcess] not configured:', { settings: !!settings, isConfigured })
				toast.error('Please configure API URL and model in settings')
				setShowSettings(true)
				return
			}

			// Use per-document locale ONLY
			const sourceLocale = sourceDoc.sourceLocale
			const targetLocale = sourceDoc.targetLocale

			console.log('[handleProcess] locales:', { sourceLocale, targetLocale })

			if (!sourceLocale || !targetLocale) {
				toast.error('Please set source and target locales before processing')
				return
			}

			// Create output filename and path
			const outputName = sourceDoc.name
				.replace(/\.(pdf|md)$/i, `.${targetLocale}.localized.md`)
			const outputPath = sourceDoc.path
				.replace(/\.(pdf|md)$/i, `.${targetLocale}.localized.md`)

			// Create NEW processing output entry
			const outputId = crypto.randomUUID()
			const newOutput: ProcessingOutput = {
				id: outputId,
				sourceDocId: sourceDoc.id,
				sourceDocName: sourceDoc.name,
				name: outputName,
				path: outputPath,
				sourceLocale,
				targetLocale,
				status: 'parsing',
				progress: { current: 0, total: 1 },
			}

			// Add to tasksDocs immediately
			setTasksDocs((prev) => [...prev, newOutput])
			toast.info(`Processing ${sourceDoc.name} to ${targetLocale}...`)

			// Create history entry
			const historyEntry = await window.electron.addHistory({
				fileName: sourceDoc.name,
				filePath: sourceDoc.path,
				sourceLocale,
				targetLocale,
				processedAt: new Date().toISOString(),
				status: 'processed',
			})

			let markdown: string

			try {
				if (isPdfPath(sourceDoc.path)) {
					// PDF file - convert to markdown
					const bytes = await readPdfFile(sourceDoc.path)
					markdown = await convertPdfToMarkdown(bytes)

					// Save extracted markdown next to original
					const mdPath = sourceDoc.path.replace(/\.pdf$/i, '.md')
					await window.electron.writeTextFile(mdPath, markdown)
				} else {
					// .md file - read directly
					markdown = await readTextFile(sourceDoc.path)
				}

				// Split markdown into paragraphs - one paragraph per API call
				const paragraphs = markdown.split(/\n\n+/).filter((p) => p.trim())
				await window.electron.writeTextFile(outputPath, '')

				// Update status to localizing
				setTasksDocs((prev) =>
					prev.map((d) =>
						d.id === outputId
							? {
									...d,
									status: 'localizing',
									markdown,
									progress: { current: 0, total: paragraphs.length, phase: 'localizing' },
								}
							: d
					)
				)

				const promptTemplate = settings!.customPrompt || DEFAULT_PROMPT
				const localizedParagraphs: string[] = []

				// Check for resume from pause
				const resumeFrom = pausedChunkIndex[outputId]
				const startIndex = resumeFrom !== undefined ? resumeFrom : 0

				// Performance: process paragraphs in parallel batches
				const CONCURRENCY = 4
				const PROGRESS_UPDATE_INTERVAL = 5
				const DISK_WRITE_INTERVAL = 10

				// Helper to process a single paragraph
				const processParagraph = async (text: string): Promise<string> => {
					const content = promptTemplate
						.replace('{sourceLocale}', sourceLocale)
						.replace('{targetLocale}', targetLocale)
						.replace('{text}', text)

					const result = await window.electron.generateAI({
						url: `${settings!.apiUrl}/chat/completions`,
						body: {
							model: currentModel,
							messages: [{ role: 'user', content }],
							temperature: 0.2,
							max_tokens: 4096,
							stream: false,
						},
					})

					if (result.error) {
						throw new Error(result.error)
					}

					let processed = result.content.trim()

					// Remove code fences if present
					if (processed.startsWith('```')) {
						processed = processed
							.replace(/^```(?:markdown)?\n?/i, '')
							.replace(/\n?```$/i, '')
							.trim()
					}

					// Remove markers
					const beginMarker = processed.indexOf('---BEGIN TEXT---')
					if (beginMarker !== -1) {
						processed = processed.slice(beginMarker + '---BEGIN TEXT---'.length)
					}
					const endMarker = processed.indexOf('---END TEXT---')
					if (endMarker !== -1) {
						processed = processed.slice(0, endMarker)
					}

					// Remove any leading commentary
					processed = processed.replace(/^Here'?s? (?:the )?translation[.:].*/i, '').trim()
					processed = processed.replace(/^Translate the text above.*/i, '').trim()
					processed = processed.replace(/^Here(?:'|)s?.*translation.*/i, '').trim()

					return processed.trim()
				}

				// Helper to check if processing should continue
				let shouldContinue = true
				const checkContinue = (): boolean => {
					setTasksDocs((prev) => {
						const currentDoc = prev.find((d) => d.id === outputId)
						if (!currentDoc || currentDoc.status === 'paused') {
							shouldContinue = false
							return prev
						}
						return prev
					})
					return shouldContinue
				}

				// Helper to update progress (batched)
				const updateProgress = (current: number, total: number) => {
					if (current % PROGRESS_UPDATE_INTERVAL === 0 || current === total) {
						setTasksDocs((prev) =>
							prev.map((d) =>
								d.id === outputId ? { ...d, progress: { current, total, phase: 'localizing' } } : d
							)
						)
					}
				}

				// Helper to write intermediate results (batched)
				let lastWriteIndex = 0
				const maybeWrite = async () => {
					if (localizedParagraphs.length - lastWriteIndex >= DISK_WRITE_INTERVAL) {
						await window.electron.writeTextFile(outputPath, localizedParagraphs.join('\n\n'))
						lastWriteIndex = localizedParagraphs.length
					}
				}

				// Process in parallel batches
				for (let i = startIndex; i < paragraphs.length; i += CONCURRENCY) {
					if (!checkContinue()) break

					const batch = paragraphs.slice(i, i + CONCURRENCY)
					const results = await Promise.all(batch.map((p) => processParagraph(p)))
					localizedParagraphs.push(...results)

					updateProgress(Math.min(i + CONCURRENCY, paragraphs.length), paragraphs.length)
					await maybeWrite()
				}

				// Write final result
				await window.electron.writeTextFile(outputPath, localizedParagraphs.join('\n\n'))

				// Update to review status
				setTasksDocs((prev) =>
					prev.map((d) =>
						d.id === outputId
							? {
									...d,
									status: 'review',
									localizedText: localizedParagraphs.join('\n\n'),
									progress: undefined,
								}
							: d
					)
				)
				toast.success(`${sourceDoc.name} processed to ${targetLocale}`)

				// Update history entry
				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'review',
						chunksProcessed: paragraphs.length,
					})
				}
			} catch (err) {
				const cleanError = formatError(err)
				setTasksDocs((prev) =>
					prev.map((d) =>
						d.id === outputId ? { ...d, status: 'error', error: cleanError, progress: undefined } : d
					)
				)
				toast.error(`Failed to process ${sourceDoc.name}: ${cleanError}`)

				// Update history entry with error
				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'error',
						errorMessage: cleanError,
					})
				}
			}
		},
		[
			sourceDocs,
			currentModel,
			settings?.customPrompt,
			settings,
			pausedChunkIndex,
		]
	)

	const handleProcessAll = useCallback(() => {
		sourceDocs.forEach((d) => {
			// Only process if both locales are set
			if (d.sourceLocale && d.targetLocale) {
				void handleProcess(d.id)
			}
		})
	}, [sourceDocs, handleProcess])

	const handleStop = useCallback((id: string) => {
		setTasksDocs((prev) => prev.filter((d) => d.id !== id))
		setPausedChunkIndex((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})
		toast.info('Processing stopped')
	}, [])

	const handlePause = useCallback(
		(id: string) => {
			const doc = tasksDocs.find((d) => d.id === id)
			if (!doc || doc.status !== 'localizing') return

			setPausedChunkIndex((prev) => ({
				...prev,
				[id]: doc.progress?.current || 0,
			}))
			setTasksDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'paused' } : d)))
			toast.info('Processing paused')
		},
		[tasksDocs]
	)

	const handleResume = useCallback(
		(id: string) => {
			const resumeFrom = pausedChunkIndex[id] || 0
			setPausedChunkIndex((prev) => {
				const next = { ...prev }
				delete next[id]
				return next
			})
			setTasksDocs((prev) =>
				prev.map((d) =>
					d.id === id ? { ...d, status: 'localizing', progress: { ...d.progress!, current: resumeFrom } } : d
				)
			)
		},
		[pausedChunkIndex]
	)

	const handleSaveSettings = useCallback(async () => {
		if (!settings) return
		await window.electron.saveSettings(settings)
		setShowSettings(false)
		setConnectionRefreshKey((prev) => prev + 1)
		toast.success('Settings saved')
	}, [settings])

	const handleClearHistory = useCallback(async () => {
		await window.electron.clearHistory()
		setHistory([])
	}, [])

	const handleApprove = useCallback(async () => {
		const output = tasksDocs.find((d) => d.id === selectedOutputId)
		if (!output) return

		// Move from tasksDocs to processedDocs with 'approved' status
		setTasksDocs((prev) => prev.filter((d) => d.id !== selectedOutputId))
		setProcessedDocs((prev) => [...prev, { ...output, status: 'approved' }])
		setSelectedOutputId(null)
		toast.success('Document approved')

		// Update history with approved status
		const historyEntries = (await window.electron.getHistory()) as HistoryEntry[]
		const entry = historyEntries.find((h) => h.filePath === output.path)
		if (entry) {
			await window.electron.updateHistory(entry.id, { status: 'approved' })
			setHistory((await window.electron.getHistory()) as HistoryEntry[])
		}
	}, [selectedOutputId, tasksDocs])

	const handleReject = useCallback(async () => {
		const output = tasksDocs.find((d) => d.id === selectedOutputId)
		if (!output) return

		// Move from tasksDocs to processedDocs with 'rejected' status
		setTasksDocs((prev) => prev.filter((d) => d.id !== selectedOutputId))
		setProcessedDocs((prev) => [...prev, { ...output, status: 'rejected' }])
		setSelectedOutputId(null)

		// Update history with rejected status
		const historyEntries = (await window.electron.getHistory()) as HistoryEntry[]
		const entry = historyEntries.find((h) => h.filePath === output.path)
		if (entry) {
			await window.electron.updateHistory(entry.id, { status: 'rejected' })
			setHistory((await window.electron.getHistory()) as HistoryEntry[])
		}
	}, [selectedOutputId, tasksDocs])

	const handleUpdateLocalizedText = useCallback(
		(paragraphIndex: number, newText: string) => {
			setTasksDocs((prev) =>
				prev.map((d) => {
					if (d.id !== selectedOutputId) return d

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
		[selectedOutputId]
	)

	const handleShiftLocalizedParagraph = useCallback(
		(paragraphIndex: number, direction: 'up' | 'down') => {
			setTasksDocs((prev) =>
				prev.map((d) => {
					if (d.id !== selectedOutputId) return d

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
		[selectedOutputId]
	)

	const handleInsertLocalizedParagraph = useCallback(
		(paragraphIndex: number, direction: 'above' | 'below') => {
			setTasksDocs((prev) =>
				prev.map((d) => {
					if (d.id !== selectedOutputId) return d

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
		[selectedOutputId]
	)

	const handleDeleteLocalizedParagraph = useCallback(
		(paragraphIndex: number) => {
			setTasksDocs((prev) =>
				prev.map((d) => {
					if (d.id !== selectedOutputId) return d

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
		[selectedOutputId]
	)

	const handleExport = useCallback(
		async (id: string, format: ExportFormat) => {
			// Check both tasks and processed docs for the output
			const output = tasksDocs.find((d) => d.id === id) || processedDocs.find((d) => d.id === id)
			if (!output) {
				toast.error('Document not found')
				return
			}
			if (!output.localizedText) {
				toast.error('No localized text to export')
				return
			}

			try {
				const baseFilename = output.sourceDocName.replace(/\.[^.]+$/, '')
				const extension = getFileExtension(format)
				const defaultFilename = `${baseFilename}.localized${extension}`

				const savePath = await window.electron.saveFile({
					defaultPath: defaultFilename,
					filters: [
						format === 'pdf'
							? { name: 'PDF', extensions: ['pdf'] }
							: { name: 'Markdown', extensions: ['md'] },
					],
				})

				if (!savePath) {
					return
				}

				if (format === 'pdf') {
					const pdfBlob = contentToPdf(output.localizedText, baseFilename)
					const arrayBuffer = await pdfBlob.arrayBuffer()
					const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
					await window.electron.writeBase64File(savePath, base64)
				} else {
					await window.electron.writeTextFile(savePath, output.localizedText)
				}
				toast.success(`Exported to ${savePath}`)
			} catch (err) {
				const cleanError = formatError(err)
				toast.error(`Export failed: ${cleanError}`)
			}
		},
		[tasksDocs, processedDocs]
	)

	const selectedOutput = tasksDocs.find((d) => d.id === selectedOutputId)

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
				sourceDocuments={sourceDocs}
				models={settings?.models}
				activeModelId={settings?.activeModelId}
				apiUrl={settings?.apiUrl}
				isConfigured={!!isConfigured}
				connectionRefreshKey={connectionRefreshKey}
				onSelectFiles={handleSelectFiles}
				onProcessAll={handleProcessAll}
				onOpenSettings={() => setShowSettings(true)}
				onOpenHistory={() => setShowHistory(true)}
				onModelChange={(modelId) => setSettings((prev) => (prev ? { ...prev, activeModelId: modelId } : null))}
			/>

			<main className="flex-1 p-6 overflow-auto">
				{selectedOutputId && selectedOutput && (
					<DiffView
						document={selectedOutput}
						onApprove={handleApprove}
						onReject={handleReject}
						onBack={() => setSelectedOutputId(null)}
						onUpdateLocalizedText={handleUpdateLocalizedText}
						onShiftLocalizedParagraph={handleShiftLocalizedParagraph}
						onInsertLocalizedParagraph={handleInsertLocalizedParagraph}
						onDeleteLocalizedParagraph={handleDeleteLocalizedParagraph}
					/>
				)}

				{!selectedOutputId && sourceDocs.length === 0 && tasksDocs.length === 0 && processedDocs.length === 0 && (
					<EmptyState onFilesAdded={addFilesToDocuments} onSelectFiles={handleSelectFiles} />
				)}

				{!selectedOutputId && (sourceDocs.length > 0 || tasksDocs.length > 0 || processedDocs.length > 0) && (
					<DocumentList
						sourceDocs={sourceDocs}
						tasksDocs={tasksDocs}
						processedDocs={processedDocs}
						locales={
							settings?.customLocales?.length
								? settings.customLocales
								: [
										{ code: 'en-US', name: 'American English' },
										{ code: 'en-GB', name: 'British English' },
										{ code: 'en-AU', name: 'Australian English' },
										{ code: 'en-NZ', name: 'New Zealand English' },
									]
						}
						onProcess={handleProcess}
						onReview={setSelectedOutputId}
						onRemoveSource={(id) => setSourceDocs((prev) => prev.filter((d) => d.id !== id))}
						onRemoveTask={(id) => setTasksDocs((prev) => prev.filter((d) => d.id !== id))}
						onRemoveProcessed={(id) => setProcessedDocs((prev) => prev.filter((d) => d.id !== id))}
						onStop={handleStop}
						onPause={handlePause}
						onResume={handleResume}
						onFilesAdded={addFilesToDocuments}
						onExport={handleExport}
						onLocaleChange={(id, source, target) => {
							setSourceDocs((prev) =>
								prev.map((d) =>
									d.id === id
										? {
												...d,
												...(source && { sourceLocale: source }),
												...(target && { targetLocale: target }),
											}
										: d
								)
							)
						}}
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
