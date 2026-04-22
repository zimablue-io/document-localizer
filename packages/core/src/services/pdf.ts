// Use docutext/browser for DocuText (browser-compatible build)
import { DocuText } from 'docutext/browser'

// NOTE: docToMarkdown has cross-module symbol issues, use doc.text instead

// Use any to bypass TypeScript type mismatch between browser and main DocuText types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any

export type PdfProgressCallback = (currentPage: number, totalPages: number) => void

export async function convertPdfToMarkdown(
	input: Buffer | ArrayBuffer | Uint8Array,
	onProgress?: PdfProgressCallback
): Promise<string> {
	// Convert input to Uint8Array
	let data: Uint8Array

	if (input instanceof Uint8Array) {
		data = new Uint8Array(input)
	} else if (input instanceof ArrayBuffer) {
		data = new Uint8Array(input)
	} else if (input && typeof input === 'object' && 'buffer' in input) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const typedInput = input as any
		const buffer = typedInput.buffer
		const byteOffset = typedInput.byteOffset || 0
		const length = typedInput.byteLength || typedInput.length || 0
		if (buffer instanceof ArrayBuffer) {
			data = new Uint8Array(buffer, byteOffset, length)
		} else {
			throw new Error('Invalid input type: Buffer does not have valid ArrayBuffer')
		}
	} else {
		throw new Error('Invalid input type: expected Buffer, ArrayBuffer, or Uint8Array')
	}

	// Validate input
	if (data.length === 0) {
		throw new Error('PDF buffer is empty')
	}

	// Check for PDF magic bytes
	const pdfMagic = String.fromCharCode(...data.slice(0, 5))
	if (!pdfMagic.startsWith('%PDF-')) {
		throw new Error(`Invalid PDF file: missing PDF header (got: ${pdfMagic})`)
	}

	let doc: AnyDoc
	try {
		doc = DocuText.fromBuffer(data)
	} catch (docError) {
		console.error('[docutext] fromBuffer error:', docError)
		throw new Error(`PDF parsing library error: ${docError instanceof Error ? docError.message : String(docError)}`)
	}

	if (!doc) {
		throw new Error('PDF parsing returned null/undefined - file may be corrupted or unsupported')
	}

	// Get page count for progress reporting
	const pageCount = doc.pageCount || 0
	console.log('[docutext] Document loaded, pageCount:', pageCount)

	// Get text using doc.text property - this is the safest approach
	let markdown: string
	try {
		const fullText = doc.text
		if (fullText && fullText.trim().length > 0) {
			markdown = fullText
			console.log('[docutext] Got full text, length:', markdown.length)
		} else {
			throw new Error('PDF contains no extractable text (may be a scanned/image-based PDF)')
		}
	} catch (textError) {
		console.error('[docutext] text access error:', textError)
		throw new Error(
			`PDF text extraction failed: ${textError instanceof Error ? textError.message : String(textError)}`
		)
	}

	if (!markdown || markdown.trim().length === 0) {
		throw new Error('PDF contains no extractable text (may be a scanned/image-based PDF)')
	}

	// Report progress if callback provided
	if (onProgress && pageCount > 0) {
		for (let i = 0; i < pageCount; i++) {
			onProgress(i + 1, pageCount)
		}
	}

	return markdown
}
