import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Mock window for jsdom environment
Object.defineProperty(window, 'crypto', {
	value: {
		randomUUID: () => Math.random().toString(36).substring(2, 15),
	},
})

afterEach(() => {
	cleanup()
})
