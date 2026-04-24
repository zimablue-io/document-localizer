import type { DocumentState } from '@doclocalizer/core'
import { Button } from '@doclocalizer/ui'
import { ChevronDown, History } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ModelConfig {
	id: string
	name: string
}

interface HeaderProps {
	documents: DocumentState[]
	models?: ModelConfig[]
	activeModelId?: string
	apiUrl?: string
	isConfigured: boolean
	onSelectFiles: () => void
	onProcessAll: () => void
	onOpenSettings: () => void
	onOpenHistory: () => void
	onModelChange?: (modelId: string) => void
}

export default function Header({ documents, models, activeModelId, apiUrl, isConfigured, onSelectFiles, onProcessAll, onOpenSettings, onOpenHistory, onModelChange }: HeaderProps) {
	const idleCount = documents.filter((d) => d.status === 'idle').length
	const [showDropdown, setShowDropdown] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const activeModel = models?.find(m => m.id === activeModelId) || models?.[0]
	const shortModel = activeModel?.name?.split(':')[0] + ':' + activeModel?.name?.split(':')[1] || ''

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<header className="border-b border-border px-6 py-4 flex items-center justify-between">
			<div className="flex items-center gap-4">
				<h1 className="text-xl font-semibold">Document Localizer</h1>
				{activeModel && (
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setShowDropdown(!showDropdown)}
							className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors"
							title={`Model: ${activeModel.name}\nAPI: ${apiUrl}\nClick to change`}
						>
							<span>{shortModel || activeModel.name}</span>
							<ChevronDown className="w-3 h-3" />
						</button>
						{showDropdown && models && models.length > 0 && (
							<div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px]">
								<div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
									Select Model
								</div>
								{models.map((model) => (
									<button
										key={model.id}
										className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between ${
											model.id === activeModelId ? 'bg-primary/10 text-primary' : ''
										}`}
										onClick={() => {
											onModelChange?.(model.id)
											setShowDropdown(false)
										}}
									>
										<span className="truncate">{model.name}</span>
										{model.id === activeModelId && (
											<svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										)}
									</button>
								))}
								<div className="border-t border-border pt-1 mt-1">
									<button
										className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-muted-foreground"
										onClick={() => {
											setShowDropdown(false)
											onOpenSettings()
										}}
									>
										Manage Models...
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
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
