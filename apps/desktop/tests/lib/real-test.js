/**
 * Real integration test - calls actual AI API
 * Run with: node apps/desktop/tests/lib/real-test.js
 */

import { readFileSync } from 'node:fs'

const TEST_FILE_PATH = '/Users/lefamoffat/Desktop/books/man-from-the-south.md'
const API_URL = 'http://localhost:8080'
const MODEL = 'gemma3n:e2b-instruct'

const testFileContent = readFileSync(TEST_FILE_PATH, 'utf-8')

// Copy buildPrompt logic directly (to avoid import issues)
function buildPrompt(template, params) {
	return template
		.replace(/{sourceLocale}/g, params.sourceLocale || '')
		.replace(/{targetLocale}/g, params.targetLocale || '')
		.replace('{text}', params.text)
}

// DEFAULT_LOCALIZATION_PROMPT (updated to be deterministic)
const DEFAULT_LOCALIZATION_PROMPT = `You are a professional translator. Your task is to convert text from {sourceLocale} to {targetLocale}.

RULES:
1. Output language: {targetLocale} ONLY - never output {sourceLocale}
2. Convert words to match {targetLocale} spelling/grammar conventions
3. Keep sentence structure and punctuation identical
4. Do not add, remove, or change any words except for locale-specific conversions
5. Do not explain or comment on the translation

TEXT TO CONVERT:
{text}

OUTPUT:`

async function callAI(content) {
	console.log(`\n--- Sending to AI (${content.length} chars) ---`)
	console.log(`Prompt preview:\n${content.substring(0, 300)}...\n`)

	const response = await fetch(`${API_URL}/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: MODEL,
			messages: [{ role: 'user', content }],
			temperature: 0.2,
			max_tokens: 4096,
			stream: false,
		}),
	})
	const data = await response.json()
	return data.choices?.[0]?.message?.content || ''
}

function isEnglish(text) {
	const englishPatterns = [
		/^(Man from|It was|I went|The boy|The girl|A fine|Just then)/,
		/Roald Dahl/,
		/^There are/,
		/^I stood/,
		/^I went/,
	]
	return englishPatterns.some((p) => p.test(text.trim()))
}

function isGerman(text) {
	const germanPatterns = [
		/^(Mann aus|Es war|Ich ging|Ich stand|Es war ein|Die amerikanischen)/,
		/^Ich (ging|stand|war)/,
	]
	return germanPatterns.some((p) => p.test(text.trim()))
}

async function runTest() {
	const sourceLocale = 'en-US'
	const targetLocale = 'de-DE'

	console.log(`\n=== REAL Integration Test - SEQUENTIAL (no parallelism) ===`)
	console.log(`Source: ${sourceLocale} → Target: ${targetLocale}`)
	console.log(`Model: ${MODEL}`)
	console.log(`File: ${TEST_FILE_PATH}\n`)

	const basePrompt = buildPrompt(DEFAULT_LOCALIZATION_PROMPT, {
		sourceLocale,
		targetLocale,
		text: '{text}',
	})

	console.log(`Base prompt preview:\n${basePrompt.substring(0, 400)}...\n`)

	if (!basePrompt.includes('en-US')) {
		throw new Error('FAIL: Base prompt missing en-US!')
	}
	if (!basePrompt.includes('de-DE')) {
		throw new Error('FAIL: Base prompt missing de-DE!')
	}
	if (basePrompt.includes('{sourceLocale}')) {
		throw new Error('FAIL: Base prompt has unreplaced {sourceLocale}!')
	}
	if (basePrompt.includes('{targetLocale}')) {
		throw new Error('FAIL: Base prompt has unreplaced {targetLocale}!')
	}

	console.log('✓ Base prompt built correctly\n')

	const paragraphs = testFileContent
		.split(/\n\n+/)
		.filter((p) => p.trim())
		.slice(0, 10)
	console.log(`Testing ${paragraphs.length} paragraphs SEQUENTIALLY...\n`)

	let inconsistentCount = 0
	for (let i = 0; i < paragraphs.length; i++) {
		const paragraph = paragraphs[i]
		const content = basePrompt.replace('{text}', paragraph)

		const hasEnUS = content.includes('en-US')
		const hasDeDE = content.includes('de-DE')
		const hasUnreplacedSource = content.includes('{sourceLocale}')
		const hasUnreplacedTarget = content.includes('{targetLocale}')

		if (!hasEnUS || !hasDeDE || hasUnreplacedSource || hasUnreplacedTarget) {
			console.log(`❌ FAIL: Paragraph ${i + 1} has issues!`)
			continue
		}

		try {
			const response = await callAI(content)
			const trimmed = response.trim()

			const isEng = isEnglish(trimmed)
			const isDeu = isGerman(trimmed)

			if (isEng && !isDeu) {
				inconsistentCount++
				console.log(`⚠️  Paragraph ${i + 1}/${paragraphs.length} - ENGLISH (expected German):`)
				console.log(`   "${trimmed.substring(0, 80)}..."`)
			} else if (isDeu) {
				console.log(`✓ Paragraph ${i + 1}/${paragraphs.length} - German: "${trimmed.substring(0, 80)}..."`)
			} else {
				console.log(`? Paragraph ${i + 1}/${paragraphs.length} - Unknown: "${trimmed.substring(0, 80)}..."`)
			}
		} catch (err) {
			console.error(`  AI call failed: ${err.message}\n`)
		}
	}

	console.log(`\n=== Result: ${inconsistentCount}/${paragraphs.length} were English (not German) ===\n`)
}

runTest().catch(console.error)
