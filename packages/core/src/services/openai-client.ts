export class OpenAIClient {
	constructor(
		public readonly baseUrl: string,
		public readonly model: string,
		private readonly timeoutMs: number = 300000,
		private readonly useStreaming: boolean = true
	) {}

	public buildChatUrl(): string {
		if (this.baseUrl.includes(':8080') || this.baseUrl.includes(':11434')) {
			if (this.baseUrl.endsWith('/api/chat') || this.baseUrl.includes(':11434/api')) {
				return this.baseUrl
			}
			if (this.baseUrl.endsWith('/v1')) {
				return `${this.baseUrl}/chat/completions`
			}
			return `${this.baseUrl}/v1/chat/completions`
		}
		if (this.baseUrl.includes('/v1') || this.baseUrl.includes('/api')) {
			return this.baseUrl
		}
		return `${this.baseUrl}/v1/chat/completions`
	}

	private async log(msg: string) {
		console.log(msg)
	}

	async generate(systemPrompt: string, userPrompt: string): Promise<string> {
		const url = this.buildChatUrl()
		const body = {
			model: this.model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
			temperature: 0.2,
			max_tokens: 4096,
			stream: this.useStreaming,
		}
		const bodyStr = JSON.stringify(body)

		await this.log(`[AI] URL: ${url}`)
		await this.log(`[AI] Streaming: ${this.useStreaming}`)

		try {
			if (this.useStreaming) {
				const content = await this.streamingFetch(url, bodyStr)
				return content
			} else {
				const content = await this.simpleFetch(url, bodyStr)
				return content
			}
		} catch (err) {
			await this.log(`[AI] Error: ${err instanceof Error ? err.message : String(err)}`)
			throw err
		}
	}

	private async simpleFetch(url: string, body: string): Promise<string> {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				signal: controller.signal,
			})
			const text = await response.text()
			const parsed = JSON.parse(text)
			const content = parsed.choices?.[0]?.message?.content || parsed.message?.content || parsed.content
			if (!content) throw new Error('No content in response')
			return content.trim()
		} finally {
			clearTimeout(timeout)
		}
	}

	private async streamingFetch(url: string, body: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const controller = new AbortController()
			const timeout = setTimeout(() => {
				controller.abort()
			}, this.timeoutMs)

			let fullResponse = ''

			fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				signal: controller.signal,
			})
				.then(async (response) => {
					if (!response.ok) {
						const text = await response.text()
						throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`)
					}

					const reader = response.body?.getReader()
					if (!reader) throw new Error('No response body')

					const decoder = new TextDecoder()

					const read = () => {
						reader
							.read()
							.then(({ done, value }) => {
								if (done) {
									clearTimeout(timeout)
									// Parse final SSE response
									const lines = fullResponse.split('\n')
									let content = ''
									for (const line of lines) {
										if (line.startsWith('data: ')) {
											const data = line.slice(6).trim()
											if (data === '[DONE]') break
											try {
												const parsed = JSON.parse(data)
												if (parsed.choices?.[0]?.delta?.content) {
													content += parsed.choices[0].delta.content
												}
											} catch {
												/* skip */
											}
										}
									}
									if (!content) throw new Error('No content in SSE response')
									resolve(content.trim())
									return
								}

								const chunk = decoder.decode(value, { stream: true })
								fullResponse += chunk
								read()
							})
							.catch(reject)
					}

					read()
				})
				.catch((err) => {
					clearTimeout(timeout)
					reject(err)
				})
		})
	}
}

export { OpenAIClient as Client }
