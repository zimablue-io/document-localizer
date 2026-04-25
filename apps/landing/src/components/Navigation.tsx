import { LayoutGrid, ListChecks, Server } from 'lucide-react'
import { useActiveSection } from '../hooks/useActiveSection'

const navItems = [
	{ id: 'features', icon: LayoutGrid, label: 'Features' },
	{ id: 'how-it-works', icon: ListChecks, label: 'How It Works' },
	{ id: 'setup', icon: Server, label: 'Setup' },
]

const sectionIds = navItems.map((item) => item.id)

export default function Navigation() {
	const activeSection = useActiveSection(sectionIds)

	const scrollToSection = (id: string) => {
		const el = document.getElementById(id)
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	return (
		<nav className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
			{navItems.map((item) => {
				const isActive = activeSection === item.id
				const Icon = item.icon

				return (
					<button
						key={item.id}
						onClick={() => scrollToSection(item.id)}
						className="group relative flex items-center h-10 rounded-full overflow-hidden transition-all duration-300 shadow-md border border-border bg-card w-10 hover:w-auto"
						title={item.label}
					>
						<div className="flex-shrink-0 pl-[10px]">
							<Icon
								className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}
							/>
						</div>
						<span
							className={`pl-2 pr-4 text-sm font-medium whitespace-nowrap transition-opacity duration-200
							${isActive ? 'text-primary' : 'text-foreground'}
							opacity-0 group-hover:opacity-100`}
						>
							{item.label}
						</span>
					</button>
				)
			})}
		</nav>
	)
}
