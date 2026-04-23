import type { DocumentState } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import { useState } from 'react'
import { diffWords } from 'diff'

interface DiffViewProps {
	document: DocumentState
	onApprove: () => void
	onReject: () => void
	onBack: () => void
}

type ViewMode = 'side-by-side' | 'list'

// LEFT COLUMN: Shows ONLY original text
// - Removed words are highlighted in red (they were changed/removed)
// - Added words are NOT shown (they don't exist in original)
function OriginalColumn({ origPara, locPara }: { origPara: string; locPara: string }) {
	const diff = diffWords(origPara, locPara)
	return (
		<span className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
			{diff.map((part, i) => {
				if (part.removed) {
					// Word removed/changed - highlight in red
					return (
						<span key={i} className="bg-red-900/50 text-red-300 px-0.5 rounded-sm mx-[-1px]">
							{part.value}
						</span>
					)
				}
				if (part.added) {
					// This word was added in localized - skip it (doesn't exist in original)
					return null
				}
				// Unchanged text
				return <span key={i}>{part.value}</span>
			})}
		</span>
	)
}

// RIGHT COLUMN: Shows ONLY localized text
// - Added words are highlighted in green (they were added)
// - Removed words are NOT shown (they don't exist in localized)
function LocalizedColumn({ origPara, locPara }: { origPara: string; locPara: string }) {
	const diff = diffWords(origPara, locPara)
	return (
		<span className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
			{diff.map((part, i) => {
				if (part.added) {
					// New word added - highlight in green
					return (
						<span key={i} className="bg-green-900/50 text-green-300 px-0.5 rounded-sm mx-[-1px]">
							{part.value}
						</span>
					)
				}
				if (part.removed) {
					// This word was removed from original - skip it (doesn't exist in localized)
					return null
				}
				// Unchanged text
				return <span key={i}>{part.value}</span>
			})}
		</span>
	)
}

export default function DiffViewComponent({ document, onApprove, onReject, onBack }: DiffViewProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')

	const originalText = document.markdown || ''
	const localizedText = document.localizedText || ''

	const originalParagraphs = originalText.split(/\n\n+/).filter((p) => p.trim())
	const localizedParagraphs = localizedText.split(/\n\n+/).filter((p) => p.trim())

	// Calculate which paragraphs have changes
	const paragraphChanges = originalParagraphs.map((origPara, index) => {
		const locPara = localizedParagraphs[index] || ''
		const diff = diffWords(origPara, locPara)
		return {
			index,
			origPara,
			locPara,
			hasChanges: diff.some((p) => p.added || p.removed),
		}
	})

	const changedParagraphs = paragraphChanges.filter((p) => p.hasChanges)
	const changedCount = changedParagraphs.length

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-border">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</Button>
					<div>
						<h2 className="text-lg font-semibold">{document.name}</h2>
						<p className="text-sm text-muted-foreground">
							{changedCount} paragraph{changedCount !== 1 ? 's' : ''} with changes
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex bg-secondary rounded-lg p-1">
						<Button
							size="sm"
							variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
							onClick={() => setViewMode('side-by-side')}
						>
							Side by Side
						</Button>
						<Button
							size="sm"
							variant={viewMode === 'list' ? 'default' : 'ghost'}
							onClick={() => setViewMode('list')}
						>
							List
						</Button>
					</div>

					<Button variant="outline" onClick={onReject}>
						Reject
					</Button>
					<Button onClick={onApprove}>Approve All</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				{viewMode === 'side-by-side' ? (
					/* Side-by-side view with each paragraph as a row */
					<div className="flex flex-col h-full">
						{/* Column headers */}
						<div className="flex border-b border-border bg-[#0f0f12]">
							<div className="flex-1 px-4 py-2 bg-red-950/20 border-r border-border/50">
								<span className="text-sm font-medium text-red-400">Original</span>
							</div>
							<div className="flex-1 px-4 py-2 bg-green-950/20">
								<span className="text-sm font-medium text-green-400">Localized</span>
							</div>
						</div>
						{/* Paragraph rows - each row is a self-contained flex row with equal height sides */}
						<div className="flex-1 overflow-y-auto bg-[#0f0f12]">
							{paragraphChanges.map(({ index, origPara, locPara }) => (
								<div
									key={index}
									className="flex border-b border-border/30"
									style={{ alignItems: 'stretch' }}
								>
									{/* Left: Original paragraph */}
									<div className="flex-1 p-4 border-r border-border/30">
										<OriginalColumn origPara={origPara} locPara={locPara} />
									</div>
									{/* Right: Localized paragraph */}
									<div className="flex-1 p-4">
										<LocalizedColumn origPara={origPara} locPara={locPara} />
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					/* List view - only changed paragraphs */
					<div className="h-full overflow-y-auto p-6 bg-[#0f0f12]">
						<div className="max-w-4xl mx-auto space-y-6">
							{changedParagraphs.map(({ index, origPara, locPara }) => (
								<div key={index} className="border border-border rounded-lg bg-[#1a1a1f]">
									<div className="p-4 border-b border-border/50 flex items-center gap-3">
										<span className="px-2 py-0.5 text-xs font-mono bg-primary/20 text-primary rounded">#{index + 1}</span>
										<span className="text-sm text-muted-foreground">Changed paragraph</span>
									</div>
									<div className="grid grid-cols-2">
										<div className="p-4 border-r border-border/50">
											<p className="text-xs text-red-400 mb-2">Original</p>
											<div className="p-3 rounded bg-red-950/20 border border-red-900/30">
												<OriginalColumn origPara={origPara} locPara={locPara} />
											</div>
										</div>
										<div className="p-4">
											<p className="text-xs text-green-400 mb-2">Localized</p>
											<div className="p-3 rounded bg-green-950/20 border border-green-900/30">
												<LocalizedColumn origPara={origPara} locPara={locPara} />
											</div>
										</div>
									</div>
									<div className="p-4 border-t border-border/50 flex items-center gap-2 bg-[#1a1a1f]">
										<Button size="sm" variant="default">
											Approve
										</Button>
										<Button size="sm" variant="outline">
											Reject
										</Button>
									</div>
								</div>
							))}
							{changedParagraphs.length === 0 && (
								<div className="text-center py-12 text-muted-foreground">
									<p>No changes detected</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
