import { describe, expect, it } from 'vitest'
import {
	buildPrompt,
	DEFAULT_LOCALIZATION_PROMPT,
	LOCALE_DETECTION_PROMPT,
	validatePromptTemplate,
} from '../../src/lib/prompts'

describe('lib/prompts', () => {
	describe('buildPrompt', () => {
		it('replaces sourceLocale placeholder', () => {
			const template = 'From {sourceLocale} to {targetLocale}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Hello',
			})
			expect(result).toContain('en-US')
		})

		it('replaces targetLocale placeholder', () => {
			const template = 'From {sourceLocale} to {targetLocale}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Hello',
			})
			expect(result).toContain('fr-FR')
		})

		it('replaces text placeholder', () => {
			const template = 'Translate: {text}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Hello world',
			})
			expect(result).toContain('Hello world')
		})

		it('handles missing sourceLocale', () => {
			const template = 'To: {targetLocale}'
			const result = buildPrompt(template, {
				targetLocale: 'fr-FR',
				text: 'Hello',
			})
			expect(result).toContain('fr-FR')
			expect(result).not.toContain('{sourceLocale}')
		})

		it('handles missing targetLocale', () => {
			const template = 'From: {sourceLocale}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				text: 'Hello',
			})
			expect(result).toContain('en-US')
			expect(result).not.toContain('{targetLocale}')
		})

		it('handles multiline text', () => {
			const template = 'Translate:\n{text}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Line 1\n\nLine 2',
			})
			expect(result).toContain('Line 1')
			expect(result).toContain('Line 2')
		})

		it('handles special characters in text', () => {
			const template = '{text}'
			const result = buildPrompt(template, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Test with "quotes" and {braces}',
			})
			expect(result).toContain('Test with "quotes" and {braces}')
		})
	})

	describe('DEFAULT_LOCALIZATION_PROMPT', () => {
		it('contains source locale placeholder', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('{sourceLocale}')
		})

		it('contains target locale placeholder', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('{targetLocale}')
		})

		it('contains text placeholder', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('{text}')
		})

		it('contains clear output language instruction', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('Output language')
		})

		it('contains conversion rules', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('Convert words')
		})

		it('contains OUTPUT marker', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('OUTPUT:')
		})
	})

	describe('LOCALE_DETECTION_PROMPT', () => {
		it('contains text placeholder', () => {
			expect(LOCALE_DETECTION_PROMPT).toContain('{text}')
		})

		it('contains BEGIN/END markers', () => {
			expect(LOCALE_DETECTION_PROMPT).toContain('---BEGIN TEXT---')
			expect(LOCALE_DETECTION_PROMPT).toContain('---END TEXT---')
		})

		it('asks for locale code output', () => {
			expect(LOCALE_DETECTION_PROMPT).toContain('locale code')
		})

		it('mentions unknown as fallback', () => {
			expect(LOCALE_DETECTION_PROMPT).toContain('unknown')
		})
	})

	describe('prompt substitution', () => {
		it('generates valid localization prompt', () => {
			const prompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'en-GB',
				text: 'Color your way to success',
			})

			// Localization prompt doesn't use locale placeholders, only text
			expect(prompt).toContain('Color your way to success')
			expect(prompt).not.toContain('{text}')
		})

		it('generates valid locale detection prompt', () => {
			const prompt = buildPrompt(LOCALE_DETECTION_PROMPT, {
				text: 'This is some English text.',
			})

			expect(prompt).toContain('This is some English text.')
			expect(prompt).not.toContain('{text}')
		})
	})

	describe('validatePromptTemplate', () => {
		it('returns valid for prompt with all required vars', () => {
			const result = validatePromptTemplate('From {sourceLocale} to {targetLocale}: {text}')
			expect(result.valid).toBe(true)
			expect(result.missingVars).toEqual([])
		})

		it('returns invalid with missing sourceLocale', () => {
			const result = validatePromptTemplate('Translate: {text}')
			expect(result.valid).toBe(false)
			expect(result.missingVars).toContain('{sourceLocale}')
		})

		it('returns invalid with missing targetLocale', () => {
			const result = validatePromptTemplate('From {sourceLocale}: {text}')
			expect(result.valid).toBe(false)
			expect(result.missingVars).toContain('{targetLocale}')
		})

		it('returns invalid with missing text', () => {
			const result = validatePromptTemplate('From {sourceLocale} to {targetLocale}')
			expect(result.valid).toBe(false)
			expect(result.missingVars).toContain('{text}')
		})

		it('returns invalid with all vars missing', () => {
			const result = validatePromptTemplate('Just a plain prompt')
			expect(result.valid).toBe(false)
			expect(result.missingVars).toContain('{sourceLocale}')
			expect(result.missingVars).toContain('{targetLocale}')
			expect(result.missingVars).toContain('{text}')
		})

		it('handles empty template', () => {
			const result = validatePromptTemplate('')
			expect(result.valid).toBe(false)
			expect(result.missingVars).toContain('{sourceLocale}')
			expect(result.missingVars).toContain('{targetLocale}')
			expect(result.missingVars).toContain('{text}')
		})

		it('validates default localization prompt is valid', () => {
			const result = validatePromptTemplate(DEFAULT_LOCALIZATION_PROMPT)
			expect(result.valid).toBe(true)
			expect(result.missingVars).toEqual([])
		})
	})
})
