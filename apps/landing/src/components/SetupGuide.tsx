import { useState } from 'react'

interface Provider {
	id: string
	name: string
	installUrl: string
	defaultPort: string
	defaultApiUrl: string
	steps: { title: string; command?: string; description: string }[]
}

const providers: Provider[] = [
	{
		id: 'ollama',
		name: 'Ollama',
		installUrl: 'https://ollama.ai',
		defaultPort: '11434',
		defaultApiUrl: 'http://localhost:11434/v1',
		steps: [
			{
				title: 'Install Ollama',
				command: 'brew install ollama',
				description: 'Or download from ollama.ai/download',
			},
			{
				title: 'Start the server',
				command: 'ollama serve',
				description: 'Runs automatically on port 11434. Keep this terminal open while using the app.',
			},
			{
				title: 'Pull a model',
				command: 'ollama pull llama3.2:3b',
				description: 'Downloads the model (~2GB). Choose any model from ollama.ai/library.',
			},
			{
				title: 'Configure in app',
				description:
					'Enter API URL http://localhost:11434/v1 and model name (e.g., llama3.2:3b) in Settings.',
			},
		],
	},
	{
		id: 'lmstudio',
		name: 'LM Studio',
		installUrl: 'https://lmstudio.ai',
		defaultPort: '1234',
		defaultApiUrl: 'http://localhost:1234/v1',
		steps: [
			{
				title: 'Download LM Studio',
				command: null,
				description: 'Get it from lmstudio.ai - available for macOS, Windows, and Linux.',
			},
			{
				title: 'Download a model',
				description:
					'Use the search bar to find and download a model (e.g., "llama 3.2 3b"). The model downloads to your local machine.',
			},
			{
				title: 'Start local server',
				description:
					'Click the "Local Server" tab on the left. Click "Start Server" - it defaults to http://localhost:1234/v1.',
			},
			{
				title: 'Configure in app',
				description:
					'Enter API URL http://localhost:1234/v1 and model name (from the model you downloaded) in Settings.',
			},
		],
	},
	{
		id: 'llamacpp',
		name: 'llama.cpp',
		installUrl: 'https://github.com/ggerganov/llama.cpp',
		defaultPort: '8080',
		defaultApiUrl: 'http://localhost:8080/v1',
		steps: [
			{
				title: 'Install llama.cpp',
				command: 'brew install llama.cpp',
				description: 'Builds the server binary. Requires CMake and build tools.',
			},
			{
				title: 'Download a model',
				description:
					'Download a GGUF model file from Hugging Face (e.g., TheBloke/Mistral-7B-Instruct-v0.2-GGUF).',
			},
			{
				title: 'Start the server',
				command: 'llama-server -m model.gguf -c 4096 -port 8080',
				description: 'Adjust model path and context size as needed. Port 8080 is default.',
			},
			{
				title: 'Configure in app',
				description: 'Enter API URL http://localhost:8080/v1 and model name (from your GGUF filename) in Settings.',
			},
		],
	},
]

function TerminalBlock({ command }: { command: string }) {
	return (
		<code className="block bg-[#1a1a2e] text-green-400 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
			{command}
		</code>
	)
}

function StepItem({
	step,
	isLast,
}: {
	step: { title: string; command?: string | null; description: string }
	isLast: boolean
}) {
	return (
		<div className="flex gap-4">
			<div className="flex flex-col items-center">
				<div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
					{step.title.charAt(0)}
				</div>
				{!isLast && <div className="w-px h-full min-h-[3rem] bg-border mt-2" />}
			</div>
			<div className="flex-1 pb-8">
				<h4 className="font-semibold mb-2">{step.title}</h4>
				{step.command && <TerminalBlock command={step.command} />}
				<p className="text-muted-foreground text-sm mt-2">{step.description}</p>
			</div>
		</div>
	)
}

export default function SetupGuide() {
	const [activeTab, setActiveTab] = useState('ollama')
	const activeProvider = providers.find((p) => p.id === activeTab)!

	return (
		<section className="py-20 px-6 border-t border-border">
			<div className="max-w-4xl mx-auto">
				<h2 className="text-3xl font-bold text-center mb-4">Setup Your AI Backend</h2>
				<p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
					Document Localizer works with any OpenAI-compatible API. Choose your preferred backend below
					and follow the steps to get started.
				</p>

				{/* Horizontal Tab List */}
				<div className="flex border-b border-border mb-8">
					{providers.map((provider) => (
						<button
							key={provider.id}
							onClick={() => setActiveTab(provider.id)}
							className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
								activeTab === provider.id
									? 'border-primary text-primary'
									: 'border-transparent text-muted-foreground hover:text-foreground'
							}`}
						>
							{provider.name}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className="grid md:grid-cols-2 gap-8">
					{/* Left: Steps */}
					<div>
						<div className="flex items-center gap-3 mb-6">
							<h3 className="text-xl font-semibold">{activeProvider.name}</h3>
							<span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
								Port {activeProvider.defaultPort}
							</span>
						</div>

						<div>
							{activeProvider.steps.map((step, index) => (
								<StepItem
									key={step.title}
									step={step}
									isLast={index === activeProvider.steps.length - 1}
								/>
							))}
						</div>
					</div>

					{/* Right: Quick Reference */}
					<div className="bg-card rounded-xl p-6 border border-border h-fit">
						<h4 className="font-semibold mb-4">Quick Reference</h4>

						<div className="space-y-4">
							<div>
								<p className="text-xs text-muted-foreground mb-1">API URL</p>
								<TerminalBlock command={activeProvider.defaultApiUrl} />
							</div>

							<div className="border-t border-border pt-4">
								<p className="text-xs text-muted-foreground mb-2">Install</p>
								<a
									href={activeProvider.installUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-primary hover:underline"
								>
									{activeProvider.installUrl}
								</a>
							</div>
						</div>

						<div className="mt-6 p-4 bg-secondary/50 rounded-lg">
							<p className="text-sm">
								<strong>Note:</strong> Any OpenAI-compatible API works. The app sends text to your
								local server and receives translations back.
							</p>
						</div>
					</div>
				</div>

				{/* System Requirements Footer */}
				<div className="mt-12 pt-8 border-t border-border">
					<h4 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
						System Requirements
					</h4>
					<div className="flex flex-wrap justify-center gap-6 text-sm">
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
								/>
							</svg>
							<span>macOS 12+</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
								/>
							</svg>
							<span>4GB+ RAM (8GB recommended)</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"
								/>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
							</svg>
							<span>~5GB disk per model</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
