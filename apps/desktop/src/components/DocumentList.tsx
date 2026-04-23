import type { DocumentState } from '@doclocalizer/core'
import { useState, useCallback } from 'react'
import { Button } from '@doclocalizer/ui'

interface DocumentListProps {
	documents: DocumentState[]
	onProcess: (id: string) => void
	onReview: (id: string) => void
	onRemove: (id: string) => void
	onStop?: (id: string) => void
	onPause?: (id: string) => void
	onResume?: (id: string) => void
	onFilesAdded?: (paths: string[]) => void
}

const ALLOWED_EXTENSIONS = ['.pdf', '.md', '.markdown']

function getFileExtension(filePath: string): string {
	const parts = filePath.split('.')
	return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function isValidFile(filePath: string): boolean {
	const ext = getFileExtension(filePath)
	return ALLOWED_EXTENSIONS.some((e) => e === `.${ext}`)
}

const statusLabels: Record<DocumentState['status'], string> = {
	idle: 'Ready to process',
	parsing: 'Extracting text...',
	localizing: 'Localizing...',
	paused: 'Paused',
	review: 'Review required',
	approved: 'Approved',
	exported: 'Exported',
	error: 'Error',
}

function ProgressBar({ current, total }: { current: number; total: number }) {
	const percent = total > 0 ? Math.round((current / total) * 100) : 0
	return (
		<span className="inline-flex items-center gap-2">
			<span className="text-xs text-primary font-medium">
				{current}/{total}
			</span>
			<div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden inline-block align-middle">
				<div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
			</div>
		</span>
	)
}

export default function DocumentList({
	documents,
	onProcess,
	onReview,
	onRemove,
	onStop,
	onPause,
	onResume,
	onFilesAdded,
}: DocumentListProps) {
	const [isDragging, setIsDragging] = useState(false)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			const files = Array.from(e.dataTransfer.files)
			if (files.length === 0) return

			// Use Electron's webUtils to get file paths from dropped files
			const filePaths = window.electron.getDroppedFilePaths(files)
			const validFiles = filePaths.filter(isValidFile)

			if (validFiles.length > 0 && onFilesAdded) {
				onFilesAdded(validFiles)
			}
		},
		[onFilesAdded]
	)

	return (
		<div
			className={`space-y-3 transition-colors ${isDragging ? 'bg-primary/5 rounded-lg p-2' : ''}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{isDragging && (
				<div className="border-2 border-dashed border-primary rounded-lg p-4 text-center text-primary">
					Drop files to add more documents
				</div>
			)}
			{documents.map((doc) => (
				<div
					key={doc.id}
					className="bg-card rounded-lg border border-border p-4 flex items-center justify-between"
				>
					<div className="flex items-center gap-4 min-w-0 flex-1">
						<svg
							className="w-10 h-10 text-muted-foreground shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<div className="min-w-0 flex-1">
							<p className="font-medium truncate">{doc.name}</p>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								{doc.status === 'error' ? (
									<span className="text-destructive">Error: {doc.error}</span>
								) : (
									<>
										<span>{statusLabels[doc.status]}</span>
										{(doc.status === 'parsing' || doc.status === 'localizing') && doc.progress && (
											<ProgressBar current={doc.progress.current} total={doc.progress.total} />
										)}
									</>
								)}
							</div>
						</div>
					</div>
					<div className="flex gap-2 shrink-0 ml-4">
						{doc.status === 'idle' && (
							<Button variant="secondary" onClick={() => onProcess(doc.id)}>
								Process
							</Button>
						)}
						{(doc.status === 'parsing' || doc.status === 'localizing') && onStop && (
							<Button variant="destructive" size="sm" onClick={() => onStop(doc.id)}>
								Stop
							</Button>
						)}
						{doc.status === 'localizing' && onPause && (
							<Button variant="secondary" size="sm" onClick={() => onPause(doc.id)}>
								Pause
							</Button>
						)}
						{doc.status === 'paused' && onResume && (
							<Button variant="secondary" size="sm" onClick={() => onResume(doc.id)}>
								Resume
							</Button>
						)}
						{doc.status === 'review' && <Button onClick={() => onReview(doc.id)}>Review</Button>}
						{doc.status === 'approved' && <Button variant="secondary">Export</Button>}
						{doc.status === 'error' && (
							<Button variant="destructive" onClick={() => onProcess(doc.id)}>
								Retry
							</Button>
						)}
						{(doc.status === 'idle' || doc.status === 'review' || doc.status === 'error') && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemove(doc.id)}
								aria-label="Remove document"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</Button>
						)}
					</div>
				</div>
			))}
		</div>
	)
}
