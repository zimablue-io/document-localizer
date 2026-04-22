export interface ElectronAPI {
	openFile: (options?: { multiple?: boolean }) => Promise<string[] | null>
	readTextFile: (filePath: string) => Promise<string>
	writeTextFile: (filePath: string, content: string) => Promise<void>
	readFile: (filePath: string) => Promise<string>
	parsePdf: (filePath: string) => Promise<{ base64: string; size: number }>
	log: (message: string) => Promise<void>
	testConnection: (
		url: string
	) => Promise<{ status?: number; headers?: Record<string, string>; body?: string; error?: string }>
	generateAI: (options: {
		url: string
		body: object
	}) => Promise<{ content: string; error?: string; status?: number }>
}

declare global {
	interface Window {
		electron: ElectronAPI
	}
}
