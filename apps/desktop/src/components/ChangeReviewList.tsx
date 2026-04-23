import type { TextChange } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import ChangeCard from './ChangeCard'

interface ChangeReviewListProps {
	changes: TextChange[]
	onApprove: (id: string) => void
	onReject: (id: string, comment?: string) => void
	onIgnore: (id: string) => void
	onBulkApprove?: () => void
	onBulkReject?: () => void
}

type FilterMode = 'all' | 'pending' | 'approved' | 'rejected' | 'ignored'

export default function ChangeReviewList({
	changes,
	onApprove,
	onReject,
	onIgnore,
	onBulkApprove,
	onBulkReject,
}: ChangeReviewListProps) {
	const [filter, setFilter] = React.useState<FilterMode>('all')

	const filteredChanges = changes.filter((c) => {
		if (filter === 'all') return true
		return c.status === filter
	})

	const stats = {
		total: changes.length,
		pending: changes.filter((c) => c.status === 'pending').length,
		approved: changes.filter((c) => c.status === 'approved').length,
		rejected: changes.filter((c) => c.status === 'rejected').length,
		ignored: changes.filter((c) => c.status === 'ignored').length,
	}

	const pendingChanges = changes.filter((c) => c.status === 'pending')

	return (
		<div className="flex flex-col h-full">
			{/* Header with stats and filters */}
			<div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg border border-border">
				<div>
					<h3 className="font-semibold">Review Changes</h3>
					<p className="text-sm text-muted-foreground">
						{stats.pending} pending of {stats.total} total changes
					</p>
				</div>

				{pendingChanges.length > 0 && (
					<div className="flex gap-2">
						{onBulkApprove && (
							<Button size="sm" variant="secondary" onClick={onBulkApprove}>
								Approve All Pending ({pendingChanges.length})
							</Button>
						)}
						{onBulkReject && (
							<Button size="sm" variant="destructive" onClick={onBulkReject}>
								Reject All Pending
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Filter tabs */}
			<div className="flex gap-2 mb-4 overflow-x-auto">
				<FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
					All ({stats.total})
				</FilterButton>
				<FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
					Pending ({stats.pending})
				</FilterButton>
				<FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')}>
					Approved ({stats.approved})
				</FilterButton>
				<FilterButton active={filter === 'rejected'} onClick={() => setFilter('rejected')}>
					Rejected ({stats.rejected})
				</FilterButton>
				<FilterButton active={filter === 'ignored'} onClick={() => setFilter('ignored')}>
					Ignored ({stats.ignored})
				</FilterButton>
			</div>

			{/* Change list */}
			<div className="flex-1 overflow-y-auto space-y-4 pr-2">
				{filteredChanges.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<svg
							className="w-12 h-12 mx-auto mb-4 opacity-50"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p>No changes in this category</p>
					</div>
				) : (
					filteredChanges.map((change, index) => (
						<ChangeCard
							key={change.id}
							change={change}
							index={changes.indexOf(change)}
							total={changes.length}
							onApprove={onApprove}
							onReject={onReject}
							onIgnore={onIgnore}
						/>
					))
				)}
			</div>
		</div>
	)
}

function FilterButton({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
				active
					? 'bg-primary text-primary-foreground'
					: 'bg-muted hover:bg-muted/80 text-muted-foreground'
			}`}
			onClick={onClick}
		>
			{children}
		</button>
	)
}

// Need React for useState
import React from 'react'
