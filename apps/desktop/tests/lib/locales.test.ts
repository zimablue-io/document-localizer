import { describe, expect, it } from 'vitest'
import { ALL_LOCALES, filterLocales, findLocaleByCode, findLocaleByName } from '../../src/lib/locales'

describe('lib/locales', () => {
	describe('findLocaleByCode', () => {
		it('finds English US locale', () => {
			const locale = findLocaleByCode('en-US')
			expect(locale).toBeDefined()
			expect(locale?.code).toBe('en-US')
			expect(locale?.name).toBe('English (US)')
		})

		it('finds French France locale', () => {
			const locale = findLocaleByCode('fr-FR')
			expect(locale).toBeDefined()
			expect(locale?.code).toBe('fr-FR')
			expect(locale?.name).toBe('French (France)')
		})

		it('finds Chinese Simplified locale', () => {
			const locale = findLocaleByCode('zh-CN')
			expect(locale).toBeDefined()
			expect(locale?.code).toBe('zh-CN')
			expect(locale?.name).toBe('Chinese (Simplified, China)')
		})

		it('returns undefined for non-existent locale', () => {
			const locale = findLocaleByCode('xx-XX')
			expect(locale).toBeUndefined()
		})

		it('is case-sensitive for region code', () => {
			const locale = findLocaleByCode('en-us')
			expect(locale).toBeUndefined()
		})

		it('handles Japanese locale', () => {
			const locale = findLocaleByCode('ja-JP')
			expect(locale).toBeDefined()
			expect(locale?.name).toBe('Japanese (Japan)')
		})

		it('handles Arabic locale', () => {
			const locale = findLocaleByCode('ar-SA')
			expect(locale).toBeDefined()
			expect(locale?.name).toBe('Arabic (Saudi Arabia)')
		})
	})

	describe('findLocaleByName', () => {
		it('finds locale by full name', () => {
			const locales = findLocaleByName('English (US)')
			expect(locales.length).toBeGreaterThan(0)
			expect(locales[0].code).toBe('en-US')
		})

		it('finds locale by partial name match', () => {
			const locales = findLocaleByName('English')
			expect(locales.length).toBeGreaterThan(1)
			expect(locales.some((l) => l.code === 'en-US')).toBe(true)
			expect(locales.some((l) => l.code === 'en-GB')).toBe(true)
		})

		it('returns empty array for non-existent name', () => {
			const locales = findLocaleByName('NonExistentLanguage')
			expect(locales).toEqual([])
		})

		it('is case-insensitive', () => {
			const locales = findLocaleByName('english (us)')
			expect(locales.length).toBeGreaterThan(0)
			expect(locales[0].code).toBe('en-US')
		})

		it('finds multiple English variants', () => {
			const locales = findLocaleByName('English')
			expect(locales.length).toBeGreaterThan(5)
		})
	})

	describe('filterLocales', () => {
		it('filters to enabled locales only', () => {
			const enabled = ['en-US', 'fr-FR', 'de-DE']
			const result = filterLocales(enabled)
			expect(result.length).toBe(3)
			expect(result.map((l) => l.code)).toContain('en-US')
			expect(result.map((l) => l.code)).toContain('fr-FR')
			expect(result.map((l) => l.code)).toContain('de-DE')
		})

		it('returns empty array for empty enabled list', () => {
			const result = filterLocales([])
			expect(result).toEqual([])
		})

		it('skips non-existent locale codes', () => {
			const enabled = ['en-US', 'xx-XX', 'fr-FR']
			const result = filterLocales(enabled)
			expect(result.length).toBe(2)
			expect(result.map((l) => l.code)).not.toContain('xx-XX')
		})

		it('preserves order from enabled list', () => {
			const enabled = ['de-DE', 'en-US', 'fr-FR']
			const result = filterLocales(enabled)
			expect(result[0].code).toBe('de-DE')
			expect(result[1].code).toBe('en-US')
			expect(result[2].code).toBe('fr-FR')
		})

		it('handles single enabled locale', () => {
			const result = filterLocales(['ja-JP'])
			expect(result.length).toBe(1)
			expect(result[0].code).toBe('ja-JP')
		})
	})

	describe('ALL_LOCALES', () => {
		it('contains English variants', () => {
			const enLocales = ALL_LOCALES.filter((l) => l.code.startsWith('en-'))
			expect(enLocales.length).toBeGreaterThan(5)
		})

		it('contains Spanish variants', () => {
			const esLocales = ALL_LOCALES.filter((l) => l.code.startsWith('es-'))
			expect(esLocales.length).toBeGreaterThan(5)
		})

		it('contains French variants', () => {
			const frLocales = ALL_LOCALES.filter((l) => l.code.startsWith('fr-'))
			expect(frLocales.length).toBeGreaterThan(5)
		})

		it('contains Chinese variants', () => {
			const zhLocales = ALL_LOCALES.filter((l) => l.code.startsWith('zh-'))
			expect(zhLocales.length).toBeGreaterThan(1)
		})

		it('all locales have valid code format', () => {
			ALL_LOCALES.forEach((locale) => {
				// BCP 47 format: 2-3 letter language code + dash + 2 letter region code
				expect(locale.code).toMatch(/^[a-z]{2,3}-[A-Z]{2}$/)
			})
		})

		it('all locales have non-empty names', () => {
			ALL_LOCALES.forEach((locale) => {
				expect(locale.name.length).toBeGreaterThan(0)
			})
		})

		it('locale codes are unique', () => {
			const codes = ALL_LOCALES.map((l) => l.code)
			const uniqueCodes = new Set(codes)
			expect(uniqueCodes.size).toBe(codes.length)
		})
	})
})
