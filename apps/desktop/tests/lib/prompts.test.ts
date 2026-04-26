import { describe, expect, it } from 'vitest'
import { buildPrompt, DEFAULT_LOCALIZATION_PROMPT, DEFAULT_TRANSLATION_PROMPT } from '../../src/lib/prompts'

describe('lib/prompts', () => {
	describe('DEFAULT_TRANSLATION_PROMPT', () => {
		it('contains required placeholders', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{sourceLocale}')
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{targetLocale}')
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{text}')
		})
	})

	describe('DEFAULT_LOCALIZATION_PROMPT', () => {
		it('contains required placeholders', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('{text}')
		})

		it('contains localization rules', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('WORD REPLACEMENT')
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('color')
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('colour')
		})
	})

	describe('buildPrompt', () => {
		it('replaces all placeholders', () => {
			const result = buildPrompt('Hello {sourceLocale}!', {
				sourceLocale: 'en-US',
				text: 'Hello world',
			})
			expect(result).toBe('Hello en-US!')
		})

		it('handles missing optional parameters', () => {
			const result = buildPrompt('Translate: {text}', {
				text: 'Hello',
			})
			expect(result).toBe('Translate: Hello')
		})

		it('handles empty strings', () => {
			const result = buildPrompt('From {sourceLocale} to {targetLocale}', {
				sourceLocale: '',
				targetLocale: '',
				text: '',
			})
			expect(result).toBe('From  to ')
		})

		it('preserves text content including newlines', () => {
			const template = 'Translate this:\n{text}\nDone'
			const result = buildPrompt(template, {
				text: 'Line 1\nLine 2',
			})
			expect(result).toBe('Translate this:\nLine 1\nLine 2\nDone')
		})
	})
})
