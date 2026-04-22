import type { DocumentState } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import { DiffModeEnum, DiffView as DiffViewPrimitive } from '@git-diff-view/react'
import { useMemo, useState } from 'react'

interface DiffViewProps {
	document: DocumentState
	onApprove: () => void
	onReject: () => void
	onBack: () => void
}

export default function DiffViewComponent({ document, onApprove, onReject, onBack }: DiffViewProps) {
	const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')

	const addedCount = document.localizedText
		? document.localizedText.split('\n').filter((l) => l.trim().startsWith('+')).length
		: 0

	const diffMode = viewMode === 'split' ? DiffModeEnum.SplitGitHub : DiffModeEnum.Unified

	const diffData = useMemo(() => {
		const oldText = document.markdown || ''
		const newText = document.localizedText || ''
		return {
			oldContent: oldText,
			newContent: newText,
			oldLanguage: 'markdown',
			newLanguage: 'markdown',
		}
	}, [document.markdown, document.localizedText])

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
						<svg
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</Button>
					<div>
						<h2 className="text-lg font-semibold">{document.name}</h2>
						<p className="text-sm text-muted-foreground">{addedCount} additions detected</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex bg-secondary rounded-lg p-1">
						<Button
							size="sm"
							variant={viewMode === 'split' ? 'default' : 'ghost'}
							onClick={() => setViewMode('split')}
						>
							Split
						</Button>
						<Button
							size="sm"
							variant={viewMode === 'unified' ? 'default' : 'ghost'}
							onClick={() => setViewMode('unified')}
						>
							Unified
						</Button>
					</div>
					<Button variant="outline" onClick={onReject}>
						Reject
					</Button>
					<Button onClick={onApprove}>Approve</Button>
				</div>
			</div>

			<div className="flex-1 overflow-hidden bg-card rounded-lg border border-border">
				<DiffViewPrimitive
					data={diffData}
					diffViewMode={diffMode}
					language="markdown"
					oldLanguage="markdown"
					newLanguage="markdown"
				/>
			</div>
		</div>
	)
}
