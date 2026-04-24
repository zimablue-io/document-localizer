import { Button } from '@doclocalizer/ui'
import { formatDistanceToNow } from 'date-fns'
import { Clock, FileText, Trash2 } from 'lucide-react'
import { ScrollArea } from '@doclocalizer/ui'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@doclocalizer/ui'

interface HistoryEntry {
	id: string
	fileName: string
	filePath: string
	sourceLocale: string
	targetLocale: string
	processedAt: string
	status: 'processed' | 'approved' | 'rejected' | 'error'
	errorMessage?: string
	chunksProcessed?: number
}

interface HistoryPanelProps {
	history: HistoryEntry[]
	isOpen: boolean
	onClose: () => void
	onClear: () => void
}

function getStatusColor(status: HistoryEntry['status']): string {
	switch (status) {
		case 'approved':
			return 'text-green-500'
		case 'rejected':
			return 'text-orange-500'
		case 'error':
			return 'text-red-500'
		case 'processed':
		default:
			return 'text-blue-500'
	}
}

function getStatusLabel(status: HistoryEntry['status']): string {
	switch (status) {
		case 'approved':
			return 'Approved'
		case 'rejected':
			return 'Rejected'
		case 'error':
			return 'Failed'
		case 'processed':
		default:
			return 'Processed'
	}
}

export default function HistoryPanel({ history, isOpen, onClose, onClear }: HistoryPanelProps) {
	const handleClear = () => {
		if (confirm('Clear all history? This cannot be undone.')) {
			onClear()
		}
	}

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent position="right" className="w-full sm:max-w-md">
				<SheetHeader>
					<div className="flex items-center justify-between">
						<SheetTitle>Activity History</SheetTitle>
						{history.length > 0 && (
							<Button variant="ghost" size="sm" onClick={handleClear}>
								<Trash2 className="w-4 h-4 mr-1" />
								Clear
							</Button>
						)}
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 mt-4 -mx-4 px-4">
					{history.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<Clock className="w-12 h-12 mb-4 opacity-50" />
							<p>No activity yet</p>
							<p className="text-sm mt-1">Processed documents will appear here</p>
						</div>
					) : (
						<div className="flex flex-col gap-3 pb-4">
							{history.map((entry) => (
								<div
									key={entry.id}
									className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2 min-w-0">
											<FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
											<span className="font-medium truncate" title={entry.fileName}>
												{entry.fileName}
											</span>
										</div>
										<span
											className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(
												entry.status
											)} bg-current/10`}
										>
											{getStatusLabel(entry.status)}
										</span>
									</div>

									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Clock className="w-3 h-3" />
										<span>{formatDistanceToNow(new Date(entry.processedAt), { addSuffix: true })}</span>
									</div>

									{entry.errorMessage && (
										<p className="text-xs text-red-500 mt-1 truncate" title={entry.errorMessage}>
											{entry.errorMessage}
										</p>
									)}

									{entry.chunksProcessed && (
										<p className="text-xs text-muted-foreground">
											{entry.chunksProcessed} chunks processed
										</p>
									)}

									<div className="text-xs text-muted-foreground">
										{entry.sourceLocale && entry.targetLocale ? (
											<span>
												{entry.sourceLocale} → {entry.targetLocale}
											</span>
										) : (
											<span className="italic">No locale info</span>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	)
}
