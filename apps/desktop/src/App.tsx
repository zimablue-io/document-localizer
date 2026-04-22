import type { DocumentState } from '@doclocalizer/core'
import { chunkText, convertPdfToMarkdown } from '@doclocalizer/core'
import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import DiffView from './components/DiffView'
import DocumentList from './components/DocumentList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import './index.css'

const DEFAULT_API_URL = 'http://localhost:11434/v1'
const DEFAULT_MODEL = 'qwen2.5:7b-instruct'

const DEFAULT_PROMPT = `You are a professional localization expert. Translate the following text to {locale}.

IMPORTANT RULES:
- Preserve ALL markdown formatting exactly (headings with #, emphasis with * or _, lists with - or numbers, code blocks with \`, etc.)
- Only change the actual text content, never modify formatting
- Do NOT add any commentary, notes, or explanations
- Do NOT use markers like ---BEGIN MARKDOWN--- or ---END MARKDOWN---
- Return ONLY the translated text

Text to translate:
{text}`

interface Locale {
	code: string
	name: string
}

interface Settings {
	apiUrl: string
	model: string
	chunkSize: string
	overlapSize: string
	sourceLocale: string
	targetLocale: string
	customLocales: Locale[]
	customPrompt?: string
}

function loadSettings(): Settings {
	return {
		apiUrl: localStorage.getItem('apiUrl') || DEFAULT_API_URL,
		model: localStorage.getItem('model') || DEFAULT_MODEL,
		chunkSize: localStorage.getItem('chunkSize') || '1000',
		overlapSize: localStorage.getItem('overlapSize') || '100',
		sourceLocale: localStorage.getItem('sourceLocale') || '',
		targetLocale: localStorage.getItem('targetLocale') || '',
		customLocales: JSON.parse(localStorage.getItem('customLocales') || '[]'),
		customPrompt: localStorage.getItem('customPrompt') || undefined,
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

export default function App() {
	const [documents, setDocuments] = useState<DocumentState[]>([])
	const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
	const [showSettings, setShowSettings] = useState(false)
	const [settings, setSettings] = useState<Settings>(loadSettings)

	useEffect(() => {
		window.electron
			.testConnection?.(`${settings.apiUrl}/models`)
			.then((result: unknown) => {
				console.log('[App] Connection test result:', result)
			})
			.catch((err: unknown) => {
				console.error('[App] Connection test error:', err)
			})
	}, [settings.apiUrl])

	const isConfigured = settings.apiUrl && settings.model

	const handleSelectFiles = useCallback(async () => {
		try {
			const files = await window.electron.openFile({ multiple: true })
			if (files && files.length > 0) {
				const newDocs: DocumentState[] = files.map((path) => ({
					id: crypto.randomUUID(),
					name: path.split('/').pop() || path,
					path,
					status: 'idle' as const,
				}))
				setDocuments((prev) => [...prev, ...newDocs])
				toast.success(`Added ${files.length} file(s)`)
			}
		} catch {
			toast.error('Failed to select files')
		}
	}, [])

	const handleProcess = useCallback(
		async (id: string) => {
			const doc = documents.find((d) => d.id === id)
			if (!doc) return

			if (!isConfigured) {
				toast.error('Please configure API URL and model in settings')
				setShowSettings(true)
				return
			}

			setDocuments((prev) =>
				prev.map((d) =>
					d.id === id ? { ...d, status: 'parsing', progress: { current: 0, total: 1, phase: 'parsing' } } : d
				)
			)

			try {
				const bytes = await readPdfFile(doc.path)
				const markdown = await convertPdfToMarkdown(bytes)

				const mdPath = doc.path.replace(/\.pdf$/i, '.md')
				await window.electron.writeTextFile(mdPath, markdown)

				const chunks = chunkText(markdown, parseInt(settings.chunkSize, 10), parseInt(settings.overlapSize, 10))
				const localizedPath = mdPath.replace(/\.md$/i, '.localized.md')
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

				const promptTemplate = settings.customPrompt || DEFAULT_PROMPT
				const localizedChunks: string[] = []

				for (let i = 0; i < chunks.length; i++) {
					setDocuments((prev) =>
						prev.map((d) =>
							d.id === id
								? { ...d, progress: { current: i + 1, total: chunks.length, phase: 'localizing' } }
								: d
						)
					)

					const userContent = promptTemplate
						.replace('{locale}', settings.targetLocale)
						.replace('{text}', chunks[i])

					const result = await window.electron.generateAI({
						url: `${settings.apiUrl}/chat/completions`,
						body: {
							model: settings.model,
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
					if (content.startsWith('```')) {
						content = content
							.replace(/^```(?:markdown)?\n?/i, '')
							.replace(/\n?```$/i, '')
							.trim()
					}

					localizedChunks.push(content)
					await window.electron.writeTextFile(localizedPath, localizedChunks.join('\n'))
				}

				setDocuments((prev) =>
					prev.map((d) =>
						d.id === id
							? {
									...d,
									status: 'review',
									markdown,
									localizedText: localizedChunks.join('\n'),
									progress: undefined,
								}
							: d
					)
				)
				toast.success(`${doc.name} processed`)
			} catch (err) {
				const error = err instanceof Error ? err.message : 'Unknown error'
				setDocuments((prev) =>
					prev.map((d) => (d.id === id ? { ...d, status: 'error', error, progress: undefined } : d))
				)
				toast.error(`Failed to process ${doc.name}: ${error}`)
			}
		},
		[documents, isConfigured, settings]
	)

	const handleProcessAll = useCallback(() => {
		documents
			.filter((d) => d.status === 'idle')
			.forEach((d) => {
				void handleProcess(d.id)
			})
	}, [documents, handleProcess])

	const handleSaveSettings = useCallback(() => {
		localStorage.setItem('apiUrl', settings.apiUrl)
		localStorage.setItem('model', settings.model)
		localStorage.setItem('chunkSize', settings.chunkSize)
		localStorage.setItem('overlapSize', settings.overlapSize)
		localStorage.setItem('sourceLocale', settings.sourceLocale)
		localStorage.setItem('targetLocale', settings.targetLocale)
		localStorage.setItem('customLocales', JSON.stringify(settings.customLocales))
		if (settings.customPrompt) {
			localStorage.setItem('customPrompt', settings.customPrompt)
		} else {
			localStorage.removeItem('customPrompt')
		}
		setShowSettings(false)
		toast.success('Settings saved')
	}, [settings])

	const handleApprove = useCallback(() => {
		setDocuments((prev) => prev.map((d) => (d.id === selectedDocId ? { ...d, status: 'approved' } : d)))
		setSelectedDocId(null)
		toast.success('Document approved')
	}, [selectedDocId])

	const handleReject = useCallback(() => {
		setDocuments((prev) => prev.map((d) => (d.id === selectedDocId ? { ...d, status: 'idle' } : d)))
		setSelectedDocId(null)
	}, [selectedDocId])

	const selectedDoc = documents.find((d) => d.id === selectedDocId)

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
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

				{!selectedDocId && documents.length === 0 && <EmptyState />}

				{!selectedDocId && documents.length > 0 && (
					<DocumentList
						documents={documents}
						onProcess={handleProcess}
						onReview={setSelectedDocId}
						onRemove={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
					/>
				)}
			</main>

			{showSettings && (
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
