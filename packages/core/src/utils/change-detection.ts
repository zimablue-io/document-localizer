import { diffWords } from 'diff'
import type { ChangeReviewState, TextChange } from '../types'

/**
 * Detect granular changes between original and localized text
 */
export function detectChanges(originalText: string, localizedText: string): TextChange[] {
	const diffResult = diffWords(originalText, localizedText)
	const changes: TextChange[] = []

	let originalIndex = 0
	let localizedIndex = 0
	const paragraphIndex = 0
	const _wordIndex = 0

	// Split into paragraphs for context
	const originalParagraphs = originalText.split(/\n\n+/)

	for (const part of diffResult) {
		const partWords = part.value.split(/\s+/).filter(Boolean)

		if (part.added) {
			// Added text (in localized version)
			changes.push({
				id: crypto.randomUUID(),
				paragraphIndex,
				wordIndex: localizedIndex,
				originalText: '', // No original for added
				localizedText: part.value.trim(),
				context: getParagraphContext(originalParagraphs, paragraphIndex),
				status: 'pending',
				timestamp: new Date().toISOString(),
			})
			localizedIndex += partWords.length
		} else if (part.removed) {
			// Removed text (from original)
			changes.push({
				id: crypto.randomUUID(),
				paragraphIndex,
				wordIndex: originalIndex,
				originalText: part.value.trim(),
				localizedText: '', // No localized for removed
				context: getParagraphContext(originalParagraphs, paragraphIndex),
				status: 'pending',
				timestamp: new Date().toISOString(),
			})
			originalIndex += partWords.length
		} else {
			// Unchanged text
			originalIndex += partWords.length
			localizedIndex += partWords.length
		}
	}

	return changes
}

/**
 * Get surrounding context for a paragraph
 */
function getParagraphContext(paragraphs: string[], index: number): string {
	if (index < paragraphs.length) {
		return paragraphs[index].trim()
	}
	return ''
}

/**
 * Create a ChangeReviewState from a list of changes
 */
export function createChangeReviewState(changes: TextChange[]): ChangeReviewState {
	return {
		changes,
		totalChanges: changes.length,
		approvedCount: changes.filter((c) => c.status === 'approved').length,
		rejectedCount: changes.filter((c) => c.status === 'rejected').length,
		ignoredCount: changes.filter((c) => c.status === 'ignored').length,
		pendingCount: changes.filter((c) => c.status === 'pending').length,
	}
}

/**
 * Update a change's status
 */
export function updateChangeStatus(
	changes: TextChange[],
	changeId: string,
	newStatus: TextChange['status'],
	comment?: string
): TextChange[] {
	return changes.map((change) =>
		change.id === changeId ? { ...change, status: newStatus, comment: comment || change.comment } : change
	)
}

/**
 * Apply approved changes to reconstruct localized text
 */
export function applyApprovedChanges(originalText: string, localizedText: string, changes: TextChange[]): string {
	const diffResult = diffWords(originalText, localizedText)
	let result = ''

	const _changeIndex = 0
	const sortedChanges = [...changes].sort((a, b) => a.wordIndex - b.wordIndex)

	for (const part of diffResult) {
		if (part.removed) {
			// Check if this removed text was rejected or ignored
			const relevantChange = sortedChanges.find(
				(c) => c.originalText === part.value.trim() && (c.status === 'rejected' || c.status === 'ignored')
			)
			if (relevantChange) {
				// Keep original text instead of localized
				result += part.value
			}
		} else if (part.added) {
			// Check if this added text was approved (default) or rejected
			const relevantChange = sortedChanges.find(
				(c) => c.localizedText === part.value.trim() && c.status === 'rejected'
			)
			if (relevantChange) {
				// Don't include rejected text
			} else {
				result += part.value
			}
		} else {
			result += part.value
		}
	}

	return result
}

/**
 * Get change statistics
 */
export function getChangeStats(changes: TextChange[]) {
	return {
		total: changes.length,
		approved: changes.filter((c) => c.status === 'approved').length,
		rejected: changes.filter((c) => c.status === 'rejected').length,
		ignored: changes.filter((c) => c.status === 'ignored').length,
		pending: changes.filter((c) => c.status === 'pending').length,
	}
}
