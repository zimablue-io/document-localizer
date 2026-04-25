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
	describe('API defaults', () => {
		it('has valid default API URL', () => {
			expect(DEFAULT_API_URL).toBe('http://localhost:8080/v1')
		})

		it('has valid default model', () => {
			expect(typeof DEFAULT_MODEL).toBe('string')
			expect(DEFAULT_MODEL.length).toBeGreaterThan(0)
		})
	})

	describe('processing defaults', () => {
		it('has valid chunk sizes', () => {
			expect(DEFAULT_CHUNK_SIZE).toBe('1000')
			expect(DEFAULT_OVERLAP_SIZE).toBe('100')
		})

		it('chunk size is greater than overlap', () => {
			expect(parseInt(DEFAULT_CHUNK_SIZE, 10)).toBeGreaterThan(parseInt(DEFAULT_OVERLAP_SIZE, 10))
		})
	})

	describe('locale defaults', () => {
		it('has enabled locales array', () => {
			expect(Array.isArray(DEFAULT_ENABLED_LOCALES)).toBe(true)
			expect(DEFAULT_ENABLED_LOCALES.length).toBeGreaterThan(0)
		})

		it('includes English variants', () => {
			expect(DEFAULT_ENABLED_LOCALES).toContain('en-US')
			expect(DEFAULT_ENABLED_LOCALES).toContain('en-GB')
		})
	})

	describe('processing constants', () => {
		it('has valid concurrency', () => {
			expect(PROCESSING_CONCURRENCY).toBe(4)
			expect(PROCESSING_CONCURRENCY).toBeGreaterThan(0)
		})

		it('has valid intervals', () => {
			expect(PROGRESS_UPDATE_INTERVAL).toBe(5)
			expect(DISK_WRITE_INTERVAL).toBe(10)
		})

		it('intervals are positive', () => {
			expect(PROGRESS_UPDATE_INTERVAL).toBeGreaterThan(0)
			expect(DISK_WRITE_INTERVAL).toBeGreaterThan(0)
		})
	})
})
