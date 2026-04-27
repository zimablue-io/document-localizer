import { Button, Input } from '@doclocalizer/ui'
import { Check, Edit2, FilePen, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Settings } from '../lib/types'

interface PromptEditorProps {
	settings: Settings
	promptContent: string
	isEditing: boolean
	onSetEditing: (editing: boolean) => void
	onContentChange: (content: string) => void
	onSave: () => void
	onDelete: () => void
	onRename: (newName: string) => void
	onReset: () => void
}

export function PromptEditor({
	settings,
	promptContent,
	isEditing,
	onSetEditing,
	onContentChange,
	onSave,
	onDelete,
	onRename,
	onReset,
}: PromptEditorProps) {
	const [isRenaming, setIsRenaming] = useState(false)
	const [renameValue, setRenameValue] = useState('')

	const handleRenameConfirm = () => {
		if (renameValue.trim() && renameValue.endsWith('.md')) {
			onRename(renameValue.trim())
		}
		setIsRenaming(false)
		setRenameValue('')
	}

	const handleRenameCancel = () => {
		setIsRenaming(false)
		setRenameValue('')
	}

	return (
		<div className="border-t border-border pt-4 space-y-2">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					{isRenaming ? (
						<>
							<Input
								value={renameValue.replace(/\.md$/i, '')}
								onChange={(e) => setRenameValue(`${e.target.value}.md`)}
								className="h-7 w-40"
								autoFocus
							/>
							<span className="text-muted-foreground">.md</span>
							<Button size="sm" onClick={handleRenameConfirm}>
								Save
							</Button>
							<Button variant="outline" size="sm" onClick={handleRenameCancel}>
								<X className="w-4 h-4" />
							</Button>
						</>
					) : (
						<>
							<span className="font-medium">{settings.activePromptId}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setRenameValue(settings.activePromptId || '')
									setIsRenaming(true)
								}}
								title="Rename file"
							>
								<Edit2 className="w-4 h-4" />
							</Button>
						</>
					)}
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button size="sm" onClick={onSave}>
								<Check className="w-4 h-4 mr-1" />
								Save
							</Button>
							<Button variant="outline" size="sm" onClick={() => onSetEditing(false)}>
								Cancel
							</Button>
							{settings.activePromptId === 'default.md' && (
								<Button variant="outline" size="sm" onClick={onReset}>
									<RotateCcw className="w-4 h-4 mr-1" />
									Reset
								</Button>
							)}
						</>
					) : (
						<Button size="sm" onClick={() => onSetEditing(true)}>
							<FilePen className="w-4 h-4 mr-1" />
							Edit
						</Button>
					)}
					<Button variant="ghost" size="sm" onClick={onDelete} title="Delete prompt">
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</div>
			<textarea
				value={promptContent}
				onChange={(e) => onContentChange(e.target.value)}
				readOnly={!isEditing}
				className={`min-h-[12rem] w-full rounded-lg border px-2.5 py-2 text-sm transition-colors outline-none resize-none font-mono ${
					isEditing
						? 'border-input bg-transparent focus-visible:border-ring'
						: 'border-transparent bg-muted/50 cursor-default'
				}`}
				placeholder="Enter your prompt..."
			/>
			<p className="text-xs text-muted-foreground">
				Template: <code className="bg-secondary px-1 rounded">{'{sourceLocale}'}</code>,{' '}
				<code className="bg-secondary px-1 rounded">{'{targetLocale}'}</code>,{' '}
				<code className="bg-secondary px-1 rounded">{'{text}'}</code>
			</p>
		</div>
	)
}
