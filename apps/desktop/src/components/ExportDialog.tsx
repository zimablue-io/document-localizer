import { Button } from '@doclocalizer/ui'
import { FileText, FileType } from 'lucide-react'
import { ExportFormat } from '../lib/export'

interface ExportDialogProps {
	docName: string
	isOpen: boolean
	onClose: () => void
	onExport: (format: ExportFormat) => void
}

export function ExportDialog({ docName, isOpen, onClose, onExport }: ExportDialogProps) {
	if (!isOpen) return null

	const handleExport = (format: ExportFormat) => {
		onExport(format)
		onClose()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="export-dialog-title"
		>
			<div
				className="absolute inset-0 bg-black/50 cursor-pointer"
				onClick={onClose}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
				role="button"
				tabIndex={-1}
				aria-label="Close dialog"
			/>
			<div className="relative bg-card rounded-lg border border-border p-6 w-full max-w-sm shadow-xl">
				<h2 id="export-dialog-title" className="text-lg font-semibold mb-1">
					Export Document
				</h2>
				<p className="text-sm text-muted-foreground mb-6">{docName}</p>

				<div className="space-y-3">
					<Button
						variant="outline"
						className="w-full justify-start h-auto py-4"
						onClick={() => handleExport('md')}
					>
						<FileText className="w-5 h-5 mr-3 text-primary" />
						<div className="text-left">
							<div className="font-medium">Markdown (.md)</div>
							<div className="text-xs text-muted-foreground">Plain text with formatting</div>
						</div>
					</Button>

					<Button
						variant="outline"
						className="w-full justify-start h-auto py-4"
						onClick={() => handleExport('pdf')}
					>
						<FileType className="w-5 h-5 mr-3 text-primary" />
						<div className="text-left">
							<div className="font-medium">PDF (.pdf)</div>
							<div className="text-xs text-muted-foreground">Formatted document</div>
						</div>
					</Button>
				</div>

				<div className="mt-6 flex justify-end">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	)
}
