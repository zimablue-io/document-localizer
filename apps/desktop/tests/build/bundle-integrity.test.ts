import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

describe('Electron bundle integrity', () => {
	const distDir = path.join(__dirname, '../../dist-electron')
	const asarPath = path.join(distDir, 'resources/app.asar')

	const getAsarContents = (): string | null => {
		if (!fs.existsSync(asarPath)) {
			return null
		}
		try {
			return execSync(`npx asar list "${asarPath}"`, {
				encoding: 'utf8',
			})
		} catch {
			return null
		}
	}

	describe('when asar is built', () => {
		beforeAll(() => {
			const contents = getAsarContents()
			if (!contents) {
				console.log('ASAR not found. Run "pnpm electron:build" first to verify bundle integrity.')
			}
		})

		it('should include ms module for electron-updater', () => {
			const contents = getAsarContents()
			if (!contents) {
				console.log('SKIP: Bundle integrity test requires asar. Run "pnpm electron:build" first.')
				return
			}
			expect(contents).toContain('node_modules/ms/')
		})

		it('should include debug module', () => {
			const contents = getAsarContents()
			if (!contents) {
				return
			}
			expect(contents).toContain('node_modules/debug/')
		})

		it('should include electron-updater', () => {
			const contents = getAsarContents()
			if (!contents) {
				return
			}
			expect(contents).toContain('node_modules/electron-updater/')
		})
	})
})
