export function formatError(error: unknown, fallbackMessage = 'Something went wrong'): string {
	if (typeof error === 'string') {
		return error
	}

	if (error instanceof Error) {
		// Clean up common AI API error patterns
		const message = error.message

		// Remove JSON parsing artifacts
		if (message.includes('{') && message.includes('}')) {
			const cleaned = message
				.replace(/\{[^}]+\}:?\s*/g, '')
				.replace(/\s+/g, ' ')
				.trim()
			if (cleaned.length > 10) return cleaned
		}

		// Handle common HTTP errors
		if (message.match(/^HTTP \d+: /)) {
			return message.replace(/^HTTP \d+: /, '').substring(0, 200)
		}

		// Truncate long messages
		if (message.length > 200) {
			return message.substring(0, 200) + '...'
		}

		return message || fallbackMessage
	}

	if (error && typeof error === 'object' && 'message' in error) {
		return formatError((error as { message: unknown }).message, fallbackMessage)
	}

	return fallbackMessage
}
