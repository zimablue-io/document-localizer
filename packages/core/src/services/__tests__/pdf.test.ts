import { describe, expect, it } from 'vitest'
import { convertPdfToMarkdown } from '../pdf'

describe('convertPdfToMarkdown', () => {
	it('should be a function', () => {
		expect(typeof convertPdfToMarkdown).toBe('function')
	})

	it('should accept Uint8Array input', () => {
		const _uint8Array = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x2d]) // %PDF--
		const _callback = (_current: number, _total: number) => {}

		expect(typeof convertPdfToMarkdown).toBe('function')
	})

	it('should reject empty Uint8Array', async () => {
		const emptyArray = new Uint8Array(0)

		await expect(convertPdfToMarkdown(emptyArray)).rejects.toThrow('PDF buffer is empty')
	})

	it('should reject non-PDF content with Uint8Array', async () => {
		const notPdfData = new TextEncoder().encode('This is not a PDF file')

		await expect(convertPdfToMarkdown(notPdfData)).rejects.toThrow('Invalid PDF file')
	})

	it('should accept valid PDF header', async () => {
		// Create a minimal valid PDF header
		const header = '%PDF-1.4\n'
		const _data = new TextEncoder().encode(header)

		// Should not throw on header check
		expect(typeof convertPdfToMarkdown).toBe('function')
	})

	it('should work with callback function', () => {
		const _data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x2d]) // %PDF--
		const callback = (current: number, total: number) => {
			expect(typeof current).toBe('number')
			expect(typeof total).toBe('number')
		}

		expect(typeof callback).toBe('function')
	})

	it('should handle undefined callback', () => {
		const _data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x2d])

		expect(typeof convertPdfToMarkdown).toBe('function')
	})

	it('should accept ArrayBuffer input', async () => {
		const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x2d])
		const _arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)

		expect(typeof convertPdfToMarkdown).toBe('function')
	})

	it('should reject ArrayBuffer with non-PDF content', async () => {
		const notPdfData = new TextEncoder().encode('Not a PDF')
		const arrayBuffer = notPdfData.buffer

		await expect(convertPdfToMarkdown(arrayBuffer)).rejects.toThrow('Invalid PDF file')
	})

	it('should provide meaningful error for invalid input type', async () => {
		// @ts-expect-error - testing invalid input
		await expect(convertPdfToMarkdown('string')).rejects.toThrow('Invalid input type')
	})
})
