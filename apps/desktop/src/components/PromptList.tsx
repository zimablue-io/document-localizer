import type { Settings } from '../lib/types'

interface PromptListProps {
	promptList: string[]
	settings: Settings
	onSelectPrompt: (filename: string) => void
}

export function PromptList({ promptList, settings, onSelectPrompt }: PromptListProps) {
	return (
		<div className="space-y-2">
			{promptList.map((filename) => (
				<div
					key={filename}
					className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
						filename === settings.activePromptId
							? 'bg-primary/10 border-primary'
							: 'bg-secondary border-transparent hover:border-border'
					}`}
					onClick={() => onSelectPrompt(filename)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							onSelectPrompt(filename)
						}
					}}
					role="button"
					tabIndex={0}
				>
					<span className="truncate">{filename}</span>
					{filename === settings.activePromptId && (
						<span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-2">Selected</span>
					)}
				</div>
			))}
		</div>
	)
}
