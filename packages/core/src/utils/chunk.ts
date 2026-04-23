import type { Chunk } from '../types'
import { createProcessingState } from './chunk-manager'

export interface ChunkResult {
	chunks: string[]
	metadata: {
		totalChunks: number
		avgChunkSize: number
		overlap: number
	}
}

/**
 * Chunk result with paragraph indices for tracking
 */
export interface ChunkWithIndices {
	chunk: Chunk
	paragraphIndices: number[]
}

/**
 * Split markdown text into paragraphs (blocks separated by double newlines).
 * Each block is considered atomic - we never split mid-paragraph.
 */
function splitIntoParagraphs(text: string): string[] {
	// Split on double newlines (or more) to get paragraphs
	// Keep the separators as part of the content for reconstruction
	const paragraphs: string[] = []
	let current = ''

	for (const line of text.split('\n')) {
		if (line.trim() === '' && current.trim() !== '') {
			// Empty line signals end of current paragraph
			paragraphs.push(current.trim())
			current = ''
		} else if (line.trim() !== '') {
			// Non-empty line - add to current paragraph
			if (current) {
				current += `\n${line}`
			} else {
				current = line
			}
		}
		// Skip multiple consecutive empty lines
	}

	// Don't forget the last paragraph
	if (current.trim()) {
		paragraphs.push(current.trim())
	}

	return paragraphs
}

/**
 * Markdown-aware text chunking that preserves paragraph structure.
 * Never splits in the middle of a paragraph.
 */
export function chunkText(text: string, maxChunkSize: number, overlapSize: number): string[] {
	const paragraphs = splitIntoParagraphs(text)
	if (paragraphs.length === 0) return []

	const chunks: string[] = []
	let currentChunk = ''
	let currentSize = 0
	let paragraphIndex = 0

	while (paragraphIndex < paragraphs.length) {
		const paragraph = paragraphs[paragraphIndex]
		const paragraphSize = paragraph.length

		// If single paragraph exceeds max, we have to process it as-is
		// (this shouldn't happen often with reasonable maxChunkSize)
		if (paragraphSize > maxChunkSize) {
			// Finish current chunk if non-empty
			if (currentChunk.trim()) {
				chunks.push(currentChunk.trim())
			}
			chunks.push(paragraph)
			currentChunk = ''
			currentSize = 0
			paragraphIndex++
			continue
		}

		// Check if adding this paragraph would exceed limit
		const separator = currentChunk.trim() ? '\n\n' : ''
		const newSize = currentSize + separator.length + paragraphSize

		if (newSize <= maxChunkSize) {
			// Add to current chunk
			currentChunk = currentChunk.trim() ? currentChunk + separator + paragraph : paragraph
			currentSize = newSize
			paragraphIndex++
		} else {
			// Current chunk is full
			if (currentChunk.trim()) {
				chunks.push(currentChunk.trim())
			}

			// Start new chunk with overlap (previous paragraphs)
			if (overlapSize > 0 && paragraphIndex > 0) {
				const overlapParagraphs: string[] = []
				let overlapTotal = 0
				let i = paragraphIndex - 1

				// Go backwards to collect overlapping paragraphs
				while (i >= 0 && overlapTotal < overlapSize) {
					const p = paragraphs[i]
					if (overlapTotal + p.length + (overlapParagraphs.length > 0 ? 2 : 0) <= overlapSize) {
						overlapParagraphs.unshift(p)
						overlapTotal += p.length + (overlapParagraphs.length > 1 ? 2 : 0)
						i--
					} else {
						break
					}
				}

				currentChunk = overlapParagraphs.join('\n\n')
				currentSize = currentChunk.length
			} else {
				currentChunk = ''
				currentSize = 0
			}
		}
	}

	// Don't forget the last chunk
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim())
	}

	return chunks
}

/**
 * Legacy token-based chunking for backward compatibility.
 * Note: Prefer chunkText() for markdown content.
 */
export function chunkTextByTokens(text: string, maxTokens: number, overlapTokens: number): string[] {
	const words = text.split(/\s+/).filter((w) => w.length > 0)
	if (words.length === 0) return []

	const chunks: string[] = []
	let start = 0

	while (start < words.length) {
		let end = start
		let tokenCount = 0

		while (end < words.length) {
			const wordTokens = Math.ceil(words[end].length / 4)
			if (tokenCount + wordTokens > maxTokens) break
			tokenCount += wordTokens
			end++
		}

		if (end === start) {
			end = Math.min(start + 1, words.length)
		}

		chunks.push(words.slice(start, end).join(' '))

		if (end >= words.length) break

		const overlapWords = Math.floor(overlapTokens / 4)
		start = end - overlapWords
		if (start >= end || start < 0) start = end
	}

	return chunks
}

export type { ChunkResult as ChunkMetadata }

/**
 * Chunk text with paragraph index tracking for processing state
 */
export function chunkTextWithIndices(
	text: string,
	maxChunkSize: number,
	overlapSize: number = 50
): { chunks: string[]; paragraphIndices: number[][]; processingState: ReturnType<typeof createProcessingState> } {
	const paragraphs = splitIntoParagraphs(text)
	if (paragraphs.length === 0) {
		return {
			chunks: [],
			paragraphIndices: [],
			processingState: createProcessingState('temp', []),
		}
	}

	const chunks: string[] = []
	const paragraphIndices: number[][] = []

	let currentChunkParagraphs: string[] = []
	let currentParagraphIndices: number[] = []
	let currentSize = 0
	let paragraphIndex = 0

	while (paragraphIndex < paragraphs.length) {
		const paragraph = paragraphs[paragraphIndex]
		const paragraphSize = paragraph.length
		const separator = currentChunkParagraphs.length > 0 ? 2 : 0 // "\n\n"
		const newSize = currentSize + separator + paragraphSize

		// If single paragraph exceeds max, process it alone
		if (paragraphSize > maxChunkSize) {
			if (currentChunkParagraphs.length > 0) {
				chunks.push(currentChunkParagraphs.join('\n\n'))
				paragraphIndices.push([...currentParagraphIndices])
				currentChunkParagraphs = []
				currentParagraphIndices = []
				currentSize = 0
			}
			chunks.push(paragraph)
			paragraphIndices.push([paragraphIndex])
			paragraphIndex++
			continue
		}

		// Check if adding paragraph exceeds limit
		if (newSize <= maxChunkSize) {
			currentChunkParagraphs.push(paragraph)
			currentParagraphIndices.push(paragraphIndex)
			currentSize = newSize
			paragraphIndex++
		} else {
			// Save current chunk
			if (currentChunkParagraphs.length > 0) {
				chunks.push(currentChunkParagraphs.join('\n\n'))
				paragraphIndices.push([...currentParagraphIndices])
			}

			// Start new chunk with overlap
			if (overlapSize > 0 && paragraphIndex > 0) {
				// Take last paragraphs for overlap
				const overlapParagraphs: string[] = []
				const overlapIndices: number[] = []
				let overlapTotal = 0
				let i = paragraphIndex - 1

				while (i >= 0 && overlapTotal < overlapSize) {
					const p = paragraphs[i]
					const pSize = p.length + (overlapParagraphs.length > 0 ? 2 : 0)
					if (overlapTotal + pSize <= overlapSize) {
						overlapParagraphs.unshift(p)
						overlapIndices.unshift(i)
						overlapTotal += pSize
						i--
					} else {
						break
					}
				}

				currentChunkParagraphs = overlapParagraphs
				currentParagraphIndices = overlapIndices
				currentSize = overlapTotal
			} else {
				currentChunkParagraphs = []
				currentParagraphIndices = []
				currentSize = 0
			}
		}
	}

	// Don't forget the last chunk
	if (currentChunkParagraphs.length > 0) {
		chunks.push(currentChunkParagraphs.join('\n\n'))
		paragraphIndices.push([...currentParagraphIndices])
	}

	// Create processing state with Chunk objects
	const chunkObjects: Chunk[] = chunks.map((chunkText, index) => ({
		id: crypto.randomUUID(),
		paragraphIndices: paragraphIndices[index],
		originalText: chunkText,
		status: 'pending',
		charCount: chunkText.length,
		createdAt: new Date().toISOString(),
	}))

	return {
		chunks,
		paragraphIndices,
		processingState: createProcessingState('temp', chunkObjects),
	}
}
