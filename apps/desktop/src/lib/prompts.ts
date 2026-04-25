/**
 * Localization instruction prompts for document translation.
 * Contains the default prompts and prompt generation utilities.
 */

export const DEFAULT_TRANSLATION_PROMPT = `You are a professional translator. Translate the following text from {sourceLocale} to {targetLocale}.

REQUIREMENTS:
- Translate meaning accurately, not word-for-word
- Use natural, fluent {targetLocale} phrasing
- Maintain the same tone and formality level as the original
- Preserve all punctuation and paragraph structure
- Keep proper nouns (names, places) in their localized form if known

---BEGIN TEXT---
{text}
---END TEXT---

OUTPUT ONLY the translation. No explanations, comments, or markers.`

export const DEFAULT_LOCALIZATION_PROMPT = `STRICT LOCALIZATION RULES - FOLLOW EXACTLY:

CRITICAL - THIS IS WORD REPLACEMENT ONLY:
- You are NOT writing a story. You are NOT being creative. You are ONLY replacing words.
- NEVER invent, add, remove, or modify any content beyond word-level changes
- NEVER change sentence structure, punctuation, or paragraph structure
- NEVER add dialogue, descriptions, or narrative that wasn't in the original
- The text you output MUST contain EXACTLY the same words as the input, just with spelling/word replacements

TARGET LOCALE CONVERSIONS ONLY:
- color → colour (or vice versa depending on target)
- honor → honour (or vice versa)
- Words like "mom", "dad", "football", "soccer" → use the target locale equivalent
- Only make changes that match the target locale's spelling/word conventions

PRESERVE EVERYTHING EXACTLY:
- Keep every single word from the original
- Keep all punctuation exactly as written
- Keep all paragraph breaks exactly as in the original
- Keep all dialogue exactly as written - do NOT add speech tags like "he said" or "she whispered"
- Keep all capitalization exactly as in the original
- Keep all sentence structure exactly as in the original
- If a word has no locale-specific alternative, leave it EXACTLY as is

OUTPUT FORMAT:
- Output EXACTLY one paragraph of text
- NO markers, NO comments, NO explanations
- NO leading/trailing whitespace

---BEGIN TEXT---
{text}
---END TEXT---`

export function buildPrompt(
	template: string,
	params: { sourceLocale?: string; targetLocale?: string; text: string }
): string {
	return template
		.replace('{sourceLocale}', params.sourceLocale || '')
		.replace('{targetLocale}', params.targetLocale || '')
		.replace('{text}', params.text)
}
