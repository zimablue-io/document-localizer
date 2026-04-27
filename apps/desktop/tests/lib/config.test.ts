import { describe, expect, it } from 'vitest'
import {
	DEFAULT_API_URL,
	DEFAULT_CHUNK_SIZE,
	DEFAULT_ENABLED_LOCALES,
	DEFAULT_MODEL,
	DEFAULT_OVERLAP_SIZE,
	DISK_WRITE_INTERVAL,
	PROCESSING_CONCURRENCY,
	PROGRESS_UPDATE_INTERVAL,
} from '../../src/lib/config'

describe('lib/config', () => {
	describe('default settings', () => {
		it('DEFAULT_API_URL is a valid URL', () => {
			expect(DEFAULT_API_URL).toMatch(/^http/)
			expect(DEFAULT_API_URL).toContain('localhost')
		})

		it('DEFAULT_MODEL is a non-empty string', () => {
			expect(DEFAULT_MODEL).toBeTruthy()
			expect(typeof DEFAULT_MODEL).toBe('string')
			expect(DEFAULT_MODEL.length).toBeGreaterThan(0)
		})

		it('DEFAULT_CHUNK_SIZE is a valid number string', () => {
			expect(Number.isInteger(Number(DEFAULT_CHUNK_SIZE))).toBe(true)
			expect(Number(DEFAULT_CHUNK_SIZE)).toBeGreaterThan(0)
		})

		it('DEFAULT_OVERLAP_SIZE is a valid number string', () => {
			expect(Number.isInteger(Number(DEFAULT_OVERLAP_SIZE))).toBe(true)
			expect(Number(DEFAULT_OVERLAP_SIZE)).toBeGreaterThanOrEqual(0)
		})

		it('DEFAULT_ENABLED_LOCALES contains common locales', () => {
			expect(Array.isArray(DEFAULT_ENABLED_LOCALES)).toBe(true)
			expect(DEFAULT_ENABLED_LOCALES.length).toBeGreaterThan(0)
			expect(DEFAULT_ENABLED_LOCALES).toContain('en-US')
			expect(DEFAULT_ENABLED_LOCALES).toContain('en-GB')
		})
	})

	describe('processing configuration', () => {
		it('PROCESSING_CONCURRENCY is a positive integer', () => {
			expect(Number.isInteger(PROCESSING_CONCURRENCY)).toBe(true)
			expect(PROCESSING_CONCURRENCY).toBeGreaterThan(0)
		})

		it('PROCESSING_CONCURRENCY is reasonable for parallel processing', () => {
			// Should be a small number (1-10) for parallel API calls
			expect(PROCESSING_CONCURRENCY).toBeLessThanOrEqual(10)
			expect(PROCESSING_CONCURRENCY).toBeGreaterThanOrEqual(1)
		})

		it('PROGRESS_UPDATE_INTERVAL is a positive integer', () => {
			expect(Number.isInteger(PROGRESS_UPDATE_INTERVAL)).toBe(true)
			expect(PROGRESS_UPDATE_INTERVAL).toBeGreaterThan(0)
		})

		it('DISK_WRITE_INTERVAL is a positive integer', () => {
			expect(Number.isInteger(DISK_WRITE_INTERVAL)).toBe(true)
			expect(DISK_WRITE_INTERVAL).toBeGreaterThan(0)
		})

		it('DISK_WRITE_INTERVAL is greater than or equal to PROGRESS_UPDATE_INTERVAL', () => {
			// Disk writes should be less frequent than progress updates
			expect(DISK_WRITE_INTERVAL).toBeGreaterThanOrEqual(PROGRESS_UPDATE_INTERVAL)
		})
	})

	describe('sensible defaults', () => {
		it('chunk size is appropriate for LLM context', () => {
			const chunkSize = Number(DEFAULT_CHUNK_SIZE)
			// Should be in a reasonable range for LLM processing
			expect(chunkSize).toBeGreaterThanOrEqual(100)
			expect(chunkSize).toBeLessThanOrEqual(10000)
		})

		it('overlap is smaller than chunk size', () => {
			const chunkSize = Number(DEFAULT_CHUNK_SIZE)
			const overlapSize = Number(DEFAULT_OVERLAP_SIZE)
			expect(overlapSize).toBeLessThan(chunkSize)
		})

		it('overlap provides meaningful context', () => {
			const chunkSize = Number(DEFAULT_CHUNK_SIZE)
			const overlapSize = Number(DEFAULT_OVERLAP_SIZE)
			// Overlap should be a reasonable percentage of chunk size
			const overlapRatio = overlapSize / chunkSize
			expect(overlapRatio).toBeGreaterThan(0)
			expect(overlapRatio).toBeLessThan(0.5) // Less than 50% overlap
		})
	})

	describe('API configuration', () => {
		it('default API URL uses port 8080', () => {
			expect(DEFAULT_API_URL).toContain(':8080')
		})

		it('default API URL includes v1 path', () => {
			expect(DEFAULT_API_URL).toContain('/v1')
		})

		it('default model format is reasonable', () => {
			// Models typically have format like "modelname:version" or just "modelname"
			expect(DEFAULT_MODEL).toBeTruthy()
		})
	})
})
