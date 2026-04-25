import { Brain, FileText, GitCompare, Shield } from 'lucide-react'
import { OpenSourceIcon } from './Icons'

const features = [
	{
		icon: Shield,
		title: 'Private',
		description: 'Nothing leaves your device.',
	},
	{
		icon: Brain,
		title: 'AI-Powered',
		description: 'Smart context-aware translations.',
	},
	{
		icon: GitCompare,
		title: 'You Control',
		description: 'Review every change before export.',
	},
	{
		icon: FileText,
		title: 'PDF & Markdown',
		description: 'Works with your formats.',
	},
	{
		icon: OpenSourceIcon,
		title: 'Open Source',
		description: 'Free and transparent.',
	},
]

export default function Features() {
	return (
		<section className="py-12 md:py-16 px-6 border-t border-border bg-gradient-to-b from-card/50 to-background">
			<div className="max-w-6xl mx-auto w-full">
				<div className="text-center mb-8">
					<h2 className="text-2xl font-bold mb-1">Everything you need</h2>
					<p className="text-muted-foreground text-sm">Localize documents with confidence.</p>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="group bg-card rounded-2xl p-4 border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
						>
							<div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
								<feature.icon className="w-4 h-4 text-primary" />
							</div>
							<h3 className="text-sm font-semibold mb-0.5">{feature.title}</h3>
							<p className="text-muted-foreground text-xs">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
