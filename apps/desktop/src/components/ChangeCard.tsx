import type { TextChange } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import { useState } from 'react'

interface ChangeCardProps {
	change: TextChange
	index: number
	total: number
	onApprove: (id: string) => void
	onReject: (id: string, comment?: string) => void
	onIgnore: (id: string) => void
}

const statusColors = {
	pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
	approved: 'bg-green-500/20 text-green-400 border-green-500/30',
	rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
	ignored: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const statusLabels = {
	pending: 'Pending',
	approved: 'Approved',
	rejected: 'Rejected',
	ignored: 'Ignored',
}

export default function ChangeCard({ change, index, total, onApprove, onReject, onIgnore }: ChangeCardProps) {
	const [showComment, setShowComment] = useState(false)
	const [comment, setComment] = useState('')

	const handleReject = () => {
		if (comment.trim()) {
			onReject(change.id, comment)
		} else {
			setShowComment(true)
		}
	}

	const submitReject = () => {
		onReject(change.id, comment)
		setShowComment(false)
		setComment('')
	}

	return (
		<div className={`border rounded-lg overflow-hidden ${statusColors[change.status]}`}>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-current/10">
				<span className="text-sm font-medium">
					Change #{index + 1} of {total}
				</span>
				<span className={`text-xs px-2 py-0.5 rounded border ${statusColors[change.status]}`}>
					{statusLabels[change.status]}
				</span>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3">
				{/* Original text (if any) */}
				{change.originalText && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Original:</p>
						<p className="font-mono text-sm bg-red-900/20 p-2 rounded text-red-300">
							{change.originalText}
						</p>
					</div>
				)}

				{/* Arrow */}
				<div className="flex justify-center">
					<svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
					</svg>
				</div>

				{/* Localized text (if any) */}
				{change.localizedText && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Localized:</p>
						<p className="font-mono text-sm bg-green-900/20 p-2 rounded text-green-300">
							{change.localizedText}
						</p>
					</div>
				)}

				{/* Context */}
				{change.context && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Context:</p>
						<p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2">
							{change.context.length > 200 ? change.context.slice(0, 200) + '...' : change.context}
						</p>
					</div>
				)}

				{/* Comment (if any) */}
				{change.comment && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Comment:</p>
						<p className="text-sm bg-muted p-2 rounded">{change.comment}</p>
					</div>
				)}

				{/* Comment input */}
				{showComment && (
					<div className="space-y-2">
						<textarea
							className="w-full p-2 text-sm bg-background border border-border rounded resize-none"
							placeholder="Add a comment explaining why you're rejecting this change..."
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={2}
						/>
						<div className="flex gap-2">
							<Button size="sm" onClick={submitReject}>
								Submit Rejection
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>
								Cancel
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			{change.status === 'pending' && (
				<div className="flex items-center gap-2 px-4 py-3 border-t border-current/10 bg-muted/30">
					<Button size="sm" onClick={() => onApprove(change.id)}>
						<svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						Approve
					</Button>
					<Button size="sm" variant="destructive" onClick={handleReject}>
						<svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
						Reject
					</Button>
					<Button size="sm" variant="secondary" onClick={() => onIgnore(change.id)}>
						<svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
							/>
						</svg>
						Ignore
					</Button>
				</div>
			)}
		</div>
	)
}
