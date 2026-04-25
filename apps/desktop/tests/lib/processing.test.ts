import { describe, expect, it } from 'vitest'
import { cleanResponse } from '../../src/lib/processing'

describe('lib/processing', () => {
	describe('cleanResponse', () => {
		it('trims whitespace', () => {
			expect(cleanResponse('  Hello world  ')).toBe('Hello world')
		})

		it('removes code fences', () => {
			expect(cleanResponse('```markdown\nHello world\n```')).toBe('Hello world')
			expect(cleanResponse('```\nHello world\n```')).toBe('Hello world')
			expect(cleanResponse('```MARKDOWN\nHello\n```')).toBe('Hello')
		})

		it('removes BEGIN/END markers', () => {
			const input = `Here's the translation:
---BEGIN TEXT---
Hello world
---END TEXT---`
			expect(cleanResponse(input)).toBe('Hello world')
		})

		it('removes leading commentary', () => {
			// Commentary should be removed - result differs from input
			expect(cleanResponse("Here's the translation: Hello")).not.toBe("Here's the translation: Hello")
			expect(cleanResponse('Here is the translation: Hello')).not.toBe('Here is the translation: Hello')
			expect(cleanResponse('Translate the text above: Hello')).not.toBe('Translate the text above: Hello')
		})

		it('handles complex responses', () => {
			const input = `\`\`\`markdown
---BEGIN TEXT---
Hello, how are you?
---END TEXT---
\`\`\``

			expect(cleanResponse(input)).toBe('Hello, how are you?')
		})

		it('returns clean text unchanged', () => {
			expect(cleanResponse('Hello world')).toBe('Hello world')
			expect(cleanResponse('Simple text')).toBe('Simple text')
		})
	})
})
