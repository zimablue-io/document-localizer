import type { DocumentState } from '@doclocalizer/core'
import { useState, useCallback } from 'react'
import { Button } from '@doclocalizer/ui'
import { ChevronDown, FileText, FileType, Clock, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface DocumentListProps {
	documents: DocumentState[]
	onProcess: (id: string) => void
	onReview: (id: string) => void
	onRemove: (id: string) => void
	onStop?: (id: string) => void
	onPause?: (id: string) => void
	onResume?: (id: string) => void
	onFilesAdded?: (paths: string[]) => void
	onExport?: (id: string, format: 'md' | 'pdf') => void
}

function getStatusIcon(status: DocumentState['status']) {
	switch (status) {
		case 'idle':
			return <Clock className="w-5 h-5 text-muted-foreground" />
		case 'parsing':
		case 'localizing':
			return <Loader2 className="w-5 h-5 text-primary animate-spin" />
		case 'paused':
			return <PauseIcon className="w-5 h-5 text-orange-500" />
		case 'review':
			return <AlertCircle className="w-5 h-5 text-yellow-500" />
		case 'approved':
			return <CheckCircle2 className="w-5 h-5 text-green-500" />
		case 'error':
			return <XCircle className="w-5 h-5 text-red-500" />
		default:
			return <Clock className="w-5 h-5 text-muted-foreground" />
	}
}

function PauseIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<rect x="6" y="4" width="4" height="16" rx="1" />
			<rect x="14" y="4" width="4" height="16" rx="1" />
		</svg>
	)
}

const statusLabels: Record<DocumentState['status'], string> = {
	idle: 'Ready to process',
	parsing: 'Extracting text...',
	localizing: 'Localizing...',
	paused: 'Paused',
	review: 'Needs review',
	approved: 'Ready to export',
	error: 'Error',
}

function ProgressBar({ current, total }: { current: number; total: number }) {
	const percent = total > 0 ? Math.round((current / total) * 100) : 0
	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[200px]">
				<div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
			</div>
			<span className="text-sm text-primary font-medium tabular-nums">{current}/{total}</span>
		</div>
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
	onExport,
}: DocumentListProps) {
	const [isDragging, setIsDragging] = useState(false)
	const [showExportMenu, setShowExportMenu] = useState<string | null>(null)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		const x = e.clientX
		const y = e.clientY
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			setIsDragging(false)
		}
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			const files = Array.from(e.dataTransfer.files)
			if (files.length === 0) return

			const filePaths = window.electron.getDroppedFilePaths(files)
			const validFiles = filePaths.filter((p) => /\.(pdf|md|markdown)$/i.test(p))

			if (validFiles.length > 0 && onFilesAdded) {
				onFilesAdded(validFiles)
			}
		},
		[onFilesAdded]
	)

	return (
		<div
			className={`h-full flex flex-col ${isDragging ? 'ring-2 ring-primary ring-inset rounded-xl' : ''}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{isDragging && (
				<div className="flex-shrink-0 border-2 border-dashed border-primary bg-primary/5 rounded-xl p-8 text-center mb-4">
					<p className="text-lg font-medium text-primary">Drop files to add documents</p>
				</div>
			)}

			<div className="flex-1 overflow-auto">
				<table className="w-full">
					<thead className="sticky top-0 bg-background z-10">
						<tr className="border-b border-border text-left">
							<th className="pb-3 pl-4 text-sm font-semibold text-muted-foreground">Document</th>
							<th className="pb-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
							<th className="pb-3 px-4 text-sm font-semibold text-muted-foreground w-64">Progress</th>
							<th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{documents.map((doc) => (
							<tr key={doc.id} className="hover:bg-muted/50 transition-colors">
								<td className="py-4 pl-4">
									<div className="flex items-center gap-3">
										{getStatusIcon(doc.status)}
										<div>
											<p className="font-medium text-base">{doc.name}</p>
											{doc.error && doc.status === 'error' && (
												<p className="text-sm text-red-500 mt-0.5">{doc.error}</p>
											)}
										</div>
									</div>
								</td>
								<td className="py-4 px-4">
									<span
										className={`text-sm font-medium ${
											doc.status === 'error'
												? 'text-red-500'
												: doc.status === 'approved'
													? 'text-green-500'
													: doc.status === 'review'
														? 'text-yellow-500'
														: 'text-muted-foreground'
										}`}
									>
										{statusLabels[doc.status]}
									</span>
								</td>
								<td className="py-4 px-4">
									{(doc.status === 'parsing' || doc.status === 'localizing') && doc.progress ? (
										<ProgressBar current={doc.progress.current} total={doc.progress.total} />
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>
								<td className="py-4 pr-4">
									<div className="flex items-center justify-end gap-2">
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
											<Button variant="outline" size="sm" onClick={() => onPause(doc.id)}>
												Pause
											</Button>
										)}
										{doc.status === 'paused' && onResume && (
											<Button variant="outline" size="sm" onClick={() => onResume(doc.id)}>
												Resume
											</Button>
										)}
										{doc.status === 'review' && (
											<Button onClick={() => onReview(doc.id)}>Review</Button>
										)}
										{doc.status === 'approved' && (
											<div className="relative">
												<Button
													variant="default"
													onClick={() => onExport?.(doc.id, 'md')}
													onMouseEnter={() => setShowExportMenu(doc.id)}
												>
													Export
													<ChevronDown className="ml-1 w-4 h-4" />
												</Button>
												{showExportMenu === doc.id && (
													<div
														className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[220px]"
														onMouseLeave={() => setShowExportMenu(null)}
													>
														<button
															className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-3"
															onClick={() => {
																onExport?.(doc.id, 'md')
																setShowExportMenu(null)
															}}
														>
															<FileText className="w-5 h-5 text-primary shrink-0" />
															<span className="whitespace-nowrap">Markdown (.md)</span>
														</button>
														<button
															className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-3"
															onClick={() => {
																onExport?.(doc.id, 'pdf')
																setShowExportMenu(null)
															}}
														>
															<FileType className="w-5 h-5 text-primary shrink-0" />
															<span className="whitespace-nowrap">PDF (.pdf)</span>
														</button>
													</div>
												)}
											</div>
										)}
										{doc.status === 'error' && (
											<Button variant="destructive" onClick={() => onProcess(doc.id)}>
												Retry
											</Button>
										)}
										{(doc.status === 'idle' ||
											doc.status === 'review' ||
											doc.status === 'error' ||
											doc.status === 'approved') && (
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
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{documents.length === 0 && (
					<div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
						<svg
							className="w-16 h-16 mb-4 opacity-50"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p className="text-lg">No documents loaded</p>
						<p className="text-sm mt-1">Drop files here or use the "Select Files" button</p>
					</div>
				)}
			</div>
		</div>
	)
}
