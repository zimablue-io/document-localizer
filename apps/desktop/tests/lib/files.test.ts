import { describe, expect, it } from 'vitest'
import { getFileName, getOutputFileName, getOutputPath, isPdfPath } from '../../src/lib/files'

describe('lib/files', () => {
	describe('getFileName', () => {
		it('extracts filename from unix path', () => {
			expect(getFileName('/home/user/documents/report.pdf')).toBe('report.pdf')
		})

		it('extracts filename from deep unix path', () => {
			expect(getFileName('/home/user/documents/projects/report.pdf')).toBe('report.pdf')
		})

		it('handles filename without path', () => {
			expect(getFileName('report.pdf')).toBe('report.pdf')
		})

		it('handles nested directories', () => {
			expect(getFileName('/home/user/documents/projects/report.pdf')).toBe('report.pdf')
		})

		it('handles filename with spaces', () => {
			expect(getFileName('/home/user/My Documents/report file.pdf')).toBe('report file.pdf')
		})
	})

	describe('isPdfPath', () => {
		it('returns true for .pdf extension', () => {
			expect(isPdfPath('/path/to/document.pdf')).toBe(true)
		})

		it('returns true for .PDF uppercase extension', () => {
			expect(isPdfPath('/path/to/document.PDF')).toBe(true)
		})

		it('returns false for .md extension', () => {
			expect(isPdfPath('/path/to/document.md')).toBe(false)
		})

		it('returns false for .txt extension', () => {
			expect(isPdfPath('/path/to/document.txt')).toBe(false)
		})

		it('returns false for filename without extension', () => {
			expect(isPdfPath('/path/to/document')).toBe(false)
		})

		it('returns false for path containing .pdf in folder name', () => {
			expect(isPdfPath('/path/to/mydocument.pdf.backup/file.pdf')).toBe(true)
		})

		it('handles case-insensitive matching', () => {
			expect(isPdfPath('/path/to/document.Pdf')).toBe(true)
			expect(isPdfPath('/path/to/document.pDf')).toBe(true)
		})
	})

	describe('getOutputPath', () => {
		it('generates output path for PDF source', () => {
			const result = getOutputPath('/home/user/doc.pdf', 'fr-FR')
			expect(result).toBe('/home/user/doc.fr-FR.localized.md')
		})

		it('generates output path for markdown source', () => {
			const result = getOutputPath('/home/user/doc.md', 'de-DE')
			expect(result).toBe('/home/user/doc.de-DE.localized.md')
		})

		it('handles uppercase extension', () => {
			const result = getOutputPath('/home/user/doc.PDF', 'es-ES')
			// Output preserves locale code case and replaces PDF extension
			expect(result).toBe('/home/user/doc.es-ES.localized.md')
		})

		it('handles filename with spaces', () => {
			const result = getOutputPath('/home/user/My Document.pdf', 'ja-JP')
			expect(result).toBe('/home/user/My Document.ja-JP.localized.md')
		})

		it('generates output path for markdown with uppercase MD', () => {
			const result = getOutputPath('/home/user/Document.MD', 'zh-CN')
			// Output replaces MD extension with locale code
			expect(result).toBe('/home/user/Document.zh-CN.localized.md')
		})
	})

	describe('getOutputFileName', () => {
		it('generates output filename for PDF source', () => {
			const result = getOutputFileName('document.pdf', 'fr-FR')
			expect(result).toBe('document.fr-FR.localized.md')
		})

		it('generates output filename for markdown source', () => {
			const result = getOutputFileName('document.md', 'de-DE')
			expect(result).toBe('document.de-DE.localized.md')
		})

		it('handles filename with multiple dots', () => {
			const result = getOutputFileName('document.final.pdf', 'es-ES')
			expect(result).toBe('document.final.es-ES.localized.md')
		})

		it('handles complex filename with spaces', () => {
			const result = getOutputFileName('My Document File.pdf', 'ja-JP')
			expect(result).toBe('My Document File.ja-JP.localized.md')
		})
	})
})
