import { useCallback, useEffect, useState } from 'react'

function getSectionBounds(id: string): { top: number; bottom: number } | null {
	if (typeof document === 'undefined') return null
	const el = document.getElementById(id)
	if (!el) return null
	const rect = el.getBoundingClientRect()
	const top = rect.top + window.scrollY
	return { top, bottom: top + rect.height }
}

function getActiveSectionFromScroll(sectionIds: string[]): string {
	if (sectionIds.length === 0) return sectionIds[0] || ''
	const refY = window.scrollY + 120

	const sections: { id: string; top: number; bottom: number }[] = []
	for (const id of sectionIds) {
		const bounds = getSectionBounds(id)
		if (bounds) sections.push({ id, ...bounds })
	}
	if (sections.length === 0) return sectionIds[0] || ''

	sections.sort((a, b) => a.top - b.top)

	for (const { id, top, bottom } of sections) {
		if (refY >= top && refY <= bottom) return id
	}

	if (refY < sections[0].top) return sections[0].id
	return sections[sections.length - 1].id
}

export function useActiveSection(sectionIds: string[]) {
	const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || '')

	const update = useCallback(() => {
		const next = getActiveSectionFromScroll(sectionIds)
		setActiveSection((prev) => (prev === next ? prev : next))
	}, [sectionIds])

	useEffect(() => {
		update()

		let rafId: number
		const onScroll = () => {
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(update)
		}

		window.addEventListener('scroll', onScroll, { passive: true })

		const resizeObserver = new ResizeObserver(() => update())
		for (const id of sectionIds) {
			const el = document.getElementById(id)
			if (el) resizeObserver.observe(el)
		}

		return () => {
			window.removeEventListener('scroll', onScroll)
			cancelAnimationFrame(rafId)
			resizeObserver.disconnect()
		}
	}, [sectionIds, update])

	return activeSection
}
