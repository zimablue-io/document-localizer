export function formatError(error: unknown, fallbackMessage = 'Something went wrong'): string {
	if (typeof error === 'string') {
		// Handle case-insensitive Chrome network errors
		const upperMsg = error.toUpperCase()
		if (upperMsg.includes('ERR_EMPTY_RESPONSE')) {
			return 'Server did not respond. Please check if your AI server is running.'
		}
		if (upperMsg.includes('ERR_CONNECTION_REFUSED')) {
			return 'Could not connect to server. Please verify your API URL in settings.'
		}
		if (upperMsg.includes('ERR_CONNECTION_TIMED_OUT')) {
			return 'Connection timed out. The server may be busy or unreachable.'
		}
		if (upperMsg.includes('ERR_NAME_NOT_RESOLVED')) {
			return 'Server not found. Please check your API URL.'
		}
		if (upperMsg.includes('ERR_INTERNET_DISCONNECTED')) {
			return 'No internet connection.'
		}
		if (upperMsg.includes('NET::ERR_')) {
			const match = error.match(/net::(err_\w+)/i)
			if (match) {
				const code = match[1].replace('err_', '').replace(/_/g, ' ')
				return `Connection error: ${code}`
			}
		}
		return error
	}

	if (error instanceof Error) {
		const message = error.message

		// Handle Chrome network errors with case-insensitive check
		const upperMsg = message.toUpperCase()
		if (upperMsg.includes('ERR_EMPTY_RESPONSE')) {
			return 'Server did not respond. Please check if your AI server is running.'
		}
		if (upperMsg.includes('ERR_CONNECTION_REFUSED')) {
			return 'Could not connect to server. Please verify your API URL in settings.'
		}
		if (upperMsg.includes('ERR_CONNECTION_TIMED_OUT')) {
			return 'Connection timed out. The server may be busy or unreachable.'
		}
		if (upperMsg.includes('ERR_NAME_NOT_RESOLVED')) {
			return 'Server not found. Please check your API URL.'
		}
		if (upperMsg.includes('ERR_INTERNET_DISCONNECTED')) {
			return 'No internet connection.'
		}
		if (upperMsg.includes('NET::ERR_')) {
			const match = message.match(/net::(err_\w+)/i)
			if (match) {
				const code = match[1].replace('err_', '').replace(/_/g, ' ')
				return `Connection error: ${code}`
			}
		}

		// Handle common HTTP errors
		if (message.match(/^HTTP \d+: /)) {
			return message.replace(/^HTTP \d+: /, '').substring(0, 200)
		}

		// Remove JSON parsing artifacts
		if (message.includes('{') && message.includes('}')) {
			const cleaned = message
				.replace(/\{[^}]+\}:?\s*/g, '')
				.replace(/\s+/g, ' ')
				.trim()
			if (cleaned.length > 10) return cleaned
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
