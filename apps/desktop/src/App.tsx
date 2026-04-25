import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import DiffView from './components/DiffView'
import DocumentList from './components/DocumentList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import HistoryPanel from './components/HistoryPanel'
import SettingsModal from './components/SettingsModal'
import { useDocuments } from './hooks/useDocuments'
import { contentToPdf, ExportFormat, getFileExtension } from './lib/export'
import { ALL_LOCALES } from './lib/locales'
import { createProcessingOutput, processDocument } from './lib/processing'
import { loadSettings, saveSettings } from './lib/settings'
import type { HistoryEntry, Settings } from './lib/types'
import { formatError } from './lib/utils'

export default function App() {
	const {
		sourceDocs,
		tasksDocs,
		processedDocs,
		history,
		isLoading,
		setTasksDocs,
		addSourceDocs,
		removeSourceDoc,
		removeTaskDoc,
		removeProcessedDoc,
		updateSourceLocales,
		updateHistory,
		clearHistory,
	} = useDocuments()

	const [settings, setSettings] = useState<Settings | null>(null)
	const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null)
	const [showSettings, setShowSettings] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const [connectionRefreshKey, setConnectionRefreshKey] = useState(0)
	const [pausedChunkIndex, setPausedChunkIndex] = useState<Record<string, number>>({})

	// Load settings on mount
	useEffect(() => {
		void loadSettings().then(setSettings)
	}, [])

	const isConfigured = settings?.apiUrl && settings?.models?.length

	const activeModelName =
		settings?.models?.find((m) => m.id === settings.activeModelId)?.name || settings?.models?.[0]?.name || ''

	const handleSelectFiles = useCallback(async () => {
		try {
			const files = await window.electron.openFile({ multiple: true })
			if (files && files.length > 0) {
				const newDocs = addSourceDocs(files)
				toast.success(`Added ${newDocs.length} file(s)`)
			}
		} catch {
			toast.error('Failed to select files')
		}
	}, [addSourceDocs])

	const handleProcess = useCallback(
		async (sourceDocId: string) => {
			const sourceDoc = sourceDocs.find((d) => d.id === sourceDocId)
			if (!sourceDoc) {
				toast.error('Document not found')
				return
			}

			if (!settings || !isConfigured) {
				toast.error('Please configure API URL and model in settings')
				setShowSettings(true)
				return
			}

			const sourceLocale = sourceDoc.sourceLocale
			const targetLocale = sourceDoc.targetLocale

			if (!sourceLocale || !targetLocale) {
				toast.error('Please set source and target locales before processing')
				return
			}

			const newOutput = createProcessingOutput(sourceDoc, targetLocale)
			setTasksDocs((prev) => [...prev, newOutput])
			toast.info(`Processing ${sourceDoc.name} to ${targetLocale}...`)

			const historyEntry = await window.electron.addHistory({
				fileName: sourceDoc.name,
				filePath: sourceDoc.path,
				sourceLocale,
				targetLocale,
				processedAt: new Date().toISOString(),
				status: 'processed',
			})

			try {
				const result = await processDocument({
					sourceDoc,
					apiUrl: settings.apiUrl,
					model: activeModelName,
					customPrompt: settings.customPrompt,
					sourceLocale,
					targetLocale,
					onStatusChange: (status, progress) => {
						setTasksDocs((prev) =>
							prev.map((d) => (d.id === newOutput.id ? { ...d, status, progress } : d))
						)
					},
					onProgress: (current, total) => {
						setTasksDocs((prev) =>
							prev.map((d) =>
								d.id === newOutput.id ? { ...d, progress: { current, total, phase: 'localizing' } } : d
							)
						)
					},
					onIntermediateWrite: async (text) => {
						await window.electron.writeTextFile(newOutput.path, text)
					},
					resumeFromParagraph: pausedChunkIndex[newOutput.id],
				})

				setTasksDocs((prev) =>
					prev.map((d) =>
						d.id === newOutput.id
							? {
									...d,
									status: 'review',
									localizedText: result.localizedText,
									markdown: result.markdown,
									progress: undefined,
								}
							: d
					)
				)
				toast.success(`${sourceDoc.name} processed to ${targetLocale}`)

				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'review',
						chunksProcessed: result.paragraphsProcessed,
					})
				}
			} catch (err) {
				const cleanError = formatError(err)
				setTasksDocs((prev) =>
					prev.map((d) =>
						d.id === newOutput.id ? { ...d, status: 'error', error: cleanError, progress: undefined } : d
					)
				)
				toast.error(`Failed to process ${sourceDoc.name}: ${cleanError}`)

				if (historyEntry?.id) {
					await window.electron.updateHistory(historyEntry.id, {
						status: 'error',
						errorMessage: cleanError,
					})
				}
			}
		},
		[sourceDocs, settings, activeModelName, pausedChunkIndex, setTasksDocs, isConfigured]
	)

	const handleProcessAll = useCallback(() => {
		sourceDocs.forEach((d) => {
			if (d.sourceLocale && d.targetLocale) {
				void handleProcess(d.id)
			}
		})
	}, [sourceDocs, handleProcess])

	const handleStop = useCallback(
		(id: string) => {
			setTasksDocs((prev) => prev.filter((d) => d.id !== id))
			setPausedChunkIndex((prev) => {
				const next = { ...prev }
				delete next[id]
				return next
			})
			toast.info('Processing stopped')
		},
		[setTasksDocs]
	)

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
		[tasksDocs, setTasksDocs]
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
		[pausedChunkIndex, setTasksDocs]
	)

	const handleSaveSettings = useCallback(async () => {
		if (!settings) return
		await saveSettings(settings)
		setShowSettings(false)
		setConnectionRefreshKey((prev) => prev + 1)
		toast.success('Settings saved')
	}, [settings])

	const handleApprove = useCallback(async () => {
		const output = tasksDocs.find((d) => d.id === selectedOutputId)
		if (!output) return

		setTasksDocs((prev) => prev.filter((d) => d.id !== selectedOutputId))
		processedDocs // trigger re-render if needed
		toast.success('Document approved')

		const historyEntries = (await window.electron.getHistory()) as HistoryEntry[]
		const entry = historyEntries.find((h) => h.filePath === output.path)
		if (entry) {
			await window.electron.updateHistory(entry.id, { status: 'approved' })
			updateHistory((await window.electron.getHistory()) as HistoryEntry[])
		}
	}, [
		selectedOutputId,
		tasksDocs,
		updateHistory,
		processedDocs, // trigger re-render if needed
		setTasksDocs,
	])

	const handleReject = useCallback(async () => {
		const output = tasksDocs.find((d) => d.id === selectedOutputId)
		if (!output) return

		setTasksDocs((prev) => prev.filter((d) => d.id !== selectedOutputId))
		toast.success('Document rejected')

		const historyEntries = (await window.electron.getHistory()) as HistoryEntry[]
		const entry = historyEntries.find((h) => h.filePath === output.path)
		if (entry) {
			await window.electron.updateHistory(entry.id, { status: 'rejected' })
			updateHistory((await window.electron.getHistory()) as HistoryEntry[])
		}
	}, [selectedOutputId, tasksDocs, updateHistory, setTasksDocs])

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
		[selectedOutputId, setTasksDocs]
	)

	const handleShiftLocalizedParagraph = useCallback(
		(paragraphIndex: number, direction: 'up' | 'down') => {
			setTasksDocs((prev) =>
				prev.map((d) => {
					if (d.id !== selectedOutputId) return d

					const paragraphs = (d.localizedText || '').split(/\n\n+/)
					const swapIndex = direction === 'up' ? paragraphIndex - 1 : paragraphIndex + 1

					if (swapIndex < 0 || swapIndex >= paragraphs.length) return d

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
		[selectedOutputId, setTasksDocs]
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
		[selectedOutputId, setTasksDocs]
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
		[selectedOutputId, setTasksDocs]
	)

	const handleExport = useCallback(
		async (id: string, format: ExportFormat) => {
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

				if (!savePath) return

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
				toast.error(`Export failed: ${formatError(err)}`)
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

				{!selectedOutputId &&
					sourceDocs.length === 0 &&
					tasksDocs.length === 0 &&
					processedDocs.length === 0 && (
						<EmptyState onFilesAdded={addSourceDocs} onSelectFiles={handleSelectFiles} />
					)}

				{!selectedOutputId && (sourceDocs.length > 0 || tasksDocs.length > 0 || processedDocs.length > 0) && (
					<DocumentList
						sourceDocs={sourceDocs}
						tasksDocs={tasksDocs}
						processedDocs={processedDocs}
						locales={
							settings?.enabledLocaleCodes?.length
								? ALL_LOCALES.filter((l) => settings.enabledLocaleCodes.includes(l.code))
								: ALL_LOCALES
						}
						onProcess={handleProcess}
						onReview={setSelectedOutputId}
						onRemoveSource={removeSourceDoc}
						onRemoveTask={removeTaskDoc}
						onRemoveProcessed={removeProcessedDoc}
						onStop={handleStop}
						onPause={handlePause}
						onResume={handleResume}
						onFilesAdded={addSourceDocs}
						onExport={handleExport}
						onLocaleChange={(id, source, target) => {
							updateSourceLocales(id, source, target)
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
				onClear={clearHistory}
			/>
		</div>
	)
}
