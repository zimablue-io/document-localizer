import {
	Button,
	Input,
	Label,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@doclocalizer/ui'
import { useState } from 'react'

interface Locale {
	code: string
	name: string
}

interface Settings {
	apiUrl: string
	model: string
	chunkSize: string
	overlapSize: string
	targetLocale: string
	sourceLocale: string
	customLocales: Locale[]
	customPrompt?: string
}

const DEFAULT_PROMPT = `Translate the following markdown text to {locale}.

CRITICAL RULES:
1. Preserve EXACTLY the same paragraph structure - keep blank lines between paragraphs
2. Preserve ALL markdown formatting (headings, bold, italic, quotes, dialogue, etc.)
3. ONLY translate the text content, never modify the structure
4. Return ONLY the translated text - NO markers, comments, or explanations

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

	const handleResetPrompt = () => {
		onChange({ ...settings, customPrompt: DEFAULT_PROMPT })
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

	const allLocales = settings.customLocales

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
							{settings.customLocales.length > 0 && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label htmlFor="source-locale">Source Locale</Label>
										<Select
											value={settings.sourceLocale}
											onValueChange={(v) => onChange({ ...settings, sourceLocale: v })}
										>
											<SelectTrigger id="source-locale" className="w-full">
												<SelectValue placeholder="Select source..." />
											</SelectTrigger>
											<SelectContent>
												{allLocales.map((locale) => (
													<SelectItem key={locale.code} value={locale.code}>
														{locale.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											Original language of your documents
										</p>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="target-locale">Target Locale</Label>
										<Select
											value={settings.targetLocale}
											onValueChange={(v) => onChange({ ...settings, targetLocale: v })}
										>
											<SelectTrigger id="target-locale" className="w-full">
												<SelectValue placeholder="Select target..." />
											</SelectTrigger>
											<SelectContent>
												{allLocales.map((locale) => (
													<SelectItem key={locale.code} value={locale.code}>
														{locale.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">Language to translate to</p>
									</div>
								</div>
							)}

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
									placeholder="http://localhost:11434/v1"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="model">Model</Label>
								<Input
									id="model"
									value={settings.model}
									onChange={(e) => onChange({ ...settings, model: e.target.value })}
									placeholder="qwen2.5:7b-instruct"
								/>
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
