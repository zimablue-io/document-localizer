/**
 * Integration tests that test the REAL pipeline
 *
 * These tests use actual file I/O and simulate what the frontend does.
 * Run with: cd packages/core && npx vitest run src/__tests__/integration.test.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

// Test with real PDF file
const TEST_PDF_PATH = path.join(__dirname, '../../../../tests/fixtures/resources/man-from-the-south.pdf')

describe('Real Integration Tests', () => {
	let pdfExists: boolean

	beforeAll(() => {
		pdfExists = fs.existsSync(TEST_PDF_PATH)
	})

	it('should have test PDF file available', () => {
		if (!pdfExists) {
			console.log(`Skipping - test PDF not found at ${TEST_PDF_PATH}`)
		}
		expect(pdfExists).toBe(true)
	})

	it('should detect PDF file type correctly', async () => {
		// Import the actual getFileType function
		const { getFileType } = await import('../services/file-processor')

		const fileType = getFileType(TEST_PDF_PATH)
		console.log(`getFileType("${TEST_PDF_PATH}") = "${fileType}"`)

		expect(fileType).toBe('pdf')
	})

	it('should generate correct .md path for PDF', async () => {
		const { getMdFilePath } = await import('../services/file-processor')

		const mdPath = getMdFilePath(TEST_PDF_PATH)
		console.log(`getMdFilePath("${TEST_PDF_PATH}") = "${mdPath}"`)

		expect(mdPath).toBe(path.join(__dirname, '../../../../tests/fixtures/resources/man-from-the-south.md'))
	})

	it('should verify .md file can be written and read', () => {
		// This tests that we have write permissions and the path is valid
		const testMdPath = '/tmp/test-integration.md'
		const testContent = 'Test content for integration'

		// Write
		fs.writeFileSync(testMdPath, testContent)

		// Verify
		const readContent = fs.readFileSync(testMdPath, 'utf-8')
		expect(readContent).toBe(testContent)

		// Cleanup
		fs.unlinkSync(testMdPath)
	})
})
