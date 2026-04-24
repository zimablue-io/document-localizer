/**
 * Comprehensive tests for DiffView column rendering
 *
 * These tests verify:
 * 1. LEFT column shows ONLY original text
 * 2. RIGHT column shows ONLY localized text
 * 3. Removed words are highlighted in red on LEFT
 * 4. Added words are highlighted in green on RIGHT
 * 5. Unchanged words are shown plain in both
 *
 * Run with: cd packages/core && npx vitest run src/__tests__/diff-view-rendering.test.ts
 */

import { diffWords } from 'diff'
import { describe, expect, it } from 'vitest'

// Replicate the rendering logic for testing
function getOriginalColumnParts(orig: string, loc: string) {
	const diff = diffWords(orig, loc)
	const parts: { value: string; type: 'original' | 'removed' | 'skipped' }[] = []

	for (const part of diff) {
		if (part.removed) {
			parts.push({ value: part.value, type: 'removed' })
		} else if (part.added) {
			parts.push({ value: part.value, type: 'skipped' })
		} else {
			parts.push({ value: part.value, type: 'original' })
		}
	}

	return parts
}

function getLocalizedColumnParts(orig: string, loc: string) {
	const diff = diffWords(orig, loc)
	const parts: { value: string; type: 'localized' | 'added' | 'skipped' }[] = []

	for (const part of diff) {
		if (part.added) {
			parts.push({ value: part.value, type: 'added' })
		} else if (part.removed) {
			parts.push({ value: part.value, type: 'skipped' })
		} else {
			parts.push({ value: part.value, type: 'localized' })
		}
	}

	return parts
}

function extractText(parts: { value: string; type: string }[], includeSkipped = false) {
	return parts
		.filter((p) => includeSkipped || p.type !== 'skipped')
		.map((p) => p.value)
		.join('')
}

function extractHighlighted(parts: { value: string; type: string }[], highlightType: string) {
	return parts.filter((p) => p.type === highlightType).map((p) => p.value.trim())
}

describe('Column Separation - Core Requirement', () => {
	describe('LEFT column shows ONLY original text', () => {
		it('should not include added words in left column', () => {
			const orig = 'quick'
			const loc = 'fast'
			const parts = getOriginalColumnParts(orig, loc)

			// Left column should NOT contain added words (they don't exist in original)
			const addedWords = extractHighlighted(parts, 'skipped')
			expect(addedWords).toContain('fast')
			expect(addedWords).not.toContain('quick')
		})

		it('should reconstruct original text in left column', () => {
			const orig = 'The quick brown fox'
			const loc = 'The fast brown fox'
			const parts = getOriginalColumnParts(orig, loc)
			const leftText = extractText(parts)

			// Left column should equal original
			expect(leftText).toBe(orig)
		})

		it('should handle multiple word changes', () => {
			const orig = 'color harbourful organized'
			const loc = 'colour colorful organised'
			const parts = getOriginalColumnParts(orig, loc)
			const leftText = extractText(parts)

			expect(leftText).toBe(orig)
		})
	})

	describe('RIGHT column shows ONLY localized text', () => {
		it('should not include removed words in right column', () => {
			const orig = 'quick'
			const loc = 'fast'
			const parts = getLocalizedColumnParts(orig, loc)

			// Right column should NOT contain removed words (they don't exist in localized)
			const removedWords = extractHighlighted(parts, 'skipped')
			expect(removedWords).toContain('quick')
			expect(removedWords).not.toContain('fast')
		})

		it('should reconstruct localized text in right column', () => {
			const orig = 'The quick brown fox'
			const loc = 'The fast brown fox'
			const parts = getLocalizedColumnParts(orig, loc)
			const rightText = extractText(parts)

			// Right column should equal localized
			expect(rightText).toBe(loc)
		})

		it('should handle multiple word changes', () => {
			const orig = 'color harbourful organized'
			const loc = 'colour colorful organised'
			const parts = getLocalizedColumnParts(orig, loc)
			const rightText = extractText(parts)

			expect(rightText).toBe(loc)
		})
	})
})

describe('Highlighting - Visual Diff Feedback', () => {
	describe('LEFT column highlights removed words in red', () => {
		it('should mark single word change as removed', () => {
			const orig = 'quick'
			const loc = 'fast'
			const parts = getOriginalColumnParts(orig, loc)
			const removedParts = parts.filter((p) => p.type === 'removed')

			expect(removedParts.length).toBe(1)
			expect(removedParts[0].value.trim()).toBe('quick')
		})

		it('should mark multiple words as removed when changed', () => {
			const orig = 'harborful'
			const loc = 'colorful'
			const parts = getOriginalColumnParts(orig, loc)
			const removedParts = parts.filter((p) => p.type === 'removed')

			// Word-level diff may split these differently
			expect(removedParts.length).toBeGreaterThan(0)
			// The removed content should include 'harborful' or parts of it
			const removedText = removedParts.map((p) => p.value).join('')
			expect(removedText).toContain('harbor')
		})
	})

	describe('RIGHT column highlights added words in green', () => {
		it('should mark single word addition as added', () => {
			const orig = 'quick'
			const loc = 'fast'
			const parts = getLocalizedColumnParts(orig, loc)
			const addedParts = parts.filter((p) => p.type === 'added')

			expect(addedParts.length).toBe(1)
			expect(addedParts[0].value.trim()).toBe('fast')
		})

		it('should mark new words as added', () => {
			const orig = 'Hello world'
			const loc = 'Hello beautiful world'
			const parts = getLocalizedColumnParts(orig, loc)
			const addedParts = parts.filter((p) => p.type === 'added')

			const addedText = addedParts.map((p) => p.value).join('')
			expect(addedText).toContain('beautiful')
		})
	})
})

describe('Unchanged Words', () => {
	it('should show unchanged words as plain text in left column', () => {
		const orig = 'The quick fox'
		const loc = 'The fast fox'
		const parts = getOriginalColumnParts(orig, loc)
		const originalParts = parts.filter((p) => p.type === 'original')

		const originalText = originalParts.map((p) => p.value).join('')
		expect(originalText).toContain('The ')
		expect(originalText).toContain(' fox')
	})

	it('should show unchanged words as plain text in right column', () => {
		const orig = 'The quick fox'
		const loc = 'The fast fox'
		const parts = getLocalizedColumnParts(orig, loc)
		const localizedParts = parts.filter((p) => p.type === 'localized')

		const localizedText = localizedParts.map((p) => p.value).join('')
		expect(localizedText).toContain('The ')
		expect(localizedText).toContain(' fox')
	})
})

describe('Edge Cases', () => {
	it('handles identical text (no changes)', () => {
		const text = 'Same text unchanged'
		const leftParts = getOriginalColumnParts(text, text)
		const rightParts = getLocalizedColumnParts(text, text)

		// No removed or added parts
		expect(leftParts.every((p) => p.type === 'original')).toBe(true)
		expect(rightParts.every((p) => p.type === 'localized')).toBe(true)

		// Full text reconstructed
		expect(extractText(leftParts)).toBe(text)
		expect(extractText(rightParts)).toBe(text)
	})

	it('handles completely different text', () => {
		const orig = 'Hello world'
		const loc = 'Goodbye所有人'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		// Left should have all original (probably marked as removed/changed)
		const leftText = extractText(leftParts)
		expect(leftText).toBe(orig)

		// Right should have all localized
		const rightText = extractText(rightParts)
		expect(rightText).toBe(loc)
	})

	it('handles empty original', () => {
		const orig = ''
		const loc = 'New content added'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		// Left column empty (nothing to show from original)
		expect(extractText(leftParts)).toBe('')

		// Right column has new content
		expect(extractText(rightParts)).toBe(loc)
	})

	it('handles empty localized', () => {
		const orig = 'Content was here'
		const loc = ''
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		// Left column has original content
		expect(extractText(leftParts)).toBe(orig)

		// Right column empty (nothing in localized)
		expect(extractText(rightParts)).toBe('')
	})

	it('handles phrase-level changes', () => {
		const orig = 'The quick brown fox'
		const loc = 'A fast brown canine'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		// Both should reconstruct their respective texts
		expect(extractText(leftParts)).toBe(orig)
		expect(extractText(rightParts)).toBe(loc)
	})
})

describe('Paragraph Alignment', () => {
	it('should split text into paragraphs correctly', () => {
		const orig = 'First paragraph.\n\nSecond paragraph.'
		const loc = 'First paragraph localized.\n\nSecond paragraph localized.'
		const origParas = orig.split(/\n\n+/).filter((p) => p.trim())
		const locParas = loc.split(/\n\n+/).filter((p) => p.trim())

		expect(origParas.length).toBe(2)
		expect(locParas.length).toBe(2)
		expect(origParas[0]).toBe('First paragraph.')
		expect(locParas[0]).toBe('First paragraph localized.')
	})

	it('should handle mismatched paragraph counts', () => {
		const orig = 'Only one paragraph'
		const loc = 'First.\n\nSecond.\n\nThird.'
		const origParas = orig.split(/\n\n+/).filter((p) => p.trim())
		const locParas = loc.split(/\n\n+/).filter((p) => p.trim())

		expect(origParas.length).toBe(1)
		expect(locParas.length).toBe(3)
	})
})

describe('Real-World Localization Scenarios', () => {
	it('should handle British/American spelling changes', () => {
		const orig = 'The harbour is colorful'
		const loc = 'The harbour is colourful'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		expect(extractText(leftParts)).toBe(orig)
		expect(extractText(rightParts)).toBe(loc)

		// Should have highlighting in both columns for the changed word
		const leftRemoved = leftParts.filter((p) => p.type === 'removed')
		const rightAdded = rightParts.filter((p) => p.type === 'added')

		expect(leftRemoved.length).toBeGreaterThan(0)
		expect(rightAdded.length).toBeGreaterThan(0)
	})

	it('should handle dialogue with punctuation', () => {
		const orig = '"Are these chairs taken?" he said.'
		const loc = '"Are these chairs taken?" she said.'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		expect(extractText(leftParts)).toBe(orig)
		expect(extractText(rightParts)).toBe(loc)
	})

	it('should handle formal register changes', () => {
		const orig = 'You guys shouldnt use bad language'
		const loc = 'One should not utilize inappropriate vocabulary'
		const leftParts = getOriginalColumnParts(orig, loc)
		const rightParts = getLocalizedColumnParts(orig, loc)

		expect(extractText(leftParts)).toBe(orig)
		expect(extractText(rightParts)).toBe(loc)
	})
})
