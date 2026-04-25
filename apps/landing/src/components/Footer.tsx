import { GitHubIcon } from './Icons'

export default function Footer() {
	return (
		<footer className="py-10 px-6 border-t border-border mt-auto">
			<div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
				<div className="text-sm text-muted-foreground">Document Localizer</div>
				<a
					href="https://github.com/zimablue-io/document-localizer"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<GitHubIcon className="w-4 h-4" />
					View on GitHub
				</a>
				<div className="text-sm text-muted-foreground">MIT License</div>
			</div>
		</footer>
	)
}
