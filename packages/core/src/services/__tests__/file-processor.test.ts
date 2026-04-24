import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFileType, getMdFilePath, processFile } from '../file-processor'

const mockGenerate = vi.fn()

vi.mock('../openai-client', () => ({
	OpenAIClient: vi.fn().mockImplementation(() => ({
		generate: mockGenerate,
	})),
}))

vi.mock('../../utils/chunk', () => ({
	chunkText: vi.fn((text: string, chunkSize: number, _overlapSize: number) => {
		if (text.length === 0) return []
		const sentences = text.split(/(?<=[.!?])\s+/)
		if (sentences.length === 1) {
			const chunks: string[] = []
			for (let i = 0; i < text.length; i += chunkSize) {
				chunks.push(text.slice(i, i + chunkSize))
			}
			return chunks.length > 0 ? chunks : [text]
		}
		return sentences
	}),
}))

describe('getFileType', () => {
	it('should detect .pdf files', () => {
		expect(getFileType('/path/to/document.pdf')).toBe('pdf')
		expect(getFileType('C:\\Users\\test\\file.PDF')).toBe('pdf')
	})

	it('should detect .md files', () => {
		expect(getFileType('/path/to/document.md')).toBe('md')
		expect(getFileType('/path/to/document.markdown')).toBe('md')
		expect(getFileType('C:\\Users\\test\\file.MD')).toBe('md')
	})

	it('should return unknown for other extensions', () => {
		expect(getFileType('/path/to/document.txt')).toBe('unknown')
		expect(getFileType('/path/to/document.docx')).toBe('unknown')
	})
})

describe('getMdFilePath', () => {
	it('should convert .pdf to .md path', () => {
		expect(getMdFilePath('/path/to/document.pdf')).toBe('/path/to/document.md')
	})

	it('should replace extension correctly', () => {
		expect(getMdFilePath('/path/to/document.docx')).toBe('/path/to/document.md')
	})

	it('should handle complex filenames', () => {
		expect(getMdFilePath('/path/to/file.name.pdf')).toBe('/path/to/file.name.md')
	})
})

describe('processFile', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGenerate.mockResolvedValue('Localized content')
	})

	const createMockParsePdf = (result: { pages: { page_number: number; text: string }[]; total_pages: number }) => {
		return async (_path: string) => result
	}

	const createMockReadFile = (content: string) => {
		return async (_path: string) => content
	}

	const createMockWriteFile = vi.fn().mockResolvedValue(undefined)

	const createMockAiClient = () =>
		({
			generate: mockGenerate,
		}) as never

	describe('markdown file processing', () => {
		it('should skip conversion for .md files', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: '1', path: '/test/doc.md', name: 'doc.md' },
				callbacks,
				createMockParsePdf({ pages: [], total_pages: 0 }),
				createMockReadFile('# Hello World\n\nSome content here.'),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: true }
			)

			expect(callbacks.onStatusChange).toHaveBeenCalledWith('localizing')
			expect(callbacks.onComplete).toHaveBeenCalledWith(
				expect.objectContaining({ sourceType: 'md' }),
				expect.any(String)
			)
		})

		it('should not call parsePdfFn for .md files', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const parsePdfSpy = vi.fn()

			await processFile(
				{ id: '1', path: '/test/doc.md', name: 'doc.md' },
				callbacks,
				parsePdfSpy,
				createMockReadFile('# Hello World'),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: false }
			)

			expect(parsePdfSpy).not.toHaveBeenCalled()
		})
	})

	describe('PDF file processing', () => {
		it('should parse PDF and convert to markdown', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: '1', path: '/test/document.pdf', name: 'document.pdf' },
				callbacks,
				createMockParsePdf({
					pages: [{ page_number: 1, text: 'Page 1 content' }],
					total_pages: 1,
				}),
				createMockReadFile(''),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: true }
			)

			expect(callbacks.onStatusChange).toHaveBeenCalledWith('parsing')
			expect(callbacks.onComplete).toHaveBeenCalledWith(
				expect.objectContaining({ sourceType: 'pdf' }),
				expect.any(String)
			)
		})

		it('should save .md file when saveMdFiles is true', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: '1', path: '/test/document.pdf', name: 'document.pdf' },
				callbacks,
				createMockParsePdf({
					pages: [{ page_number: 1, text: 'Some content' }],
					total_pages: 1,
				}),
				createMockReadFile(''),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: true }
			)

			expect(createMockWriteFile).toHaveBeenCalledWith('/test/document.md', expect.any(String))
			expect(callbacks.onComplete).toHaveBeenCalledWith(
				expect.objectContaining({ mdFilePath: '/test/document.md' }),
				expect.any(String)
			)
		})

		it('should not save .md file when saveMdFiles is false', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: '1', path: '/test/document.pdf', name: 'document.pdf' },
				callbacks,
				createMockParsePdf({
					pages: [{ page_number: 1, text: 'Some content' }],
					total_pages: 1,
				}),
				createMockReadFile(''),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: false }
			)

			expect(createMockWriteFile).not.toHaveBeenCalled()
		})
	})

	describe('error handling', () => {
		it('should error for unknown file types', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: '1', path: '/test/document.txt', name: 'document.txt' },
				callbacks,
				createMockParsePdf({ pages: [], total_pages: 0 }),
				createMockReadFile(''),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: true }
			)

			expect(callbacks.onError).toHaveBeenCalledWith('Unsupported file type: /test/document.txt')
		})

		it('should handle PDF parsing errors', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const parsePdfError = async (_path: string) => {
				throw new Error('File not found')
			}

			await processFile(
				{ id: '1', path: '/test/document.pdf', name: 'document.pdf' },
				callbacks,
				parsePdfError,
				createMockReadFile(''),
				createMockWriteFile,
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test', saveMdFiles: true }
			)

			expect(callbacks.onError).toHaveBeenCalledWith('PDF parsing failed: File not found')
		})
	})
})
