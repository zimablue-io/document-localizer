/**
 * Chunk management utilities for paragraph-based processing
 */

import type { Chunk, ChunkStatus, ProcessingState } from '../types'

// Context window estimates (characters, assuming ~4 chars per token)
const CONTEXT_ESTIMATES = {
	SMALL: 3000, // 4K model
	MEDIUM: 6000, // 8K model
	LARGE: 24000, // 32K model
	XLARGE: 96000, // 128K model
}

export type ContextSize = keyof typeof CONTEXT_ESTIMATES

/**
 * Estimate context size based on model name
 */
export function estimateContextSize(modelName: string): ContextSize {
	const lower = modelName.toLowerCase()

	// Local models typically have smaller contexts
	if (lower.includes('7b')) return 'SMALL'
	if (lower.includes('8b') || lower.includes('3b')) return 'MEDIUM'
	if (lower.includes('70b') || lower.includes('405b')) return 'LARGE'

	// Default to medium
	return 'MEDIUM'
}

/**
 * Get recommended chunk size for a model
 */
export function getRecommendedChunkSize(contextSize: ContextSize): number {
	// Reserve 30% for prompt, response, and overhead
	return Math.floor(CONTEXT_ESTIMATES[contextSize] * 0.7)
}

/**
 * Create processing state for a document
 */
export function createProcessingState(documentId: string, chunks: Chunk[]): ProcessingState {
	return {
		documentId,
		chunks,
		totalChunks: chunks.length,
		completedChunks: 0,
		failedChunks: 0,
		currentChunkIndex: 0,
	}
}

/**
 * Update chunk status in processing state
 */
export function updateChunkStatus(
	state: ProcessingState,
	chunkId: string,
	newStatus: ChunkStatus,
	localizedText?: string,
	error?: string
): ProcessingState {
	const updatedChunks = state.chunks.map((chunk) => {
		if (chunk.id === chunkId) {
			const updated: Chunk = {
				...chunk,
				status: newStatus,
			}
			if (localizedText !== undefined) {
				updated.localizedText = localizedText
				updated.processedAt = new Date().toISOString()
			}
			if (error !== undefined) {
				updated.error = error
			}
			return updated
		}
		return chunk
	})

	const completedChunks = updatedChunks.filter((c) => c.status === 'completed').length
	const failedChunks = updatedChunks.filter((c) => c.status === 'failed').length
	const currentChunkIndex = updatedChunks.findIndex((c) => c.status === 'pending' || c.status === 'processing')

	return {
		...state,
		chunks: updatedChunks,
		completedChunks,
		failedChunks,
		currentChunkIndex: currentChunkIndex === -1 ? state.totalChunks : currentChunkIndex,
	}
}

/**
 * Get processing progress percentage
 */
export function getProcessingProgress(state: ProcessingState): number {
	if (state.totalChunks === 0) return 0
	const done = state.completedChunks + state.failedChunks
	return Math.round((done / state.totalChunks) * 100)
}

/**
 * Get next pending chunk
 */
export function getNextPendingChunk(state: ProcessingState): Chunk | undefined {
	return state.chunks.find((c) => c.status === 'pending')
}

/**
 * Retry failed chunks
 */
export function resetFailedChunks(state: ProcessingState): ProcessingState {
	const updatedChunks = state.chunks.map((chunk) => {
		if (chunk.status === 'failed') {
			return { ...chunk, status: 'pending' as const, error: undefined }
		}
		return chunk
	})

	const failedChunks = 0
	const currentChunkIndex = updatedChunks.findIndex((c) => c.status === 'pending' || c.status === 'processing')

	return {
		...state,
		chunks: updatedChunks,
		failedChunks,
		currentChunkIndex: currentChunkIndex === -1 ? state.totalChunks : currentChunkIndex,
	}
}

/**
 * Combine localized chunks into final text
 */
export function combineLocalizedChunks(state: ProcessingState): string {
	// Sort chunks by their first paragraph index
	const completedChunks = state.chunks
		.filter((c) => c.status === 'completed' && c.localizedText)
		.sort((a, b) => {
			const aFirst = a.paragraphIndices[0] ?? 0
			const bFirst = b.paragraphIndices[0] ?? 0
			return aFirst - bFirst
		})

	return completedChunks.map((c) => c.localizedText).join('\n\n')
}

/**
 * Generate summary statistics for processing
 */
export function getProcessingStats(state: ProcessingState) {
	return {
		total: state.totalChunks,
		completed: state.completedChunks,
		failed: state.failedChunks,
		pending: state.totalChunks - state.completedChunks - state.failedChunks,
		progress: getProcessingProgress(state),
	}
}
