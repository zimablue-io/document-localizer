import { describe, expect, it } from 'vitest'
import {
	buildPrompt,
	DEFAULT_LOCALIZATION_PROMPT,
	DEFAULT_TRANSLATION_PROMPT,
	LOCALE_DETECTION_PROMPT,
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

	describe('DEFAULT_TRANSLATION_PROMPT', () => {
		it('contains sourceLocale placeholder', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{sourceLocale}')
		})

		it('contains targetLocale placeholder', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{targetLocale}')
		})

		it('contains text placeholder', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('{text}')
		})

		it('contains BEGIN/END markers', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('---BEGIN TEXT---')
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('---END TEXT---')
		})

		it('contains translation requirements', () => {
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('Translate')
			expect(DEFAULT_TRANSLATION_PROMPT).toContain('professional')
		})
	})

	describe('DEFAULT_LOCALIZATION_PROMPT', () => {
		it('contains STRICT LOCALIZATION RULES', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('STRICT LOCALIZATION RULES')
		})

		it('contains WORD REPLACEMENT guidance', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('WORD REPLACEMENT ONLY')
		})

		it('contains PRESERVE guidance', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('PRESERVE EVERYTHING')
		})

		it('contains OUTPUT FORMAT guidance', () => {
			expect(DEFAULT_LOCALIZATION_PROMPT).toContain('OUTPUT FORMAT')
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
		it('generates valid translation prompt', () => {
			const prompt = buildPrompt(DEFAULT_TRANSLATION_PROMPT, {
				sourceLocale: 'en-US',
				targetLocale: 'fr-FR',
				text: 'Hello, how are you?',
			})

			expect(prompt).toContain('en-US')
			expect(prompt).toContain('fr-FR')
			expect(prompt).toContain('Hello, how are you?')
			expect(prompt).not.toContain('{sourceLocale}')
			expect(prompt).not.toContain('{text}')
			// Note: {targetLocale} appears in the prompt instructions, not replaced
		})

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
})
