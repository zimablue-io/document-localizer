/**
 * Tests for word-level diff functionality
 *
 * Run with: cd packages/core && npx vitest run src/__tests__/diff-view.test.ts
 */

import { diffWords } from 'diff'
import { describe, expect, it } from 'vitest'

describe('Word-level Diff', () => {
	it('should detect single word difference', () => {
		const oldText = 'color'
		const newText = 'colour'
		const diff = diffWords(oldText, newText)

		const removed = diff.filter((d) => d.removed)
		const added = diff.filter((d) => d.added)

		expect(removed.length).toBe(1)
		expect(added.length).toBe(1)
		expect(removed[0].value).toBe('color')
		expect(added[0].value).toBe('colour')
	})

	it('should detect multiple word differences', () => {
		const oldText = 'The harbor is colorful'
		const newText = 'The harbour is colourful'
		const diff = diffWords(oldText, newText)

		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBeGreaterThan(0)
	})

	it('should detect no difference for identical text', () => {
		const text = 'Same text here'
		const diff = diffWords(text, text)

		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBe(0)
	})

	it('should handle paragraphs', () => {
		const oldText = 'First paragraph.\n\nSecond paragraph.'
		const newText = 'First paragraph.\n\nSecond paragraph.'
		const diff = diffWords(oldText, newText)

		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBe(0)
	})
})

describe('DocumentState for DiffView', () => {
	interface DocumentState {
		id: string
		name: string
		path: string
		status: 'idle' | 'parsing' | 'localizing' | 'review' | 'approved' | 'rejected' | 'error'
		markdown?: string
		localizedText?: string
		progress?: { current: number; total: number; phase: string }
		error?: string
	}

	it('should have markdown content', () => {
		const doc: DocumentState = {
			id: '1',
			name: 'test.md',
			path: '/test.md',
			status: 'review',
			markdown: 'Original text with color',
			localizedText: 'Original text with colour',
		}

		expect(doc.markdown).toBeDefined()
		expect(doc.localizedText).toBeDefined()
		expect(doc.markdown).not.toBe(doc.localizedText)
	})

	it('should detect differences between markdown and localizedText', () => {
		const doc: DocumentState = {
			id: '1',
			name: 'test.md',
			path: '/test.md',
			status: 'review',
			markdown: 'The harbor is beautiful',
			localizedText: 'The harbour is beautiful',
		}

		const diff = diffWords(doc.markdown || '', doc.localizedText || '')
		const changes = diff.filter((d) => d.removed || d.added)

		expect(changes.length).toBeGreaterThan(0)
		// Should have "harbor" removed and "harbour" added
		const harborRemoved = diff.find((d) => d.removed && d.value === 'harbor')
		const harbourAdded = diff.find((d) => d.added && d.value === 'harbour')
		expect(harborRemoved).toBeDefined()
		expect(harbourAdded).toBeDefined()
	})
})

describe('Diff Output Formatting', () => {
	it('should format removed words for display', () => {
		const oldText = 'color'
		const newText = 'colour'
		const diff = diffWords(oldText, newText)

		// Removed should be strikethrough
		const removedPart = diff.find((d) => d.removed)
		expect(removedPart?.value).toBe('color')
	})

	it('should format added words for display', () => {
		const oldText = 'color'
		const newText = 'colour'
		const diff = diffWords(oldText, newText)

		// Added should be highlighted
		const addedPart = diff.find((d) => d.added)
		expect(addedPart?.value).toBe('colour')
	})

	it('should preserve context around changes', () => {
		const oldText = 'The harbor is nice'
		const newText = 'The harbour is nice'
		const diff = diffWords(oldText, newText)

		// Should have changed parts (harbor vs harbour)
		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBeGreaterThan(0)
	})
})

describe('Edge Cases', () => {
	it('should handle empty strings', () => {
		const diff = diffWords('', '')
		// Empty strings produce empty diff array
		expect(diff.length).toBe(0)
	})

	it('should handle completely different text', () => {
		const oldText = 'Hello world'
		const newText = 'Goodbye world'
		const diff = diffWords(oldText, newText)
		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBeGreaterThan(0)
	})

	it('should handle special characters', () => {
		const oldText = '"Hello," she said.'
		const newText = '"Hello," she said.'
		const diff = diffWords(oldText, newText)
		const changes = diff.filter((d) => d.removed || d.added)
		expect(changes.length).toBe(0)
	})
})
