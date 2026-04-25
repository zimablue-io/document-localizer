import { useState, useEffect } from 'react'

export type Platform = 'macos' | 'windows' | 'linux' | 'unsupported'

export function usePlatform(): Platform {
	const [platform, setPlatform] = useState<Platform>('unsupported')

	useEffect(() => {
		const platformStr = (navigator.platform || '').toLowerCase()
		const userAgent = navigator.userAgent.toLowerCase()

		if (platformStr.includes('mac') || userAgent.includes('mac')) {
			setPlatform('macos')
		} else if (platformStr.includes('win') || userAgent.includes('win')) {
			setPlatform('windows')
		} else if (platformStr.includes('linux') || userAgent.includes('linux')) {
			setPlatform('linux')
		} else {
			setPlatform('unsupported')
		}
	}, [])

	return platform
}
