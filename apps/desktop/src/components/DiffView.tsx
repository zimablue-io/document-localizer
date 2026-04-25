import { Button } from '@doclocalizer/ui'
import { diffWords } from 'diff'
import { Check, LayoutList, X } from 'lucide-react'
import { useCallback, useState } from 'react'

interface DiffViewProps {
	document: {
		id: string
		name: string
		markdown?: string
		localizedText?: string
		status: string
	}
	onApprove: () => void
	onReject: () => void
	onBack: () => void
	onUpdateLocalizedText?: (paragraphIndex: number, newText: string) => void
	onShiftLocalizedParagraph?: (paragraphIndex: number, direction: 'up' | 'down') => void
	onInsertLocalizedParagraph?: (paragraphIndex: number, direction: 'above' | 'below') => void
	onDeleteLocalizedParagraph?: (paragraphIndex: number) => void
}

type ViewMode = 'side-by-side' | 'list'

interface EditState {
	paragraphIndex: number
	text: string
}

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

// RIGHT COLUMN: Shows ONLY localized text with optional edit capability
function LocalizedColumn({
	origPara,
	locPara,
	isEditing,
	editText,
	onTextChange,
}: {
	origPara: string
	locPara: string
	isEditing?: boolean
	editText?: string
	onTextChange?: (text: string) => void
}) {
	const diff = diffWords(origPara, locPara)

	if (isEditing) {
		return (
			<textarea
				className="w-full min-h-[80px] p-2 rounded bg-green-950/20 border border-green-900/30 font-mono text-sm resize-none"
				value={editText}
				onChange={(e) => onTextChange?.(e.target.value)}
			/>
		)
	}

	return (
		<span className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
			{diff.map((part, i) => {
				if (part.added) {
					return (
						<span key={i} className="bg-green-900/50 text-green-300 px-0.5 rounded-sm mx-[-1px]">
							{part.value}
						</span>
					)
				}
				if (part.removed) {
					return null
				}
				return <span key={i}>{part.value}</span>
			})}
		</span>
	)
}

export default function DiffViewComponent({
	document,
	onApprove,
	onReject,
	onBack,
	onUpdateLocalizedText,
	onShiftLocalizedParagraph,
	onInsertLocalizedParagraph,
	onDeleteLocalizedParagraph,
}: DiffViewProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')
	const [editingParagraph, setEditingParagraph] = useState<EditState | null>(null)

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

	const handleStartEdit = useCallback((paragraphIndex: number, text: string) => {
		setEditingParagraph({ paragraphIndex, text })
	}, [])

	const handleTextChange = useCallback((text: string) => {
		setEditingParagraph((prev) => (prev ? { ...prev, text } : null))
	}, [])

	const handleSaveEdit = useCallback(() => {
		if (editingParagraph && onUpdateLocalizedText) {
			onUpdateLocalizedText(editingParagraph.paragraphIndex, editingParagraph.text)
			setEditingParagraph(null)
		}
	}, [editingParagraph, onUpdateLocalizedText])

	const handleCancelEdit = useCallback(() => {
		setEditingParagraph(null)
	}, [])

	const handleDeleteParagraph = useCallback(
		(paragraphIndex: number) => {
			if (onDeleteLocalizedParagraph) {
				onDeleteLocalizedParagraph(paragraphIndex)
			}
		},
		[onDeleteLocalizedParagraph]
	)

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
							<LayoutList className="w-4 h-4 mr-1" />
							List
						</Button>
					</div>

					<Button variant="outline" onClick={onReject}>
						<X className="w-4 h-4 mr-1" />
						Reject
					</Button>
					<Button onClick={onApprove}>
						<Check className="w-4 h-4 mr-1" />
						Approve All
					</Button>
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
									{/* Left: Original paragraph with index */}
									<div className="flex-1 p-4 border-r border-border/30">
										<div className="flex items-center gap-2 mb-2">
											<span className="px-2 py-0.5 text-xs font-mono bg-red-900/30 text-red-300 rounded">
												#{index + 1}
											</span>
										</div>
										<OriginalColumn origPara={origPara} locPara={locPara} />
									</div>
									{/* Right: Localized paragraph - editable with all controls */}
									<div className="flex-1 p-4 flex flex-col gap-2">
										<div className="flex items-center justify-between">
											<span className="px-2 py-0.5 text-xs font-mono bg-green-900/30 text-green-300 rounded">
												#{index + 1}
											</span>
											<div className="flex items-center gap-1">
												{editingParagraph?.paragraphIndex === index ? (
													<>
														<Button size="sm" variant="default" onClick={handleSaveEdit}>
															Save
														</Button>
														<Button size="sm" variant="outline" onClick={handleCancelEdit}>
															Cancel
														</Button>
													</>
												) : (
													<>
														<button
															onClick={() => onShiftLocalizedParagraph?.(index, 'up')}
															disabled={index === 0}
															className="p-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed"
															title="Shift up"
														>
															<svg
																className="w-3 h-3"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M5 15l7-7 7 7"
																/>
															</svg>
														</button>
														<button
															onClick={() => onShiftLocalizedParagraph?.(index, 'down')}
															disabled={index === paragraphChanges.length - 1}
															className="p-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed"
															title="Shift down"
														>
															<svg
																className="w-3 h-3"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M19 9l-7 7-7-7"
																/>
															</svg>
														</button>
														<button
															onClick={() => onInsertLocalizedParagraph?.(index, 'above')}
															className="px-2 py-1 rounded bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 text-xs"
															title="Insert above"
														>
															+ Above
														</button>
														<button
															onClick={() => onInsertLocalizedParagraph?.(index, 'below')}
															className="px-2 py-1 rounded bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 text-xs"
															title="Insert below"
														>
															+ Below
														</button>
														<button
															onClick={() => handleStartEdit(index, locPara)}
															className="p-1 rounded bg-green-900/30 hover:bg-green-800/50 text-green-300"
															title="Edit this paragraph"
														>
															<svg
																className="w-3 h-3"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
																/>
															</svg>
														</button>
														<button
															onClick={() => handleDeleteParagraph(index)}
															className="p-1 rounded bg-red-900/30 hover:bg-red-800/50 text-red-300"
															title="Delete paragraph"
														>
															<svg
																className="w-3 h-3"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																/>
															</svg>
														</button>
													</>
												)}
											</div>
										</div>
										<LocalizedColumn
											origPara={origPara}
											locPara={locPara}
											isEditing={editingParagraph?.paragraphIndex === index}
											editText={
												editingParagraph?.paragraphIndex === index
													? editingParagraph.text
													: undefined
											}
											onTextChange={handleTextChange}
										/>
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
										<span className="px-2 py-0.5 text-xs font-mono bg-primary/20 text-primary rounded">
											#{index + 1}
										</span>
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
												<LocalizedColumn
													origPara={origPara}
													locPara={locPara}
													isEditing={editingParagraph?.paragraphIndex === index}
													editText={
														editingParagraph?.paragraphIndex === index
															? editingParagraph.text
															: undefined
													}
													onTextChange={handleTextChange}
												/>
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
