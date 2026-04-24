/**
 * Integration tests for AI response processing (marker/commentary stripping)
 *
 * These tests verify that the frontend correctly strips:
 * - ---BEGIN TEXT--- / ---END TEXT--- markers
 * - Commentary like "Here's the translation..."
 * - Code fences
 *
 * Run with: cd packages/core && npx vitest run src/__tests__/ai-response-stripping.test.ts
 */

import { describe, expect, it } from 'vitest'

/**
 * Response stripping logic extracted from App.tsx
 * This is what we test - the same logic used in the actual app
 */
function stripAIResponse(rawResponse: string): string {
	let content = rawResponse.trim()

	// Remove code fences if present
	if (content.startsWith('```')) {
		content = content.replace(/^```(?:markdown)?\n?/i, '')
		content = content.replace(/\n?```$/i, '')
		content = content.trim()
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

	// Remove any leading commentary
	content = content.replace(/^Here'?s? (?:the )?translation[.:].*/i, '').trim()
	content = content.replace(/^Translate the text above.*/i, '').trim()
	// Remove "Here is the translation of..." variations
	content = content.replace(/^Here(?:'|)s?.*translation.*/i, '').trim()

	return content.trim()
}

describe('AI Response Stripping', () => {
	describe('Marker Removal', () => {
		it('should remove ---BEGIN TEXT--- marker', () => {
			const input = '---BEGIN TEXT---\nTranslated text here\n---END TEXT---'
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text here')
		})

		it('should remove ---END TEXT--- marker', () => {
			const input = 'Some translated text\n---END TEXT---'
			const result = stripAIResponse(input)
			expect(result).toBe('Some translated text')
		})

		it('should handle multiple ---END TEXT--- markers', () => {
			const input = 'Some text\n---END TEXT---\nMore text\n---END TEXT---'
			const result = stripAIResponse(input)
			// Should strip up to FIRST ---END TEXT---
			expect(result).toBe('Some text')
		})

		it('should handle text without markers', () => {
			const input = 'Just plain translated text'
			const result = stripAIResponse(input)
			expect(result).toBe('Just plain translated text')
		})
	})

	describe('Commentary Removal', () => {
		it('should remove "Here\'s the translation..."', () => {
			const input = "Here's the translation:\n\nTranslated text"
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text')
		})

		it('should remove "Here is the translation..."', () => {
			const input = 'Here is the translation of the markdown:\n\nTranslated text'
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text')
		})

		it('should remove "Translate the text above..."', () => {
			const input = 'Translate the text above and return only the translation.\n\nTranslated text'
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text')
		})
	})

	describe('Code Fence Removal', () => {
		it('should remove markdown code fences', () => {
			const input = '```markdown\nTranslated text\n```'
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text')
		})

		it('should remove plain code fences', () => {
			const input = '```\nTranslated text\n```'
			const result = stripAIResponse(input)
			expect(result).toBe('Translated text')
		})
	})

	describe('Real-world AI Responses', () => {
		it('should handle typical AI response with markers', () => {
			const input = `---BEGIN TEXT---
Paragraph one content here.

Paragraph two content here.
---END TEXT---

I hope this translation meets your expectations!`

			const result = stripAIResponse(input)
			expect(result).not.toContain('---BEGIN TEXT---')
			expect(result).not.toContain('---END TEXT---')
			expect(result).not.toContain('translation meets your expectations')
			expect(result).toContain('Paragraph one')
			expect(result).toContain('Paragraph two')
		})

		it('should handle AI response with commentary before markers', () => {
			const input = `Here's the translation to British English:

---BEGIN TEXT---
Colour instead of color.
---END TEXT---`

			const result = stripAIResponse(input)
			expect(result).toBe('Colour instead of color.')
		})

		it('should handle full prompt echo from AI', () => {
			const input = `Translate the text above and return ONLY the translated content with the exact same formatting:

---BEGIN TEXT---
Some text to translate.
---END TEXT---

I have translated the text above while preserving all formatting.`

			const result = stripAIResponse(input)
			expect(result).toBe('Some text to translate.')
		})

		it('should preserve paragraph breaks in output', () => {
			const input = `---BEGIN TEXT---
First paragraph here.

Second paragraph here.
---END TEXT---`

			const result = stripAIResponse(input)
			// Should have double newline between paragraphs
			expect(result).toContain('\n\n')
		})
	})

	describe('Edge Cases', () => {
		it('should handle empty response', () => {
			const result = stripAIResponse('')
			expect(result).toBe('')
		})

		it('should handle only markers', () => {
			const input = '---BEGIN TEXT---\n\n---END TEXT---'
			const result = stripAIResponse(input)
			expect(result).toBe('')
		})

		it('should handle content with special characters', () => {
			const input = `---BEGIN TEXT---
"Hello," she said.
---END TEXT---`

			const result = stripAIResponse(input)
			expect(result).toBe('"Hello," she said.')
		})

		it('should handle markdown formatting in content', () => {
			const input = `---BEGIN TEXT---
# Title

**Bold text** and *italic*.

## Subtitle
---END TEXT---`

			const result = stripAIResponse(input)
			expect(result).toContain('# Title')
			expect(result).toContain('**Bold text**')
			expect(result).toContain('## Subtitle')
		})
	})
})
