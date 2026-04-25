import { describe, expect, it } from 'vitest'
import { getFileName, getOutputFileName, getOutputPath, isPdfPath } from '../../src/lib/files'

describe('lib/files', () => {
	describe('isPdfPath', () => {
		it('returns true for .pdf files', () => {
			expect(isPdfPath('/path/to/document.pdf')).toBe(true)
			expect(isPdfPath('document.PDF')).toBe(true)
			expect(isPdfPath('my.file.pdf')).toBe(true)
		})

		it('returns false for non-pdf files', () => {
			expect(isPdfPath('/path/to/document.md')).toBe(false)
			expect(isPdfPath('/path/to/document.txt')).toBe(false)
			expect(isPdfPath('/path/to/document.doc')).toBe(false)
		})
	})

	describe('getFileName', () => {
		it('extracts filename from path', () => {
			expect(getFileName('/path/to/document.pdf')).toBe('document.pdf')
			expect(getFileName('/home/user/file.md')).toBe('file.md')
		})

		it('returns path if no slash found', () => {
			expect(getFileName('document.pdf')).toBe('document.pdf')
		})
	})

	describe('getOutputPath', () => {
		it('generates output path with locale', () => {
			expect(getOutputPath('/path/to/document.pdf', 'de-DE')).toBe('/path/to/document.de-DE.localized.md')
			expect(getOutputPath('/path/to/file.md', 'fr-FR')).toBe('/path/to/file.fr-FR.localized.md')
		})

		it('handles different file extensions', () => {
			expect(getOutputPath('doc.pdf', 'es-ES')).toBe('doc.es-ES.localized.md')
			expect(getOutputPath('doc.md', 'es-ES')).toBe('doc.es-ES.localized.md')
		})
	})

	describe('getOutputFileName', () => {
		it('generates output filename with locale', () => {
			expect(getOutputFileName('document.pdf', 'de-DE')).toBe('document.de-DE.localized.md')
			expect(getOutputFileName('document.md', 'fr-FR')).toBe('document.fr-FR.localized.md')
		})
	})
})
