import { Button, Input, Label, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from '@doclocalizer/ui'
import { Check, Edit2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Locale {
	code: string
	name: string
}

interface ModelConfig {
	id: string
	name: string
}

interface Settings {
	apiUrl: string
	models: ModelConfig[]
	activeModelId: string
	chunkSize: string
	overlapSize: string
	targetLocale: string
	sourceLocale: string
	customLocales: Locale[]
	customPrompt?: string
}

const DEFAULT_PROMPT = `STRICT LOCALIZATION RULES - FOLLOW EXACTLY:

CRITICAL - THIS IS WORD REPLACEMENT ONLY:
- You are NOT writing a story. You are NOT being creative. You are ONLY replacing words.
- NEVER invent, add, remove, or modify any content beyond word-level changes
- NEVER change sentence structure, punctuation, or paragraph structure
- NEVER add dialogue, descriptions, or narrative that wasn't in the original
- The text you output MUST contain EXACTLY the same words as the input, just with spelling/word replacements

TARGET LOCALE CONVERSIONS ONLY:
- color → colour (or vice versa depending on target)
- honor → honour (or vice versa)
- Words like "mom", "dad", "football", "soccer" → use the target locale equivalent
- Only make changes that match the target locale's spelling/word conventions

PRESERVE EVERYTHING EXACTLY:
- Keep every single word from the original
- Keep all punctuation exactly as written
- Keep all paragraph breaks exactly as in the original
- Keep all dialogue exactly as written - do NOT add speech tags like "he said" or "she whispered"
- Keep all capitalization exactly as in the original
- Keep all sentence structure exactly as in the original
- If a word has no locale-specific alternative, leave it EXACTLY as is

OUTPUT FORMAT:
- Output EXACTLY one paragraph of text
- NO markers, NO comments, NO explanations
- NO leading/trailing whitespace

---BEGIN TEXT---
{text}
---END TEXT---`

interface SettingsModalProps {
	settings: Settings
	onChange: (settings: Settings) => void
	onSave: () => void
	onClose: () => void
}

export default function SettingsModal({ settings, onChange, onSave, onClose }: SettingsModalProps) {
	const [activeTab, setActiveTab] = useState<string>('locales')
	const [newLocaleName, setNewLocaleName] = useState('')
	const [newLocaleCode, setNewLocaleCode] = useState('')
	const [editingLocale, setEditingLocale] = useState<Locale | null>(null)
	const [editCode, setEditCode] = useState('')
	const [editName, setEditName] = useState('')

	// Model management state
	const [newModelName, setNewModelName] = useState('')
	const [editingModelId, setEditingModelId] = useState<string | null>(null)
	const [editModelName, setEditModelName] = useState('')

	const handleResetPrompt = () => {
		onChange({ ...settings, customPrompt: DEFAULT_PROMPT })
	}

	const handleAddModel = () => {
		if (newModelName.trim()) {
			const newModel: ModelConfig = {
				id: crypto.randomUUID(),
				name: newModelName.trim(),
			}
			const updatedModels = [...settings.models, newModel]
			onChange({ ...settings, models: updatedModels, activeModelId: updatedModels[0].id })
			setNewModelName('')
		}
	}

	const handleRemoveModel = (id: string) => {
		const updatedModels = settings.models.filter((m) => m.id !== id)
		let newActiveId = settings.activeModelId
		if (settings.activeModelId === id) {
			newActiveId = updatedModels[0]?.id || ''
		}
		onChange({ ...settings, models: updatedModels, activeModelId: newActiveId })
	}

	const handleStartEditModel = (model: ModelConfig) => {
		setEditingModelId(model.id)
		setEditModelName(model.name)
	}

	const handleSaveEditModel = () => {
		if (editingModelId && editModelName.trim()) {
			const updatedModels = settings.models.map((m) =>
				m.id === editingModelId ? { ...m, name: editModelName.trim() } : m
			)
			onChange({ ...settings, models: updatedModels })
			setEditingModelId(null)
			setEditModelName('')
		}
	}

	const handleCancelEditModel = () => {
		setEditingModelId(null)
		setEditModelName('')
	}

	const handleAddLocale = () => {
		if (newLocaleCode && newLocaleName) {
			const newLocale = { code: newLocaleCode, name: newLocaleName }
			if (!settings.customLocales.some((l) => l.code === newLocaleCode)) {
				onChange({ ...settings, customLocales: [...settings.customLocales, newLocale] })
			}
			setNewLocaleCode('')
			setNewLocaleName('')
		}
	}

	const handleRemoveLocale = (code: string) => {
		onChange({ ...settings, customLocales: settings.customLocales.filter((l) => l.code !== code) })
		if (settings.sourceLocale === code) onChange({ ...settings, sourceLocale: '' })
		if (settings.targetLocale === code) onChange({ ...settings, targetLocale: '' })
	}

	const handleStartEdit = (locale: Locale) => {
		setEditingLocale(locale)
		setEditCode(locale.code)
		setEditName(locale.name)
	}

	const handleSaveEdit = () => {
		if (editingLocale && editCode && editName) {
			const updatedLocales = settings.customLocales.map((l) =>
				l.code === editingLocale.code ? { code: editCode, name: editName } : l
			)
			const updatedSource = settings.sourceLocale === editingLocale.code ? editCode : settings.sourceLocale
			const updatedTarget = settings.targetLocale === editingLocale.code ? editCode : settings.targetLocale
			onChange({
				...settings,
				customLocales: updatedLocales,
				sourceLocale: updatedSource,
				targetLocale: updatedTarget,
			})
			setEditingLocale(null)
		}
	}

	const handleCancelEdit = () => {
		setEditingLocale(null)
		setEditCode('')
		setEditName('')
	}

	const _allLocales = settings.customLocales

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-card rounded-lg border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
				<h2 className="text-lg font-semibold mb-4">Settings</h2>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList variant="line">
						<TabsTrigger value="locales">Locales</TabsTrigger>
						<TabsTrigger value="api">API</TabsTrigger>
						<TabsTrigger value="processing">Processing</TabsTrigger>
						<TabsTrigger value="prompt">Prompt</TabsTrigger>
					</TabsList>

					<ScrollArea className="flex-1 min-h-0 mt-4">
						<TabsContent value="locales" className="space-y-4 pr-4">
							<div className="mb-4">
								<p className="text-sm text-muted-foreground">
									Manage available locales. Each document can be processed to a different locale.
								</p>
							</div>

							<div className="border-t border-border pt-4">
								<Label className="mb-2 block">Add Locale</Label>
								<div className="flex gap-2">
									<Input
										value={newLocaleCode}
										onChange={(e) => setNewLocaleCode(e.target.value)}
										placeholder="Code (e.g., pt-BR)"
										className="flex-1"
									/>
									<Input
										value={newLocaleName}
										onChange={(e) => setNewLocaleName(e.target.value)}
										placeholder="Name (e.g., Portuguese Brazil)"
										className="flex-1"
									/>
									<Button onClick={handleAddLocale} disabled={!newLocaleCode || !newLocaleName}>
										Add
									</Button>
								</div>
							</div>

							{settings.customLocales.length > 0 && (
								<div className="space-y-2">
									<Label>Configured Locales</Label>
									<div className="space-y-2">
										{settings.customLocales.map((locale) => (
											<div key={locale.code} className="px-3 py-2 bg-secondary rounded-lg">
												{editingLocale?.code === locale.code ? (
													<div className="space-y-2">
														<div className="flex gap-2">
															<Input
																value={editCode}
																onChange={(e) => setEditCode(e.target.value)}
																placeholder="Code"
																className="flex-1"
															/>
															<Input
																value={editName}
																onChange={(e) => setEditName(e.target.value)}
																placeholder="Name"
																className="flex-1"
															/>
														</div>
														<div className="flex gap-2 justify-end">
															<Button
																variant="outline"
																size="sm"
																onClick={handleCancelEdit}
															>
																Cancel
															</Button>
															<Button size="sm" onClick={handleSaveEdit}>
																Save
															</Button>
														</div>
													</div>
												) : (
													<div className="flex items-center justify-between">
														<span>
															{locale.name}{' '}
															<span className="text-muted-foreground">
																({locale.code})
															</span>
														</span>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleStartEdit(locale)}
															>
																Edit
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleRemoveLocale(locale.code)}
															>
																Remove
															</Button>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="api" className="space-y-4 pr-4">
							<div className="space-y-1.5">
								<Label htmlFor="api-url">API URL</Label>
								<Input
									id="api-url"
									value={settings.apiUrl}
									onChange={(e) => onChange({ ...settings, apiUrl: e.target.value })}
									placeholder="http://localhost:8080/v1"
								/>
							</div>

							<div className="border-t border-border pt-4">
								<Label className="mb-2 block">Models</Label>
								<div className="flex gap-2 mb-3">
									<Input
										value={newModelName}
										onChange={(e) => setNewModelName(e.target.value)}
										placeholder="Model name (e.g., llama:3.2:3b-instruct)"
										className="flex-1"
										onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
									/>
									<Button onClick={handleAddModel} disabled={!newModelName.trim()}>
										<Plus className="w-4 h-4 mr-1" />
										Add
									</Button>
								</div>

								{settings.models.length > 0 && (
									<div className="space-y-2">
										{settings.models.map((model) => (
											<div key={model.id} className="px-3 py-2 bg-secondary rounded-lg">
												{editingModelId === model.id ? (
													<div className="space-y-2">
														<div className="flex gap-2">
															<Input
																value={editModelName}
																onChange={(e) => setEditModelName(e.target.value)}
																placeholder="Model name"
																className="flex-1"
															/>
														</div>
														<div className="flex gap-2 justify-end">
															<Button
																variant="outline"
																size="sm"
																onClick={handleCancelEditModel}
															>
																Cancel
															</Button>
															<Button size="sm" onClick={handleSaveEditModel}>
																<Check className="w-4 h-4 mr-1" />
																Save
															</Button>
														</div>
													</div>
												) : (
													<div className="flex items-center justify-between">
														<span className="flex items-center gap-2">
															{model.name}
															{model.id === settings.activeModelId && (
																<span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
																	Active
																</span>
															)}
														</span>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleStartEditModel(model)}
															>
																<Edit2 className="w-4 h-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleRemoveModel(model.id)}
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value="processing" className="space-y-4 pr-4">
							<div className="space-y-1.5">
								<Label htmlFor="chunk-size">Chunk Size</Label>
								<Input
									id="chunk-size"
									value={settings.chunkSize}
									onChange={(e) => onChange({ ...settings, chunkSize: e.target.value })}
								/>
								<p className="text-xs text-muted-foreground">Maximum characters per chunk</p>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="overlap-size">Overlap</Label>
								<Input
									id="overlap-size"
									value={settings.overlapSize}
									onChange={(e) => onChange({ ...settings, overlapSize: e.target.value })}
								/>
								<p className="text-xs text-muted-foreground">Characters to overlap between chunks</p>
							</div>
						</TabsContent>

						<TabsContent value="prompt" className="space-y-2 pr-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="prompt">Localization Prompt</Label>
								<Button variant="link" size="sm" onClick={handleResetPrompt}>
									Reset
								</Button>
							</div>
							<textarea
								id="prompt"
								value={settings.customPrompt || DEFAULT_PROMPT}
								onChange={(e) => onChange({ ...settings, customPrompt: e.target.value })}
								className="min-h-[16rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 resize-none font-mono"
								placeholder="Enter your custom prompt..."
							/>
							<p className="text-xs text-muted-foreground">
								Use <code className="bg-secondary px-1 rounded">{'{locale}'}</code> for target locale,{' '}
								<code className="bg-secondary px-1 rounded">{'{text}'}</code> for content to translate
							</p>
						</TabsContent>
					</ScrollArea>
				</Tabs>

				<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={onSave}>Save</Button>
				</div>
			</div>
		</div>
	)
}
