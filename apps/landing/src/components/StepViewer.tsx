import { useEffect, useRef, useState } from 'react'

interface Step {
	id: string
	title: string
	image: string
	description: string
}

const steps: Step[] = [
	{
		id: '1',
		title: 'Upload Documents',
		image: '/images/step 1 - uploaded.png',
		description:
			'Select PDF or Markdown files to add to your source library. Choose source and target locales for each document, then click Process to begin.',
	},
	{
		id: '2',
		title: 'Monitor & Review',
		image: '/images/step 2 - tasks.png',
		description:
			'Track processing progress with real-time status updates. When processing completes, click "Review" to inspect changes in a side-by-side diff view with paragraph-level editing, approve/reject controls.',
	},
	{
		id: '3',
		title: 'Export Results',
		image: '/images/step 3 - processed.png',
		description:
			'View approved and rejected outputs. Export completed documents as Markdown or PDF with one click.',
	},
]

export default function StepViewer() {
	const [activeStep, setActiveStep] = useState(0)
	const sectionRef = useRef<HTMLDivElement>(null)
	const stepRefs = useRef<(HTMLDivElement | null)[]>([])

	// Scroll-driven activation via IntersectionObserver
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const index = stepRefs.current.findIndex((ref) => ref === entry.target)
						if (index !== -1) {
							setActiveStep(index)
						}
					}
				})
			},
			{
				root: null,
				rootMargin: '-40% 0px -40% 0px',
				threshold: 0,
			}
		)

		stepRefs.current.forEach((ref) => {
			if (ref) observer.observe(ref)
		})

		return () => observer.disconnect()
	}, [])

	const scrollToStep = (index: number) => {
		stepRefs.current[index]?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		})
		setActiveStep(index)
	}

	return (
		<section className="py-20 px-6 border-t border-border">
			<div className="max-w-6xl mx-auto">
				<h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

				<div className="flex gap-12" ref={sectionRef}>
					{/* Left Sidebar - Vertical Tabs */}
					<div className="w-56 flex-shrink-0">
						<nav className="space-y-1">
							{steps.map((step, index) => (
								<button
									key={step.id}
									onClick={() => scrollToStep(index)}
									className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border-l-4 ${
										activeStep === index
											? 'border-primary bg-primary/10 text-foreground'
											: 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
									}`}
								>
									<span className="text-sm font-medium">Step {step.id}</span>
									<span className="block text-base font-semibold mt-0.5">{step.title}</span>
								</button>
							))}
						</nav>
					</div>

					{/* Right Content - Dynamic Area */}
					<div className="flex-1 min-h-[500px]">
						{steps.map((step, index) => (
							<div
								key={step.id}
								ref={(el) => {
									stepRefs.current[index] = el
								}}
								className={`transition-opacity duration-300 ${
									activeStep === index ? 'opacity-100' : 'opacity-0 hidden'
								}`}
							>
								<div className="bg-card rounded-xl overflow-hidden border border-border">
									<img
										src={step.image}
										alt={`${step.title} screenshot`}
										className="w-full h-auto object-contain"
									/>
								</div>
								<div className="mt-6">
									<h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
									<p className="text-muted-foreground leading-relaxed">{step.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
