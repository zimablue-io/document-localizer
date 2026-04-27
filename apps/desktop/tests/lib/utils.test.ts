import { describe, expect, it } from 'vitest'
import { formatError } from '../../src/lib/utils'

describe('lib/utils', () => {
	describe('formatError', () => {
		describe('string errors', () => {
			it('returns string error unchanged', () => {
				const error = 'Something went wrong'
				expect(formatError(error)).toBe('Something went wrong')
			})

			it('converts ERR_EMPTY_RESPONSE to user-friendly message', () => {
				const error = 'Failed to fetch: ERR_EMPTY_RESPONSE'
				expect(formatError(error)).toContain('Server did not respond')
			})

			it('converts ERR_CONNECTION_REFUSED to user-friendly message', () => {
				const error = 'Network error: ERR_CONNECTION_REFUSED'
				expect(formatError(error)).toContain('Could not connect to server')
			})

			it('converts ERR_CONNECTION_TIMED_OUT to user-friendly message', () => {
				const error = 'Timeout: ERR_CONNECTION_TIMED_OUT'
				expect(formatError(error)).toContain('Connection timed out')
			})

			it('converts ERR_NAME_NOT_RESOLVED to user-friendly message', () => {
				const error = 'DNS error: ERR_NAME_NOT_RESOLVED'
				expect(formatError(error)).toContain('Server not found')
			})

			it('handles case-insensitive Chrome errors', () => {
				const error = 'err_empty_response'
				expect(formatError(error)).toContain('Server did not respond')
			})
		})

		describe('Error object', () => {
			it('returns Error message unchanged', () => {
				const error = new Error('Something went wrong')
				expect(formatError(error)).toBe('Something went wrong')
			})

			it('converts Chrome network errors in Error.message', () => {
				const error = new Error('Request failed: ERR_CONNECTION_REFUSED')
				expect(formatError(error)).toContain('Could not connect to server')
			})

			it('handles HTTP error format', () => {
				const error = new Error('HTTP 500: Internal server error')
				expect(formatError(error)).toBe('Internal server error')
			})

			it('handles HTTP error with custom code', () => {
				const error = new Error('HTTP 404: Not found')
				expect(formatError(error)).toBe('Not found')
			})

			it('truncates long error messages', () => {
				const longMessage = 'A'.repeat(250)
				const result = formatError(new Error(longMessage))
				expect(result.length).toBeLessThanOrEqual(203) // 200 + '...'
				expect(result.endsWith('...')).toBe(true)
			})

			it('handles empty error message', () => {
				const error = new Error('')
				expect(formatError(error)).toBe('Something went wrong') // fallback
			})

			it('handles nested error object with message', () => {
				const error = { message: 'Nested error message' } as unknown as Error
				expect(formatError(error)).toBe('Nested error message')
			})
		})

		describe('Chrome network error codes', () => {
			it('extracts and formats NET::ERR codes', () => {
				const error = new Error('net::ERR_CERT_AUTHORITY_INVALID')
				const result = formatError(error)
				expect(result).toContain('CERT AUTHORITY INVALID')
			})

			it('handles various NET::ERR variants', () => {
				const error = new Error('NET::ERR_SSL_PROTOCOL_ERROR')
				const result = formatError(error)
				expect(result).toContain('SSL PROTOCOL ERROR')
			})
		})

		describe('fallback handling', () => {
			it('returns custom fallback message', () => {
				const error = new Error('')
				expect(formatError(error, 'Custom fallback')).toBe('Custom fallback')
			})

			it('handles null/undefined', () => {
				expect(formatError(null)).toBe('Something went wrong')
				expect(formatError(undefined)).toBe('Something went wrong')
			})

			it('handles non-object, non-string errors', () => {
				expect(formatError(123)).toBe('Something went wrong')
				expect(formatError({})).toBe('Something went wrong')
			})
		})
	})
})
