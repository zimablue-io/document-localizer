import type { DocumentState } from '@doclocalizer/core'
import { chunkTextWithIndices, convertPdfToMarkdown, estimateContextSize } from '@doclocalizer/core'
import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import DiffView from './components/DiffView'
import DocumentList from './components/DocumentList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'

const DEFAULT_API_URL = 'http://localhost:8080/v1'
const DEFAULT_MODEL = 'llama:3.2:3b-instruct'

const DEFAULT_PROMPT = `You are a professional document localizer specializing in preserving the original author's voice and intent.

TRANSLATION RULES:
1. PRESERVE SEMANTIC MEANING:
   - Never simplify, generalize, or replace proper nouns (names, brand names, product names, place names)
   - Example: "He drove a Cadillac" → "He drove a Cadillac" (NOT "He drove a car")
   - Example: "The Eiffel Tower" → "The Eiffel Tower" (NOT "The famous tower")

2. PRESERVE CHARACTER VOICE AND SPEECH STYLES:
   - NEVER correct typos, misspellings, or grammatical errors that are intentional character traits
   - Example: "Excuse pleess" → "Excuse pleess" (NOT "Excuse me") - preserve the character's speech pattern
   - Example: "I don't know nothing" → "I don't know nothing" - preserve the character's dialect/grammar
   - Example: "He be talkin" → "He be talkin" - preserve AAVE or other dialectal speech patterns
   - Example: "Y'all" → "Y'all" - preserve regional/colloquial speech
   - Preserve ALL dialogue exactly as written, including speech quirks, stutters, accents represented in text
   - If a character's speech is informal, broken, or "incorrect" in the source, preserve that quality

3. PRESERVE STRUCTURE:
   - Keep paragraph breaks exactly as in the original
   - Preserve ALL markdown formatting (headings, bold, italic, quotes, dialogue, lists)

4. CULTURAL CONTEXT:
   - Maintain culturally specific references, idioms, and expressions
   - Adapt only when necessary for comprehension, never replace meaning

5. CONSISTENCY:
   - If a term appears multiple times, translate it the same way each time
   - Use formal register for technical content, match the original's formality

6. NO DUPLICATION:
   - Each paragraph should appear exactly once in the output
   - Never repeat content that already appeared earlier

OUTPUT FORMAT:
- Return ONLY the translated text
- NO markers, comments, explanations, or quotes around the output
- No leading/trailing whitespace

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
			} finally {
				setIsLoading(false)
			}
		}
		void init()
	}, [])

	useEffect(() => {
		if (!settings) return
		window.electron
			.testConnection?.(`${settings.apiUrl}/models`)
			.then((result: unknown) => {
				console.log('[App] Connection test result:', result)
			})
			.catch((err: unknown) => {
				console.error('[App] Connection test error:', err)
			})
	}, [settings?.apiUrl])

	const isConfigured = settings?.apiUrl && settings?.model && settings?.targetLocale

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

				const chunkResult = chunkTextWithIndices(markdown, parseInt(settings!.chunkSize, 10), parseInt(settings!.overlapSize, 10))
				const chunks = chunkResult.chunks
				const localizedPath = doc.path.replace(/\.pdf$/i, '.localized.md').replace(/\.md$/i, '.localized.md')
				await window.electron.writeTextFile(localizedPath, '')

				setDocuments((prev) =>
					prev.map((d) =>
						d.id === id
							? {
									...d,
									status: 'localizing',
									progress: { current: 0, total: chunks.length, phase: 'localizing' },
								}
							: d
					)
				)

				const promptTemplate = settings!.customPrompt || DEFAULT_PROMPT
				const localizedChunks: string[] = []

				// Check for resume from pause
				const resumeFrom = pausedChunkIndex[id]
				const startIndex = resumeFrom !== undefined ? resumeFrom : 0

				for (let i = startIndex; i < chunks.length; i++) {
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
								? { ...d, progress: { current: i + 1, total: chunks.length, phase: 'localizing' } }
								: d
						)
					})

					if (!shouldContinue) break

					const userContent = promptTemplate
						.replace('{locale}', settings!.targetLocale)
						.replace('{text}', chunks[i])

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

					// Remove any leading commentary like "Here's the translation..." or "Translate the text above..."
					content = content.replace(/^Here'?s? (?:the )?translation[.:].*/i, '').trim()
					content = content.replace(/^Translate the text above.*/i, '').trim()
					// Remove "Here is the translation of..." variations
					content = content.replace(/^Here(?:'|)s?.*translation.*/i, '').trim()

					// Remove trailing newlines
					content = content.trim()

					localizedChunks.push(content)
					await window.electron.writeTextFile(localizedPath, localizedChunks.join('\n\n'))
				}

				setDocuments((prev) =>
					prev.map((d) =>
						d.id === id
							? {
									...d,
									status: 'review',
									markdown,
									localizedText: localizedChunks.join('\n\n'),
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
						chunksProcessed: chunks.length,
					})
				}
			} catch (err) {
				const error = err instanceof Error ? err.message : 'Unknown error'
				setDocuments((prev) =>
					prev.map((d) => (d.id === id ? { ...d, status: 'error', error, progress: undefined } : d))
				)
				toast.error(`Failed to process ${doc.name}: ${error}`)

				// Update history entry with error
				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'error',
						errorMessage: error,
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

	const handleApprove = useCallback(async () => {
		const doc = documents.find((d) => d.id === selectedDocId)
		setDocuments((prev) => prev.map((d) => (d.id === selectedDocId ? { ...d, status: 'approved' } : d)))
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
			<Toaster position="top-right" richColors closeButton />

			<Header
				documents={documents}
				isConfigured={!!isConfigured}
				onSelectFiles={handleSelectFiles}
				onProcessAll={handleProcessAll}
				onOpenSettings={() => setShowSettings(true)}
			/>

			<main className="flex-1 p-6 overflow-auto">
				{selectedDocId && selectedDoc && (
					<DiffView
						document={selectedDoc}
						onApprove={handleApprove}
						onReject={handleReject}
						onBack={() => setSelectedDocId(null)}
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
		</div>
	)
}
