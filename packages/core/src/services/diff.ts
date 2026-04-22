import { diffLines } from 'diff'
import type { DiffArtifact, DiffLine } from '../types'

export function buildDiffArtifacts(original: string, revised: string): DiffArtifact {
	const changes = diffLines(original, revised)

	let diffContent = ''
	const addedLines: string[] = []
	const removedLines: string[] = []

	for (const change of changes) {
		if (change.value === '') continue

		const lines = change.value.split('\n')
		for (const line of lines) {
			if (change.added) {
				diffContent += `+ ${line}\n`
				addedLines.push(line)
			} else if (change.removed) {
				diffContent += `- ${line}\n`
				removedLines.push(line)
			} else {
				diffContent += `  ${line}\n`
			}
		}
	}

	const diffMarkdown = `# Diff Review

\`\`\`diff
${diffContent}\`\`\`

**Summary:** ${addedLines.length} additions, ${removedLines.length} deletions.`

	const summaryJson = JSON.stringify({
		additions: addedLines.length,
		deletions: removedLines.length,
		totalChanges: addedLines.length + removedLines.length,
	})

	const summaryMarkdown = `## Change Summary

- **Additions:** ${addedLines.length} lines
- **Deletions:** ${removedLines.length} lines
- **Total changes:** ${addedLines.length + removedLines.length} lines

### Notable changes
${addedLines
	.slice(0, 5)
	.map((l) => `- Added: ${l}`)
	.join('\n')}
${removedLines
	.slice(0, 5)
	.map((l) => `- Removed: ${l}`)
	.join('\n')}`

	return {
		diffMarkdown,
		summaryMarkdown,
		summaryJson,
		patchText: diffContent,
	}
}

export function parsePatchToLines(patchText: string): DiffLine[] {
	const lines: DiffLine[] = []
	for (const line of patchText.split('\n')) {
		const trimmed = line.trim()
		if (trimmed.startsWith('+') && !trimmed.startsWith('+++')) {
			lines.push({ type: 'added', content: line.slice(2) })
		} else if (trimmed.startsWith('-') && !trimmed.startsWith('---')) {
			lines.push({ type: 'removed', content: line.slice(2) })
		} else if (!trimmed.startsWith('+++') && !trimmed.startsWith('---') && !trimmed.startsWith('diff')) {
			lines.push({ type: 'unchanged', content: line.slice(2) })
		}
	}
	return lines
}
