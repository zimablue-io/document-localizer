import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Mock window.electron before importing
const mockGenerateAI = vi.fn()
vi.stubGlobal('window', {
	electron: {
		generateAI: mockGenerateAI,
	},
})

// Import after mocking
import { buildPrompt, DEFAULT_LOCALIZATION_PROMPT } from '../../src/lib/prompts'

// Read real test file
const testFilePath = '/Users/lefamoffat/Desktop/books/man-from-the-south.md'
const testFileContent = readFileSync(testFilePath, 'utf-8')

describe('prompt building integration with real file', () => {
	describe('DEFAULT_LOCALIZATION_PROMPT with real document', () => {
		it('should build base prompt with correct locales', () => {
			// This simulates what we do in processDocument
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '{text}',
			})

			// Base prompt should have locales replaced but {text} kept
			expect(basePrompt).toContain('en-US')
			expect(basePrompt).toContain('de-DE')
			expect(basePrompt).toContain('{text}')
			expect(basePrompt).not.toContain('{sourceLocale}')
			expect(basePrompt).not.toContain('{targetLocale}')

			// en-US and de-DE should appear at least once (not zero)
			const enUSCount = (basePrompt.match(/en-US/g) || []).length
			const deDECount = (basePrompt.match(/de-DE/g) || []).length
			expect(enUSCount).toBeGreaterThanOrEqual(1) // At least one {sourceLocale} reference
			expect(deDECount).toBeGreaterThanOrEqual(1) // At least one {targetLocale} reference
		})

		it('should build consistent content for multiple paragraphs', () => {
			// Build base prompt ONCE (as we do in processDocument)
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '{text}',
			})

			// Simulate processing first 5 paragraphs
			const paragraphs = testFileContent
				.split(/\n\n+/)
				.filter((p) => p.trim())
				.slice(0, 5)

			const contents = paragraphs.map((p) => basePrompt.replace('{text}', p))

			// ALL paragraphs should have the same locale values
			for (const content of contents) {
				expect(content).toContain('en-US')
				expect(content).toContain('de-DE')
				expect(content).not.toContain('{sourceLocale}')
				expect(content).not.toContain('{targetLocale}')
				expect(content).not.toContain('{text}')
			}

			// Verify all have the same locale instruction prefix
			const prefixes = contents.map((c) => c.substring(0, 200))
			const uniquePrefixes = new Set(prefixes)
			expect(uniquePrefixes.size).toBe(1) // All should be identical
		})

		it('should handle long paragraphs without issues', () => {
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '{text}',
			})

			// Find a long paragraph (over 500 chars)
			const longParagraph = testFileContent.split(/\n\n+/).filter((p) => p.trim().length > 500)[0]

			expect(longParagraph).toBeDefined()

			const content = basePrompt.replace('{text}', longParagraph)

			expect(content).toContain('en-US')
			expect(content).toContain('de-DE')
			expect(content).not.toContain('{sourceLocale}')
			expect(content).not.toContain('{targetLocale}')
			expect(content).toContain(longParagraph)
		})

		it('should preserve prompt structure', () => {
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '{text}',
			})

			// Should have OUTPUT marker
			expect(basePrompt).toContain('OUTPUT:')

			const paragraph = 'Hello world'
			const content = basePrompt.replace('{text}', paragraph)

			// After replacement, should have paragraph
			expect(content).toContain('Hello world')
			// Should have locale values
			expect(content).toContain('en-US')
			expect(content).toContain('de-DE')
		})
	})

	describe('edge cases', () => {
		it('should handle paragraphs with special characters', () => {
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '{text}',
			})

			const specialParagraphs = [
				'Quotes: "Hello" and \'Hello\'',
				'Newlines:\nare\npreserved',
				'Special chars: àéïõü',
				'Unicode: 你好世界',
			]

			for (const p of specialParagraphs) {
				const content = basePrompt.replace('{text}', p)
				expect(content).toContain('en-US')
				expect(content).toContain('de-DE')
				expect(content).toContain(p)
			}
		})

		it('should handle empty placeholder if text is empty string', () => {
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'de-DE',
				text: '',
			})

			// With empty text, {text} should be replaced with empty string
			expect(basePrompt).not.toContain('{text}')
			expect(basePrompt).toContain('en-US')
			expect(basePrompt).toContain('de-DE')
		})

		it('should handle different locale formats', () => {
			const locales = [
				{ source: 'en-US', target: 'de-DE' },
				{ source: 'en-GB', target: 'fr-FR' },
				{ source: 'ja-JP', target: 'ko-KR' },
			]

			for (const { source, target } of locales) {
				const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
					sourceLocale: source,
					targetLocale: target,
					text: '{text}',
				})

				expect(basePrompt).toContain(source)
				expect(basePrompt).toContain(target)
				expect(basePrompt).not.toContain('{sourceLocale}')
				expect(basePrompt).not.toContain('{targetLocale}')
			}
		})
	})

	describe('consistency check: processDocument simulation', () => {
		it('should produce consistent prompts across all paragraphs in a document', () => {
			// This test simulates the exact flow in processDocument
			const sourceLocale = 'en-US'
			const targetLocale = 'de-DE'

			// Step 1: Build base prompt ONCE (like in processDocument)
			const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale,
				targetLocale,
				text: '{text}',
			})

			// Step 2: Get all paragraphs
			const paragraphs = testFileContent.split(/\n\n+/).filter((p) => p.trim())

			// Step 3: Build content for each paragraph (like we do in processDocument)
			const allContents = paragraphs.map((p) => basePrompt.replace('{text}', p))

			// VERIFICATION: Every single content should have the SAME locales
			const localeOccurrences = allContents.map((content) => ({
				hasEnUS: content.includes('en-US'),
				hasDeDE: content.includes('de-DE'),
				hasUnreplacedSource: content.includes('{sourceLocale}'),
				hasUnreplacedTarget: content.includes('{targetLocale}'),
			}))

			// All should be consistent
			for (const result of localeOccurrences) {
				expect(result.hasEnUS, 'Should contain en-US').toBe(true)
				expect(result.hasDeDE, 'Should contain de-DE').toBe(true)
				expect(result.hasUnreplacedSource, 'Should NOT contain {sourceLocale}').toBe(false)
				expect(result.hasUnreplacedTarget, 'Should NOT contain {targetLocale}').toBe(false)
			}

			// All contents should have the EXACT same number of locale occurrences
			const enUSCounts = allContents.map((c) => (c.match(/en-US/g) || []).length)
			const deDECounts = allContents.map((c) => (c.match(/de-DE/g) || []).length)

			const uniqueEnUSCounts = new Set(enUSCounts)
			const uniqueDeDECounts = new Set(deDECounts)

			expect(uniqueEnUSCounts.size, 'All paragraphs should have same en-US count').toBe(1)
			expect(uniqueDeDECounts.size, 'All paragraphs should have same de-DE count').toBe(1)
		})
	})
})
