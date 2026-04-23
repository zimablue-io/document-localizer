import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface EmptyStateProps {
	onFilesAdded: (paths: string[]) => void
}

const ALLOWED_EXTENSIONS = ['pdf', 'md', 'markdown']

function getFileExtension(filePath: string): string {
	const parts = filePath.split('.')
	return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function isValidFile(filePath: string): boolean {
	const ext = getFileExtension(filePath)
	return ALLOWED_EXTENSIONS.includes(ext)
}

export default function EmptyState({ onFilesAdded }: EmptyStateProps) {
	const [isDragging, setIsDragging] = useState(false)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		// Only hide if leaving the container entirely
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

			// Use Electron's webUtils to get file paths from dropped files
			const filePaths = window.electron.getDroppedFilePaths(files)

			// Validate files
			const validFiles = filePaths.filter(isValidFile)
			const invalidFiles = filePaths.filter((p) => !isValidFile(p))

			if (invalidFiles.length > 0) {
				const names = invalidFiles
					.map((p) => p.split('/').pop() || p)
					.join(', ')
				toast.error(`Invalid files skipped: ${names}`)
			}

			if (validFiles.length > 0) {
				onFilesAdded(validFiles)
			}
		},
		[onFilesAdded]
	)

	return (
		<div
			className="flex flex-col items-center justify-center h-full"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<div
				className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-colors ${
					isDragging
						? 'border-primary bg-primary/10'
						: 'border-muted-foreground/30 bg-transparent'
				}`}
				style={{ minWidth: '400px', minHeight: '300px' }}
			>
				<svg
					className={`w-20 h-20 mb-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				<p className={`text-xl mb-2 ${isDragging ? 'text-primary' : ''}`}>
					{isDragging ? 'Drop files here' : 'No documents loaded'}
				</p>
				<p className="text-sm text-muted-foreground">
					Drag and drop PDF or MD files here, or use the "Select Files" button
				</p>
				<p className="text-xs text-muted-foreground mt-2">
					Accepted formats: .pdf, .md, .markdown
				</p>
			</div>
		</div>
	)
}
