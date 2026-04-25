import { describe, expect, it } from 'vitest'
import { ALL_LOCALES } from '../../src/lib/locales'

describe('lib/locales', () => {
	describe('ALL_LOCALES', () => {
		it('contains locales', () => {
			expect(ALL_LOCALES.length).toBeGreaterThan(0)
		})

		it('each locale has code and name', () => {
			for (const locale of ALL_LOCALES) {
				expect(locale).toHaveProperty('code')
				expect(locale).toHaveProperty('name')
				expect(typeof locale.code).toBe('string')
				expect(typeof locale.name).toBe('string')
				expect(locale.code.length).toBeGreaterThan(0)
				expect(locale.name.length).toBeGreaterThan(0)
			}
		})

		it('contains English locales', () => {
			const codes = ALL_LOCALES.map((l) => l.code)
			expect(codes).toContain('en-US')
			expect(codes).toContain('en-GB')
		})

		it('contains major language families', () => {
			const codes = ALL_LOCALES.map((l) => l.code)
			// Spanish variants
			expect(codes.some((c) => c.startsWith('es-'))).toBe(true)
			// French variants
			expect(codes.some((c) => c.startsWith('fr-'))).toBe(true)
			// Chinese variants
			expect(codes.some((c) => c.startsWith('zh-'))).toBe(true)
		})

		it('locale codes follow BCP 47 format', () => {
			for (const locale of ALL_LOCALES) {
				// BCP 47 format: language-script or language-region
				const parts = locale.code.split('-')
				expect(parts.length).toBeGreaterThanOrEqual(2)
				expect(parts[0]).toBe(parts[0].toLowerCase())
			}
		})

		it('no duplicate locale codes', () => {
			const codes = ALL_LOCALES.map((l) => l.code)
			const uniqueCodes = new Set(codes)
			expect(uniqueCodes.size).toBe(codes.length)
		})
	})
})
