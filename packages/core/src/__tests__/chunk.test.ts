import { describe, expect, it } from 'vitest'
import { chunkText } from '../utils/chunk'

describe('chunkText', () => {
	it('should handle empty text', () => {
		const result = chunkText('', 1000, 100)
		expect(result).toEqual([])
	})

	it('should return single paragraph as single chunk', () => {
		const text = 'This is a short paragraph.'
		const result = chunkText(text, 1000, 100)
		expect(result).toEqual(['This is a short paragraph.'])
	})

	it('should split multiple paragraphs into separate chunks', () => {
		const text = `First paragraph here.

Second paragraph here.

Third paragraph here.`
		const result = chunkText(text, 30, 0)
		// With small chunk size, should split into multiple chunks
		expect(result.length).toBeGreaterThan(1)
		result.forEach((chunk) => {
			expect(chunk.trim()).toBe(chunk)
		})
	})

	it('should respect max chunk size', () => {
		const text = `Short paragraph.

This is a much longer paragraph that should be split because it exceeds the maximum chunk size limit that we have set for testing purposes. It continues with more text to ensure it goes over the limit. Even more content here to push it over.`

		const largeResult = chunkText(text, 500, 0)
		expect(largeResult.length).toBeLessThanOrEqual(2)

		const smallResult = chunkText(text, 50, 0)
		expect(smallResult.length).toBeGreaterThan(largeResult.length)
	})

	it('should preserve paragraph breaks in output', () => {
		const text = `First paragraph with some content.

Second paragraph with different content.

Third paragraph here.`

		const result = chunkText(text, 1000, 0)
		const rejoined = result.join('\n\n')

		expect(rejoined).toContain('\n\n')
	})

	it('should handle dialogue text with quotes', () => {
		const text = `"Hello there," she said.

"Hello yourself," he replied.

They continued talking.`

		const result = chunkText(text, 100, 0)

		result.forEach((chunk) => {
			expect(typeof chunk).toBe('string')
			expect(chunk.length).toBeGreaterThan(0)
		})
	})

	it('should not split mid-paragraph', () => {
		const longParagraph = 'This is a long paragraph. ' + 'Word '.repeat(200) + 'End.'
		const text = `First short paragraph.

${longParagraph}

Last short paragraph.`

		const result = chunkText(text, 100, 0)

		const hasLongParagraph = result.some((chunk) => chunk.includes('Word Word'))
		expect(hasLongParagraph).toBe(true)
	})

	it('should produce valid markdown when rejoined', () => {
		const text = `First paragraph with some content here.

Second paragraph with different content here.

Third paragraph with even more content.`

		const result = chunkText(text, 50, 0)
		const rejoined = result.join('\n\n')

		const tripleNewlines = /\n{3,}/.test(rejoined)
		expect(tripleNewlines).toBe(false)

		result.forEach((chunk) => {
			expect(chunk.trim().length).toBeGreaterThan(0)
		})
	})

	it('should handle markdown headings', () => {
		const text = `# Title

First paragraph under title.

## Subtitle

Second paragraph.

More text here.`

		const result = chunkText(text, 1000, 0)

		const allText = result.join('\n\n')
		expect(allText).toContain('# Title')
		expect(allText).toContain('## Subtitle')
	})

	it('should handle overlapping chunks when overlap > 0', () => {
		const text = `Paragraph one.

Paragraph two.

Paragraph three.

Paragraph four.`

		const noOverlap = chunkText(text, 50, 0)
		const withOverlap = chunkText(text, 50, 20)

		noOverlap.forEach((chunk) => expect(chunk.trim()).toBe(chunk))
		withOverlap.forEach((chunk) => expect(chunk.trim()).toBe(chunk))
	})

	it('should handle story-like text with dialogue', () => {
		const text = `Man from the South
Roald Dahl

It was getting on toward six o'clock so I thought I'd buy myself a beer and go out and sit in a deck chair by the swimming pool and have a little evening sun.

I went to the bar and got the beer and carried it outside and wandered down the garden toward the pool.

It was a fine garden with lawns and beds of azaleas and tall coconut palms.

"Excuse me," he said, "but may I sit here?"

"Certainly," I said. "Go ahead."`

		const result = chunkText(text, 500, 50)

		expect(result.length).toBeGreaterThan(0)

		const rejoined = result.join('\n\n')

		expect(/\n{3,}/.test(rejoined)).toBe(false)

		// Verify dialogue is preserved (check for quote characters in output)
		expect(rejoined).toContain('"Excuse me')
		expect(rejoined).toContain('"Certainly,')
	})
})
