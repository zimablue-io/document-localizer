export default function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
			<svg className="w-20 h-20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<p className="text-xl mb-2">No documents loaded</p>
			<p className="text-sm">Click "Select Files" to choose PDF documents</p>
		</div>
	)
}
