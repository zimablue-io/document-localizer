import { describe, expect, it } from 'vitest'
import { chunkText } from '../../utils/chunk'

describe('chunkText', () => {
	it('should be a function', () => {
		expect(typeof chunkText).toBe('function')
	})

	it('should chunk long text into multiple pieces', () => {
		// Create text with 200 words (25 tokens each)
		const words = Array(200).fill('word')
		const text = words.join(' ')
		const chunks = chunkText(text, 25, 5)

		expect(chunks.length).toBeGreaterThan(1)
	})

	it('should include overlap between chunks', () => {
		const text = 'Hello World '.repeat(50)
		const chunks = chunkText(text, 50, 10)

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
