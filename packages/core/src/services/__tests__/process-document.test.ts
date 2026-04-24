import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PdfParseResult } from '../../types'
import { processDocument } from '../process-document'

const mockGenerate = vi.fn()

// Simple mock that returns an object with the generate method
vi.mock('../openai-client', () => ({
	OpenAIClient: vi.fn().mockImplementation(() => ({
		generate: mockGenerate,
	})),
}))

// Mock chunkText
vi.mock('../../utils/chunk', () => ({
	chunkText: vi.fn((text: string, chunkSize: number, _overlapSize: number) => {
		if (text.length === 0) return []
		// Simple chunking for testing - split by sentences or by chunk size
		const sentences = text.split(/(?<=[.!?])\s+/)
		if (sentences.length === 1) {
			// No sentence boundaries, chunk by size
			const chunks: string[] = []
			for (let i = 0; i < text.length; i += chunkSize) {
				chunks.push(text.slice(i, i + chunkSize))
			}
			return chunks.length > 0 ? chunks : [text]
		}
		return sentences
	}),
}))

describe('processDocument', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGenerate.mockResolvedValue('Localized content')
	})

	const createMockParsePdf = (result: PdfParseResult) => {
		return async (_path: string): Promise<PdfParseResult> => result
	}

	const createMockParsePdfError = (error: string) => {
		return async (_path: string): Promise<PdfParseResult> => {
			throw new Error(error)
		}
	}

	// Create a mock AI client - simple object that satisfies the interface at runtime
	const createMockAiClient = () => {
		return {
			generate: mockGenerate,
		} as never
	}

	describe('successful processing', () => {
		it('should call onStatusChange with parsing then localizing then complete', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: 'Hello world. Test content.' }],
				total_pages: 1,
				file_name: 'test.pdf',
			}

			// Mock returns 2 chunks, so we get localized twice
			mockGenerate.mockResolvedValue('Localized content')

			await processDocument(
				{ id: '1', path: '/test.pdf', name: 'test.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onStatusChange).toHaveBeenCalledWith('parsing')
			expect(callbacks.onStatusChange).toHaveBeenCalledWith('localizing')
			// Due to mock chunking splitting into 2 chunks, result has both
			expect(callbacks.onComplete).toHaveBeenCalledWith(
				'Hello world. Test content.',
				'Localized content\nLocalized content'
			)
			expect(callbacks.onError).not.toHaveBeenCalled()
		})

		it('should correctly join page texts with double newlines', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [
					{ page_number: 1, text: 'Page 1 content' },
					{ page_number: 2, text: 'Page 2 content' },
				],
				total_pages: 2,
				file_name: 'test.pdf',
			}

			await processDocument(
				{ id: '1', path: '/test.pdf', name: 'test.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onComplete).toHaveBeenCalledWith('Page 1 content\n\nPage 2 content', 'Localized content')
		})
	})

	describe('error handling', () => {
		it('should call onError when PDF parsing throws', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processDocument(
				{ id: '1', path: '/nonexistent.pdf', name: 'nonexistent.pdf' },
				callbacks,
				createMockParsePdfError('File not found'),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onStatusChange).toHaveBeenCalledWith('parsing')
			expect(callbacks.onError).toHaveBeenCalledWith('PDF parsing failed: File not found')
			expect(callbacks.onComplete).not.toHaveBeenCalled()
		})

		it('should call onError when parse result has no pages', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [],
				total_pages: 0,
				file_name: 'empty.pdf',
			}

			await processDocument(
				{ id: '1', path: '/empty.pdf', name: 'empty.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onError).toHaveBeenCalledWith(
				'PDF parsing returned no content - file may be empty or corrupted'
			)
		})

		it('should call onError when parse result pages is null', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult = { pages: null as any, total_pages: 0, file_name: 'null.pdf' }

			await processDocument(
				{ id: '1', path: '/null.pdf', name: 'null.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onError).toHaveBeenCalled()
		})

		it('should call onError when markdown is empty string', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: '' }],
				total_pages: 1,
				file_name: 'empty.pdf',
			}

			await processDocument(
				{ id: '1', path: '/empty.pdf', name: 'empty.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onError).toHaveBeenCalledWith(
				'PDF contains no extractable text - file may be scanned/image-based'
			)
		})

		it('should call onError when markdown is only whitespace', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: '   \n\t  ' }],
				total_pages: 1,
				file_name: 'whitespace.pdf',
			}

			await processDocument(
				{ id: '1', path: '/whitespace.pdf', name: 'whitespace.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onError).toHaveBeenCalled()
		})

		it('should call onError when AI generation fails', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: 'Some text content.' }],
				total_pages: 1,
				file_name: 'test.pdf',
			}

			mockGenerate.mockRejectedValue(new Error('AI service unavailable'))

			await processDocument(
				{ id: '1', path: '/test.pdf', name: 'test.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			expect(callbacks.onError).toHaveBeenCalledWith('Localization failed at chunk 1/1: AI service unavailable')
		})
	})

	describe('progress callbacks', () => {
		it('should call onProgress during parsing phase', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: 'Test' }],
				total_pages: 1,
				file_name: 'test.pdf',
			}

			await processDocument(
				{ id: '1', path: '/test.pdf', name: 'test.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			// First progress call shows parsing started (0 = starting)
			expect(callbacks.onProgress).toHaveBeenCalledWith(0, 1, 'parsing')
		})

		it('should call onProgress during localization phase', async () => {
			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const mockParseResult: PdfParseResult = {
				pages: [{ page_number: 1, text: 'Chunk 1. Chunk 2.' }],
				total_pages: 1,
				file_name: 'test.pdf',
			}

			await processDocument(
				{ id: '1', path: '/test.pdf', name: 'test.pdf' },
				callbacks,
				createMockParsePdf(mockParseResult),
				createMockAiClient(),
				{ chunkSize: 100, overlapSize: 10, systemPrompt: 'test' }
			)

			// Should have progress calls for localization
			const localizingCalls = callbacks.onProgress.mock.calls.filter((call) => call[2] === 'localizing')
			expect(localizingCalls.length).toBeGreaterThan(0)
		})
	})
})
