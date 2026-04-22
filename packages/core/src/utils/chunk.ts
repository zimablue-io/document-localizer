export interface ChunkResult {
	chunks: string[]
	metadata: {
		totalChunks: number
		avgChunkSize: number
		overlap: number
	}
}

export function chunkText(text: string, maxTokens: number, overlapTokens: number): string[] {
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
