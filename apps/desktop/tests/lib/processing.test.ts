import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock window.electron before importing
const mockGenerateAI = vi.fn()
vi.stubGlobal('window', {
	electron: {
		generateAI: mockGenerateAI,
	},
})

// Import after mocking
import { processParagraph } from '../../src/lib/processing'
import { buildPrompt, DEFAULT_LOCALIZATION_PROMPT } from '../../src/lib/prompts'

describe('processParagraph', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGenerateAI.mockResolvedValue({
			content: 'Translated text',
			error: null,
		})
	})

	it('should process with pre-built content and return cleaned response', async () => {
		const content = buildPrompt('Translate from en-US to ja-JP:\n\n---BEGIN TEXT---\n{text}\n---END TEXT---', {
			sourceLocale: 'en-US',
			targetLocale: 'ja-JP',
			text: 'Hello world',
		})

		const result = await processParagraph({
			apiUrl: 'http://localhost:11434',
			model: 'llama3',
			content,
		})

		expect(result).toBe('Translated text')
		expect(mockGenerateAI).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'http://localhost:11434/chat/completions',
				body: expect.objectContaining({
					model: 'llama3',
					messages: expect.arrayContaining([
						expect.objectContaining({
							role: 'user',
						}),
					]),
				}),
			})
		)
	})

	it('should throw error when AI returns error', async () => {
		mockGenerateAI.mockResolvedValue({
			content: '',
			error: 'Model not found',
		})

		await expect(
			processParagraph({
				apiUrl: 'http://localhost:11434',
				model: 'llama3',
				content: 'Translate this',
			})
		).rejects.toThrow('Model not found')
	})
})

describe('buildPrompt', () => {
	it('should replace all placeholders', () => {
		const result = buildPrompt('From {sourceLocale} to {targetLocale}: {text}', {
			sourceLocale: 'en-US',
			targetLocale: 'ja-JP',
			text: 'Hello',
		})

		expect(result).toBe('From en-US to ja-JP: Hello')
		expect(result).not.toContain('{sourceLocale}')
		expect(result).not.toContain('{targetLocale}')
		expect(result).not.toContain('{text}')
	})

	it('should replace ALL occurrences of placeholders (not just first)', () => {
		const template = '{targetLocale} → Use {targetLocale} spelling. Never use {targetLocale} variants.'
		const result = buildPrompt(template, {
			sourceLocale: 'en-US',
			targetLocale: 'de-DE',
			text: 'test',
		})

		// Should have no placeholders left
		expect(result).not.toContain('{targetLocale}')
		// Should have replaced all 3 occurrences
		expect(result.match(/de-DE/g)?.length).toBe(3)
	})

	it('should work with DEFAULT_LOCALIZATION_PROMPT', () => {
		const result = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
			sourceLocale: 'en-US',
			targetLocale: 'de-DE',
			text: 'Colour is spelled with "ou".',
		})

		expect(result).not.toContain('{sourceLocale}')
		expect(result).not.toContain('{targetLocale}')
		expect(result).toContain('en-US')
		expect(result).toContain('de-DE')
	})
})

describe('integration: prompt building for multiple paragraphs', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should build consistent prompt prefix for all paragraphs', () => {
		const promptTemplate =
			'Translate from {sourceLocale} to {targetLocale}.\n\n---BEGIN TEXT---\n{text}\n---END TEXT---'

		// Build prefix once
		const prefix = buildPrompt(promptTemplate, {
			sourceLocale: 'en-US',
			targetLocale: 'de-DE',
			text: '', // Empty - just for prefix
		})
		const promptWithoutText = prefix.replace(/\n---BEGIN TEXT---\n---END TEXT---\n*$/, '')

		// Build content for multiple paragraphs
		const paragraph1Content = `${promptWithoutText}\n\n---BEGIN TEXT---\nHello world\n---END TEXT---`
		const paragraph2Content = `${promptWithoutText}\n\n---BEGIN TEXT---\nGoodbye world\n---END TEXT---`

		// Both should have the same locale instructions
		expect(paragraph1Content).toContain('en-US')
		expect(paragraph1Content).toContain('de-DE')
		expect(paragraph2Content).toContain('en-US')
		expect(paragraph2Content).toContain('de-DE')

		// Neither should have unfilled placeholders
		expect(paragraph1Content).not.toContain('{sourceLocale}')
		expect(paragraph1Content).not.toContain('{targetLocale}')
		expect(paragraph2Content).not.toContain('{sourceLocale}')
		expect(paragraph2Content).not.toContain('{targetLocale}')
	})

	it('should handle locale with hyphens like de-DE', () => {
		const promptTemplate = 'Convert from {sourceLocale} to {targetLocale}'
		const result = buildPrompt(promptTemplate, {
			sourceLocale: 'en-US',
			targetLocale: 'de-DE',
			text: 'test',
		})

		expect(result).toContain('de-DE')
		expect(result).not.toContain('{targetLocale}')
	})
})
