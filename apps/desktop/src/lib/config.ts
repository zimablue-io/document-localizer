/**
 * Application configuration constants.
 */

export const DEFAULT_API_URL = 'http://localhost:8080/v1'
export const DEFAULT_MODEL = 'gemma3n:e2b-it'
export const DEFAULT_CHUNK_SIZE = '1000'
export const DEFAULT_OVERLAP_SIZE = '100'
export const DEFAULT_ENABLED_LOCALES = ['en-US', 'en-GB']

/**
 * Processing configuration.
 */
export const PROCESSING_CONCURRENCY = 4
export const PROGRESS_UPDATE_INTERVAL = 5
export const DISK_WRITE_INTERVAL = 10
