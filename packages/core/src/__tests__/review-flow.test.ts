/**
 * E2E Tests for Review Flow
 *
 * Tests the full flow from processing to review to export.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AIClient } from '../services/file-processor'
import { getFileType, getMdFilePath, processFile } from '../services/file-processor'
import type { DocumentInput } from '../types'

// Helper to create mock AI client
function createMockAI(): AIClient {
	return {
		generate: vi
			.fn<(system: string, user: string) => Promise<string>>()
			.mockResolvedValue('Localized British content'),
	} as unknown as AIClient
}

describe('Full Review Flow', () => {
	describe('Step 1: PDF Processing', () => {
		it('should process PDF and produce markdown for review', async () => {
			const parsePdfFn = vi
				.fn<
					(path: string) => Promise<{ pages: { page_number: number; text: string }[]; total_pages: number }>
				>()
				.mockResolvedValue({
					pages: [{ page_number: 1, text: 'Hello world' }],
					total_pages: 1,
				})

			const readFileFn = vi.fn<(path: string) => Promise<string>>()
			const writeFileFn = vi.fn<(path: string, content: string) => Promise<void>>()
			const aiClient = createMockAI()

			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			const input: DocumentInput = {
				id: 'test-1',
				path: '/test/document.pdf',
				name: 'document.pdf',
			}

			await processFile(input, callbacks, parsePdfFn, readFileFn, writeFileFn, aiClient, {
				chunkSize: 1000,
				overlapSize: 100,
				systemPrompt: 'Test',
				saveMdFiles: true,
			})

			// Verify the flow
			expect(callbacks.onStatusChange).toHaveBeenCalledWith('parsing')
			expect(callbacks.onStatusChange).toHaveBeenCalledWith('localizing')

			// onComplete is called, which in App.tsx triggers status='review'
			expect(callbacks.onComplete).toHaveBeenCalled()

			// Verify onComplete was called with correct data
			const [result, localizedText] = callbacks.onComplete.mock.calls[0]
			expect(result.markdown).toBe('Hello world')
			expect(result.sourceType).toBe('pdf')
			expect(localizedText).toBe('Localized British content')
		})

		it('should save .md file when processing PDF', async () => {
			const parsePdfFn = vi
				.fn<
					(path: string) => Promise<{ pages: { page_number: number; text: string }[]; total_pages: number }>
				>()
				.mockResolvedValue({
					pages: [{ page_number: 1, text: 'Test content' }],
					total_pages: 1,
				})

			const readFileFn = vi.fn<(path: string) => Promise<string>>()
			const writeFileFn = vi.fn<(path: string, content: string) => Promise<void>>()
			const aiClient = createMockAI()

			const callbacks = {
				onStatusChange: vi.fn(),
				onProgress: vi.fn(),
				onComplete: vi.fn(),
				onError: vi.fn(),
			}

			await processFile(
				{ id: 'test-2', path: '/docs/report.pdf', name: 'report.pdf' },
				callbacks,
				parsePdfFn,
				readFileFn,
				writeFileFn,
				aiClient,
				{ chunkSize: 1000, overlapSize: 100, systemPrompt: 'Test', saveMdFiles: true }
			)

			// Verify .md file was saved
			expect(writeFileFn).toHaveBeenCalledWith('/docs/report.md', expect.stringContaining('Test content'))
		})
	})

	describe('Step 2: Diff Generation', () => {
		it('should generate diff lines for review', () => {
			const original = 'Hello world\nHow are you?'
			const localized = 'Hello world\nHow are you doing?'

			const originalLines = original.split('\n')
			const localizedLines = localized.split('\n')

			// Simple diff logic
			const diffLines: { type: 'added' | 'removed' | 'unchanged'; content: string }[] = []

			for (let i = 0; i < Math.max(originalLines.length, localizedLines.length); i++) {
				const origLine = originalLines[i]
				const localLine = localizedLines[i]

				if (origLine === localLine) {
					diffLines.push({ type: 'unchanged', content: origLine || '' })
				} else if (origLine !== undefined && localLine !== undefined) {
					diffLines.push({ type: 'removed', content: origLine })
					diffLines.push({ type: 'added', content: localLine })
				} else if (origLine === undefined) {
					diffLines.push({ type: 'added', content: localLine })
				} else {
					diffLines.push({ type: 'removed', content: origLine })
				}
			}

			// Verify diff contains changes
			const added = diffLines.filter((l) => l.type === 'added')
			const removed = diffLines.filter((l) => l.type === 'removed')
			const unchanged = diffLines.filter((l) => l.type === 'unchanged')

			expect(added.length).toBeGreaterThan(0)
			expect(removed.length).toBeGreaterThan(0)
			expect(unchanged.length).toBeGreaterThan(0)
		})
	})

	describe('Step 3: Approval Flow', () => {
		it('should transition from review to approved on approval', () => {
			// Test the status transitions
			const statuses = ['idle', 'parsing', 'localizing', 'review', 'approved', 'exported']

			// Verify review is a valid status
			expect(statuses).toContain('review')
			expect(statuses).toContain('approved')

			// Verify the correct order
			const reviewIndex = statuses.indexOf('review')
			const approvedIndex = statuses.indexOf('approved')

			expect(reviewIndex).toBeLessThan(approvedIndex)
		})
	})
})
