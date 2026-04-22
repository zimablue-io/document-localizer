import type { LocalizationResult } from '../types'
import { chunkText } from '../utils/chunk'
import { OpenAIClient } from './openai-client'

const SYSTEM_PROMPT = `You are a document localization editor. Rewrite US English into UK English and locally appropriate phrasing while preserving meaning, structure, headings, tables, legal nuance, and markdown formatting.

Rules:
- Preserve markdown structure exactly where possible.
- Convert US spelling, punctuation, date wording, and idioms into UK usage.
- Prefer context-aware phrase changes over literal word swaps.
- Respect the supplied policy above your own preferences.
- If a phrase may be region-specific or ambiguous, choose the safest neutral UK wording.
- Do not summarize or omit content.
- Do not add commentary.
- Output only the rewritten markdown.`

function buildUserPrompt(args: { chunk: string; policy: string; targetLocale: string }): string {
	return [
		`Target locale: ${args.targetLocale}`,
		'',
		'Localization policy:',
		args.policy || 'No additional policy supplied.',
		'',
		'Localize the following markdown from US English into UK/localized English. Keep formatting intact.',
		'',
		'---BEGIN MARKDOWN---',
		args.chunk,
		'---END MARKDOWN---',
	].join('\n')
}

export type LocalizationProgressCallback = (currentChunk: number, totalChunks: number) => void

export async function localizeMarkdown(
	input: string,
	client: OpenAIClient,
	chunkSize: number,
	overlap: number,
	policy: string,
	targetLocale: string,
	onProgress?: LocalizationProgressCallback
): Promise<LocalizationResult> {
	const chunks = chunkText(input, chunkSize, overlap)
	const rewritten: string[] = []

	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i]
		const out = await client.generate(SYSTEM_PROMPT, buildUserPrompt({ chunk, policy, targetLocale }))
		rewritten.push(out)
		if (onProgress) {
			onProgress(i + 1, chunks.length)
		}
	}

	return {
		outputText: rewritten.join('\n'),
		chunks: chunks.length,
		model: client.model,
	}
}
