/**
 * Document state management hook.
 * Handles source docs, tasks, processed docs, and their persistence.
 */
import { useCallback, useEffect, useState } from 'react'
import type { HistoryEntry, ProcessingOutput, SourceDocument } from '../lib/types'

/**
 * Document state and operations returned by the hook.
 */
export interface UseDocumentsReturn {
	sourceDocs: SourceDocument[]
	tasksDocs: ProcessingOutput[]
	processedDocs: ProcessingOutput[]
	history: HistoryEntry[]
	isLoading: boolean
	setSourceDocs: React.Dispatch<React.SetStateAction<SourceDocument[]>>
	setTasksDocs: React.Dispatch<React.SetStateAction<ProcessingOutput[]>>
	setProcessedDocs: React.Dispatch<React.SetStateAction<ProcessingOutput[]>>
	addSourceDocs: (paths: string[]) => SourceDocument[]
	removeSourceDoc: (id: string) => void
	removeTaskDoc: (id: string) => void
	removeProcessedDoc: (id: string) => void
	updateSourceLocales: (id: string, source?: string, target?: string) => void
	moveToProcessed: (output: ProcessingOutput, status: ProcessingOutput['status']) => void
	updateHistory: (newHistory: HistoryEntry[]) => void
	clearHistory: () => Promise<void>
}

/**
 * Hook for managing document state with automatic persistence.
 */
export function useDocuments(): UseDocumentsReturn {
	const [sourceDocs, setSourceDocs] = useState<SourceDocument[]>([])
	const [tasksDocs, setTasksDocs] = useState<ProcessingOutput[]>([])
	const [processedDocs, setProcessedDocs] = useState<ProcessingOutput[]>([])
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)

	// Load all data on mount
	useEffect(() => {
		async function init() {
			try {
				const [loadedHistory, loadedSource, loadedTasks, loadedProcessed] = await Promise.all([
					window.electron.getHistory() as Promise<HistoryEntry[]>,
					window.electron.loadUploaded() as Promise<SourceDocument[]>,
					window.electron.loadTasks() as Promise<ProcessingOutput[]>,
					window.electron.loadProcessed() as Promise<ProcessingOutput[]>,
				])

				setHistory(Array.isArray(loadedHistory) ? loadedHistory : [])
				setSourceDocs(Array.isArray(loadedSource) ? loadedSource : [])
				setTasksDocs(Array.isArray(loadedTasks) ? loadedTasks : [])
				setProcessedDocs(Array.isArray(loadedProcessed) ? loadedProcessed : [])
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

	/**
	 * Adds new source documents from file paths.
	 * Returns the newly added documents.
	 */
	const addSourceDocs = useCallback(
		(paths: string[]): SourceDocument[] => {
			const existingPaths = new Set(sourceDocs.map((d) => d.path))
			const newPaths = paths.filter((p) => !existingPaths.has(p))

			const newDocs: SourceDocument[] = newPaths.map((path) => ({
				id: crypto.randomUUID(),
				name: path.split('/').pop() || path,
				path,
			}))

			setSourceDocs((prev) => [...prev, ...newDocs])
			return newDocs
		},
		[sourceDocs]
	)

	/**
	 * Removes a source document by ID.
	 */
	const removeSourceDoc = useCallback((id: string) => {
		setSourceDocs((prev) => prev.filter((d) => d.id !== id))
	}, [])

	/**
	 * Removes a task document by ID.
	 */
	const removeTaskDoc = useCallback((id: string) => {
		setTasksDocs((prev) => prev.filter((d) => d.id !== id))
	}, [])

	/**
	 * Removes a processed document by ID.
	 */
	const removeProcessedDoc = useCallback((id: string) => {
		setProcessedDocs((prev) => prev.filter((d) => d.id !== id))
	}, [])

	/**
	 * Updates locale settings for a source document.
	 */
	const updateSourceLocales = useCallback((id: string, source?: string, target?: string) => {
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
	}, [])

	/**
	 * Moves a processing output from tasks to processed (or vice versa).
	 */
	const moveToProcessed = useCallback((output: ProcessingOutput, status: ProcessingOutput['status']) => {
		setTasksDocs((prev) => prev.filter((d) => d.id !== output.id))
		setProcessedDocs((prev) => [...prev, { ...output, status }])
	}, [])

	/**
	 * Updates the history state.
	 */
	const updateHistory = useCallback((newHistory: HistoryEntry[]) => {
		setHistory(newHistory)
	}, [])

	/**
	 * Clears all history.
	 */
	const clearHistory = useCallback(async () => {
		await window.electron.clearHistory()
		setHistory([])
	}, [])

	return {
		sourceDocs,
		tasksDocs,
		processedDocs,
		history,
		isLoading,
		setSourceDocs,
		setTasksDocs,
		setProcessedDocs,
		addSourceDocs,
		removeSourceDoc,
		removeTaskDoc,
		removeProcessedDoc,
		updateSourceLocales,
		moveToProcessed,
		updateHistory,
		clearHistory,
	}
}
