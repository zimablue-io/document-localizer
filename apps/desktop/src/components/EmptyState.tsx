import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface EmptyStateProps {
	onFilesAdded: (paths: string[]) => void
	onSelectFiles?: () => void
}

const ALLOWED_EXTENSIONS = ['pdf', 'md', 'markdown'] as const

function getFileExtension(filePath: string): string {
	const parts = filePath.split('.')
	return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function isValidFile(filePath: string): boolean {
	const ext = getFileExtension(filePath)
	return ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
}

export default function EmptyState({ onFilesAdded, onSelectFiles }: EmptyStateProps) {
	const [isDragging, setIsDragging] = useState(false)

	const handleClick = useCallback(() => {
		onSelectFiles?.()
	}, [onSelectFiles])

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
				const names = invalidFiles.map((p) => p.split('/').pop() || p).join(', ')
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
				className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-colors cursor-pointer ${
					isDragging
						? 'border-primary bg-primary/10'
						: 'border-muted-foreground/30 bg-transparent hover:border-primary/50 hover:bg-primary/5'
				}`}
				style={{ minWidth: '400px', minHeight: '300px' }}
				onClick={handleClick}
			>
				<Upload className={`w-20 h-20 mb-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
				<p className={`text-xl mb-2 ${isDragging ? 'text-primary' : ''}`}>
					{isDragging ? 'Drop files here' : 'No documents loaded'}
				</p>
				<p className="text-sm text-muted-foreground">Click to browse or drag and drop PDF/MD files</p>
				<p className="text-xs text-muted-foreground mt-2">Accepted formats: .pdf, .md, .markdown</p>
			</div>
		</div>
	)
}
