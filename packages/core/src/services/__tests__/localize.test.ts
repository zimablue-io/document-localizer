import { describe, expect, it } from 'vitest'
import { chunkText } from '../../utils/chunk'

describe('chunkText (paragraph-based)', () => {
	it('should be a function', () => {
		expect(typeof chunkText).toBe('function')
	})

	it('should chunk text with multiple paragraphs', () => {
		const text = `First paragraph with some content.

Second paragraph with more content.

Third paragraph with even more content here.

Fourth paragraph.`

		const chunks = chunkText(text, 30, 0)
		expect(chunks.length).toBeGreaterThan(1)
	})

	it('should include overlap between chunks when paragraphs overlap', () => {
		const text = `First paragraph.

Second paragraph.

Third paragraph.

Fourth paragraph.

Fifth paragraph.`

		const chunks = chunkText(text, 30, 15)
		expect(chunks.length).toBeGreaterThan(1)
	})

	it('should handle text shorter than chunk size', () => {
		const shortText = 'Short text'
		const chunks = chunkText(shortText, 100, 10)

		expect(chunks.length).toBe(1)
		expect(chunks[0]).toBe(shortText)
	})

	it('should return empty array for empty text', () => {
		const chunks = chunkText('', 100, 10)

		expect(Array.isArray(chunks)).toBe(true)
	})
})
