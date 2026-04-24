import type { DocumentState } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import { History } from 'lucide-react'

interface HeaderProps {
	documents: DocumentState[]
	isConfigured: boolean
	onSelectFiles: () => void
	onProcessAll: () => void
	onOpenSettings: () => void
	onOpenHistory: () => void
}

export default function Header({ documents, isConfigured, onSelectFiles, onProcessAll, onOpenSettings, onOpenHistory }: HeaderProps) {
	const idleCount = documents.filter((d) => d.status === 'idle').length

	return (
		<header className="border-b border-border px-6 py-4 flex items-center justify-between">
			<h1 className="text-xl font-semibold">Document Localizer</h1>
			<div className="flex gap-2">
				{!isConfigured && (
					<Button variant="destructive" onClick={onOpenSettings}>
						Configure Model First
					</Button>
				)}
				{isConfigured && (
					<>
						<Button variant="secondary" onClick={onSelectFiles}>
							Select Files
						</Button>
						<Button onClick={onProcessAll} disabled={idleCount === 0}>
							Process All ({idleCount})
						</Button>
					</>
				)}
				<Button variant="ghost" size="icon" onClick={onOpenHistory} aria-label="History">
					<History className="w-5 h-5" />
				</Button>
				<Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</Button>
			</div>
		</header>
	)
}
