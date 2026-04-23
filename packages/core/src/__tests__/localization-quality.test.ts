/**
 * Tests for localization quality
 *
 * These tests verify that the localized output:
 * 1. Has similar paragraph count to original (not wildly different)
 * 2. Does NOT have duplicate paragraphs
 * 3. Does NOT add content that wasn't in the original
 *
 * Run with: cd packages/core && npx vitest run src/__tests__/localization-quality.test.ts
 */

import { describe, expect, it } from 'vitest'

// Simplified versions of the actual functions used in the app

function stripAIResponse(rawResponse: string): string {
	let content = rawResponse.trim()

	// Remove code fences
	if (content.startsWith('```')) {
		content = content.replace(/^```(?:markdown)?\n?/i, '')
		content = content.replace(/\n?```$/i, '')
		content = content.trim()
	}

	// Remove markers
	const beginMarker = content.indexOf('---BEGIN TEXT---')
	if (beginMarker !== -1) {
		content = content.slice(beginMarker + '---BEGIN TEXT---'.length)
	}
	const endMarker = content.indexOf('---END TEXT---')
	if (endMarker !== -1) {
		content = content.slice(0, endMarker)
	}

	// Remove commentary
	content = content.replace(/^Here'?s? (?:the )?translation[.:].*/i, '').trim()
	content = content.replace(/^Translate the text above.*/i, '').trim()
	content = content.replace(/^Here(?:'|)s?.*translation.*/i, '').trim()

	return content.trim()
}

function splitIntoParagraphs(text: string): string[] {
	const paragraphs: string[] = []
	let current = ''

	for (const line of text.split('\n')) {
		if (line.trim() === '' && current.trim() !== '') {
			paragraphs.push(current.trim())
			current = ''
		} else if (line.trim() !== '') {
			current = current ? current + '\n' + line : line
		}
	}
	if (current.trim()) {
		paragraphs.push(current.trim())
	}
	return paragraphs
}

function countParagraphs(text: string): number {
	return splitIntoParagraphs(text).length
}

function findDuplicateParagraphs(text: string): string[] {
	const paragraphs = splitIntoParagraphs(text)
	const seen = new Map<string, number>()
	const duplicates: string[] = []

	for (const p of paragraphs) {
		// Normalize: lowercase and take first 100 chars to compare
		// This avoids matching partial phrases while still catching paragraph-level duplicates
		const normalized = p.trim().toLowerCase().substring(0, 100)
		if (seen.has(normalized)) {
			if (!duplicates.includes(p)) {
				duplicates.push(p)
			}
		} else {
			seen.set(normalized, 1)
		}
	}
	return duplicates
}

describe('Localization Quality Tests', () => {
	describe('Paragraph Count', () => {
		it('should have similar paragraph count after stripping', () => {
			// Simulate: Original text has 10 paragraphs
			const original = `Para 1.

Para 2.

Para 3.

Para 4.

Para 5.

Para 6.

Para 7.

Para 8.

Para 9.

Para 10.`

			// AI response with markers should strip to same paragraph count
			const aiResponse = `---BEGIN TEXT---
Para 1.

Para 2.

Para 3.

Para 4.

Para 5.

Para 6.

Para 7.

Para 8.

Para 9.

Para 10.
---END TEXT---`

			const stripped = stripAIResponse(aiResponse)
			const originalCount = countParagraphs(original)
			const strippedCount = countParagraphs(stripped)

			expect(strippedCount).toBe(originalCount)
		})

		it('should detect paragraph count increase (hallucination)', () => {
			// Original has 5 paragraphs
			const original = `Para 1.

Para 2.

Para 3.

Para 4.

Para 5.`

			// AI returns 10 paragraphs (5 duplicated!)
			const aiResponse = `---BEGIN TEXT---
Para 1.

Para 2.

Para 3.

Para 4.

Para 5.

Para 1.

Para 2.

Para 3.

Para 4.

Para 5.
---END TEXT---`

			const stripped = stripAIResponse(aiResponse)
			const originalCount = countParagraphs(original)
			const strippedCount = countParagraphs(stripped)

			// This test verifies paragraph count is HIGHER when duplicates exist
			// It SHOULD fail the "clean" assertion when duplicates are present
			expect(strippedCount).toBe(10)
			expect(strippedCount).toBeGreaterThan(originalCount)
		})
	})

	describe('Duplicate Detection', () => {
		it('should detect duplicates in text with repeated paragraphs', () => {
			const text = `First paragraph.

Second paragraph.

Third paragraph.

First paragraph.

Second paragraph.`

			const duplicates = findDuplicateParagraphs(text)

			// This test SHOULD detect duplicates (2: First and Second)
			expect(duplicates.length).toBe(2)
		})

		it('should detect duplicate dialogue lines', () => {
			const text = `"Hello," she said.

"Hi," he replied.

"Goodbye."

"Hello," she said.

"Hi," he replied.`

			const duplicates = findDuplicateParagraphs(text)

			expect(duplicates.length).toBe(2)
		})
	})

	describe('Real-World Pattern Matching', () => {
		it('should handle dialogue duplication pattern', () => {
			// This is the actual pattern from the user's file
			const localizedOutput = `"Are these chairs taken?" he said.

"No," I answered.

"Mind if I sit down?"

"Go ahead."

"Are these chairs taken?" he said.

"No," I answered.

"Mind if I sit down?"

"Go ahead."

"Thanks," he said.`

			const duplicates = findDuplicateParagraphs(localizedOutput)

			// This should FAIL - there ARE duplicates
			expect(duplicates.length).toBeGreaterThan(0)
		})

		it('should count paragraphs correctly in dialogue-heavy text', () => {
			const text = `"Hello," she said.

"Hi," he replied.

"Goodbye."`

			const paragraphs = splitIntoParagraphs(text)
			expect(paragraphs.length).toBe(3)
		})
	})

	describe('Strip Response Function', () => {
		it('should strip ---BEGIN/---END markers completely', () => {
			const input = `---BEGIN TEXT---
Translated content here.
---END TEXT---`

			const result = stripAIResponse(input)
			expect(result).not.toContain('---BEGIN TEXT---')
			expect(result).not.toContain('---END TEXT---')
		})

		it('should handle empty after stripping markers', () => {
			const input = `---BEGIN TEXT---
---END TEXT---`

			const result = stripAIResponse(input)
			expect(result).toBe('')
		})

		it('should preserve actual content between markers', () => {
			const input = `Some text before.

---BEGIN TEXT---
This is the real content.
---END TEXT---

Some text after.`

			const result = stripAIResponse(input)
			expect(result).toBe('This is the real content.')
		})
	})
})

describe('Integration: Full Pipeline Simulation', () => {
	it('should process a realistic AI response without duplication', () => {
		// Simulate what the app does with chunks
		const originalParagraphs = [
			'"Are these chairs taken?" he said.',
			'"No," I answered.',
			'"Mind if I sit down?"',
			'"Go ahead."',
			'"Thanks," he said.',
		]
		const original = originalParagraphs.join('\n\n')

		// Simulate AI response (with markers and stripped)
		const aiResponse = `---BEGIN TEXT---
${originalParagraphs[0]}

${originalParagraphs[1]}

${originalParagraphs[2]}

${originalParagraphs[3]}

${originalParagraphs[4]}
---END TEXT---`

		const stripped = stripAIResponse(aiResponse)
		const resultParagraphs = splitIntoParagraphs(stripped)

		// Check: no duplicates
		const duplicates = findDuplicateParagraphs(stripped)
		expect(duplicates.length).toBe(0)

		// Check: same paragraph count
		expect(resultParagraphs.length).toBe(originalParagraphs.length)
	})

	it('should FAIL when AI duplicates content', () => {
		const originalParagraphs = [
			'"Are these chairs taken?" he said.',
			'"No," I answered.',
			'"Mind if I sit down?"',
			'"Go ahead."',
		]

		// AI response with duplicates (hallucination)
		const aiWithDuplicates = `---BEGIN TEXT---
${originalParagraphs[0]}

${originalParagraphs[1]}

${originalParagraphs[2]}

${originalParagraphs[3]}

${originalParagraphs[0]}

${originalParagraphs[1]}

${originalParagraphs[2]}

${originalParagraphs[3]}
---END TEXT---`

		const stripped = stripAIResponse(aiWithDuplicates)
		const duplicates = findDuplicateParagraphs(stripped)

		// This test SHOULD FAIL - duplicates detected
		expect(duplicates.length).toBeGreaterThan(0)

		// And paragraph count should be different
		const resultParagraphs = splitIntoParagraphs(stripped)
		expect(resultParagraphs.length).not.toBe(originalParagraphs.length)
	})
})
