import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AIClient } from '../services/file-processor'
import { getFileType, getMdFilePath, processFile } from '../services/file-processor'
import type { DocumentInput, FileProcessorCallbacks } from '../types'

// Helper to create typed mock functions
function createMockParsePdf() {
	return vi.fn<(path: string) => Promise<{ pages: { page_number: number; text: string }[]; total_pages: number }>>()
}

function createMockReadFile() {
	return vi.fn<(path: string) => Promise<string>>()
}

function createMockWriteFile() {
	return vi.fn<(path: string, content: string) => Promise<void>>()
}

function createMockAIClient(): AIClient {
	return {
		generate: vi.fn<(system: string, user: string) => Promise<string>>(),
	} as unknown as AIClient
}

describe('getFileType', () => {
	it('detects PDF files', () => {
		expect(getFileType('/path/to/document.pdf')).toBe('pdf')
		expect(getFileType('/path/to/document.PDF')).toBe('pdf')
		expect(getFileType('C:\\Users\\doc.pdf')).toBe('pdf')
	})

	it('detects markdown files', () => {
		expect(getFileType('/path/to/document.md')).toBe('md')
		expect(getFileType('/path/to/document.markdown')).toBe('md')
		expect(getFileType('/path/to/README.MD')).toBe('md')
	})

	it('returns unknown for other files', () => {
		expect(getFileType('/path/to/document.txt')).toBe('unknown')
		expect(getFileType('/path/to/doc.docx')).toBe('unknown')
	})
})

describe('getMdFilePath', () => {
	it('replaces .pdf extension with .md', () => {
		expect(getMdFilePath('/path/to/document.pdf')).toBe('/path/to/document.md')
		expect(getMdFilePath('/path/to/my-file.PDF')).toBe('/path/to/my-file.md')
	})

	it('replaces other extensions with .md', () => {
		expect(getMdFilePath('/path/to/document.docx')).toBe('/path/to/document.md')
		expect(getMdFilePath('/path/to/file.txt')).toBe('/path/to/file.md')
	})

	it('handles files with multiple dots', () => {
		expect(getMdFilePath('/path/to/my.document.pdf')).toBe('/path/to/my.document.md')
	})
})

describe('processFile', () => {
	let callbacks: FileProcessorCallbacks
	let parsePdfFn: ReturnType<typeof createMockParsePdf>
	let readFileFn: ReturnType<typeof createMockReadFile>
	let writeFileFn: ReturnType<typeof createMockWriteFile>
	let aiClient: AIClient

	beforeEach(() => {
		callbacks = {
			onStatusChange: vi.fn(),
			onProgress: vi.fn(),
			onComplete: vi.fn(),
			onError: vi.fn(),
		}

		parsePdfFn = createMockParsePdf()
		readFileFn = createMockReadFile()
		writeFileFn = createMockWriteFile()
		aiClient = createMockAIClient()
	})

	describe('PDF processing', () => {
		it('parses PDF and localizes content', async () => {
			const input: DocumentInput = {
				id: 'test-1',
				path: '/test/document.pdf',
				name: 'document.pdf',
			}

			parsePdfFn.mockResolvedValue({
				pages: [
					{ page_number: 1, text: 'Page 1 content' },
					{ page_number: 2, text: 'Page 2 content' },
				],
				total_pages: 2,
			})

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: false,
			})

			expect(parsePdfFn).toHaveBeenCalledWith('/test/document.pdf')
			expect(callbacks.onStatusChange).toHaveBeenCalledWith('parsing')
			expect(aiClient.generate).toHaveBeenCalled()
			expect(callbacks.onComplete).toHaveBeenCalledWith(
				expect.objectContaining({ sourceType: 'pdf' }),
				expect.any(String)
			)
		})

		it('saves .md file when saveMdFiles is true', async () => {
			const input: DocumentInput = {
				id: 'test-2',
				path: '/test/report.pdf',
				name: 'report.pdf',
			}

			parsePdfFn.mockResolvedValue({
				pages: [{ page_number: 1, text: 'Test content' }],
				total_pages: 1,
			})

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: true,
			})

			expect(writeFileFn).toHaveBeenCalledWith('/test/report.md', expect.stringContaining('Test content'))
		})

		it('calls onError when PDF has no pages', async () => {
			const input: DocumentInput = {
				id: 'test-3',
				path: '/test/empty.pdf',
				name: 'empty.pdf',
			}

			parsePdfFn.mockResolvedValue({
				pages: [],
				total_pages: 0,
			})

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: false,
			})

			expect(callbacks.onError).toHaveBeenCalledWith(expect.stringContaining('no content'))
		})
	})

	describe('Markdown processing', () => {
		it('reads .md files directly without parsing', async () => {
			const input: DocumentInput = {
				id: 'test-4',
				path: '/test/notes.md',
				name: 'notes.md',
			}

			readFileFn.mockResolvedValue('# My Notes\n\nSome content here.')

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: false,
			})

			expect(readFileFn).toHaveBeenCalledWith('/test/notes.md')
			expect(parsePdfFn).not.toHaveBeenCalled()
			expect(callbacks.onStatusChange).toHaveBeenCalledWith('localizing')
		})

		it('does not save .md file for .md source files', async () => {
			const input: DocumentInput = {
				id: 'test-5',
				path: '/test/source.md',
				name: 'source.md',
			}

			readFileFn.mockResolvedValue('Content')

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: true,
			})

			expect(writeFileFn).not.toHaveBeenCalled()
		})
	})

	describe('Localization', () => {
		it('calls generate with system prompt and user prompt', async () => {
			const input: DocumentInput = {
				id: 'test-6',
				path: '/test/test.pdf',
				name: 'test.pdf',
			}

			parsePdfFn.mockResolvedValue({
				pages: [{ page_number: 1, text: 'Content here' }],
				total_pages: 1,
			})

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'My System Prompt',
				saveMdFiles: false,
			})

			// Verify generate was called with correct prompts
			expect(aiClient.generate).toHaveBeenCalledWith('My System Prompt', expect.stringContaining('Content here'))
		})

		it('reports progress per chunk', async () => {
			const input: DocumentInput = {
				id: 'test-7',
				path: '/test/test.pdf',
				name: 'test.pdf',
			}

			parsePdfFn.mockResolvedValue({
				pages: [{ page_number: 1, text: 'Short content' }],
				total_pages: 1,
			})

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: false,
			})

			expect(callbacks.onProgress).toHaveBeenCalledWith(1, 1, 'localizing')
		})
	})
})
