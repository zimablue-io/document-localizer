import { app, BrowserWindow, dialog, ipcMain, net } from 'electron'
import fs from 'fs'
import path from 'path'

// For dev logging
const DEBUG = true
const log = (...args: unknown[]) => DEBUG && console.log('[electron]', ...args)

let mainWindow: BrowserWindow | null = null

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		title: 'Document Localizer',
		backgroundColor: '#0a0a0f',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.cjs'),
		},
	})

	// For vite build (production), load from dist folder
	// For vite dev server, load from localhost
	const isDev = process.env.NODE_ENV !== 'production'
	console.log('[electron] NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev)
	console.log('[electron] __dirname:', __dirname)
	console.log('[electron] loading from:', isDev ? 'localhost:1420' : path.join(__dirname, '../dist/index.html'))

	if (isDev) {
		mainWindow.loadURL('http://localhost:1420')
		mainWindow.webContents.openDevTools()
	} else {
		mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
	}

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// IPC Handlers

// File validation for drag and drop
const ALLOWED_EXTENSIONS = ['pdf', 'md', 'markdown']

function isValidFilePath(filePath: string): boolean {
	const ext = path.extname(filePath).toLowerCase().replace('.', '')
	return ALLOWED_EXTENSIONS.includes(ext)
}

ipcMain.handle('dialog:validateFilePaths', async (_event, filePaths: string[]) => {
	const validPaths = filePaths.filter(isValidFilePath)
	return {
		valid: validPaths,
		invalid: filePaths.filter((p) => !isValidFilePath(p)),
	}
})

// Handle drag and drop from UI - receive file paths and validate
ipcMain.handle('dialog:handleFileDrop', async (_event, filePaths: string[]) => {
	const validPaths = filePaths.filter(isValidFilePath)
	return {
		valid: validPaths,
		invalid: filePaths.filter((p) => !isValidFilePath(p)),
	}
})

ipcMain.handle('dialog:openFile', async (_event, options) => {
	if (!mainWindow) return null
	const result = await dialog.showOpenDialog(mainWindow, {
		multiple: true,
		filters: [{ name: 'Documents', extensions: ['pdf', 'md', 'markdown'] }],
		...options,
	})
	return result.canceled ? null : result.filePaths
})

ipcMain.handle('fs:readTextFile', async (_event, filePath) => {
	return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('fs:writeTextFile', async (_event, filePath, content) => {
	fs.writeFileSync(filePath, content, 'utf-8')
})

ipcMain.handle('fs:readFile', async (_event, filePath) => {
	const buffer = fs.readFileSync(filePath)
	return buffer.toString('base64')
})

ipcMain.handle('log', (_event, message) => {
	console.log(`[electron] ${message}`)
})

ipcMain.handle('test-connection', async (_event, url: string) => {
	try {
		const response = await net.fetch(url)
		const data = await response.json()
		const headers: Record<string, string> = {}
		response.headers.forEach((value, key) => {
			headers[key] = value
		})
		return { status: response.status, headers, body: JSON.stringify(data).substring(0, 500) }
	} catch (e: unknown) {
		return { error: e instanceof Error ? e.message : String(e) }
	}
})

ipcMain.handle('pdf:parse', async (_event, filePath) => {
	const buffer = fs.readFileSync(filePath)
	// Return base64 encoded PDF for frontend processing
	return { base64: buffer.toString('base64'), size: buffer.length }
})

// Settings persistence using JSON file
const settingsFilePath = path.join(app.getPath('userData'), 'settings.json')

interface HistoryEntry {
	id: string
	fileName: string
	filePath: string
	sourceLocale: string
	targetLocale: string
	processedAt: string
	status: 'processed' | 'approved' | 'rejected' | 'error'
	errorMessage?: string
	chunksProcessed?: number
}

function ensureUserDataDir(): void {
	const userDataPath = app.getPath('userData')
	if (!fs.existsSync(userDataPath)) {
		fs.mkdirSync(userDataPath, { recursive: true })
	}
}

ipcMain.handle('settings:load', async () => {
	try {
		ensureUserDataDir()
		if (fs.existsSync(settingsFilePath)) {
			const data = fs.readFileSync(settingsFilePath, 'utf-8')
			return JSON.parse(data)
		}
	} catch (e) {
		log('Error loading settings:', e)
	}
	return null
})

ipcMain.handle('settings:save', async (_event, settings) => {
	try {
		ensureUserDataDir()
		fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8')
		log('Settings saved to:', settingsFilePath)
		return true
	} catch (e) {
		log('Error saving settings:', e)
		return false
	}
})

// History persistence using JSON file
const historyFilePath = path.join(app.getPath('userData'), 'history.json')
const MAX_HISTORY_ITEMS = 100

ipcMain.handle('history:get', async () => {
	try {
		ensureUserDataDir()
		if (fs.existsSync(historyFilePath)) {
			const data = fs.readFileSync(historyFilePath, 'utf-8')
			return JSON.parse(data)
		}
	} catch (e) {
		log('Error loading history:', e)
	}
	return []
})

ipcMain.handle('history:add', async (_event, entry: Omit<HistoryEntry, 'id'>) => {
	try {
		ensureUserDataDir()
		const history: HistoryEntry[] = fs.existsSync(historyFilePath)
			? JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'))
			: []

		const newEntry: HistoryEntry = {
			...entry,
			id: crypto.randomUUID(),
		}
		history.unshift(newEntry)
		fs.writeFileSync(historyFilePath, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS), null, 2), 'utf-8')
		return newEntry
	} catch (e) {
		log('Error adding history entry:', e)
		return null
	}
})

ipcMain.handle('history:update', async (_event, id: string, updates: Partial<HistoryEntry>) => {
	try {
		ensureUserDataDir()
		if (!fs.existsSync(historyFilePath)) return null

		const history: HistoryEntry[] = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'))
		const index = history.findIndex((h) => h.id === id)
		if (index !== -1) {
			history[index] = { ...history[index], ...updates }
			fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8')
			return history[index]
		}
		return null
	} catch (e) {
		log('Error updating history entry:', e)
		return null
	}
})

ipcMain.handle('history:clear', async () => {
	try {
		ensureUserDataDir()
		fs.writeFileSync(historyFilePath, JSON.stringify([], null, 2), 'utf-8')
		return true
	} catch (e) {
		log('Error clearing history:', e)
		return false
	}
})

// AI Generation using Electron's net.fetch (Chromium networking)
ipcMain.handle(
	'ai:generate',
	async (
		_event,
		options: { url: string; body: object }
	): Promise<{ content: string; error?: string; status?: number }> => {
		const { url, body } = options
		log('ai:generate called, URL:', url)

		try {
			const response = await net.fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			log('Response status:', response.status)

			if (response.status !== 200) {
				const text = await response.text()
				return {
					content: '',
					error: `HTTP ${response.status}: ${text.substring(0, 500)}`,
					status: response.status,
				}
			}

			const data = (await response.json()) as {
				choices?: Array<{ message?: { content?: string } }>
				message?: { content?: string }
				content?: string
			}
			const content = data.choices?.[0]?.message?.content || data.message?.content || data.content

			if (!content) {
				log('No content extracted from response')
				return { content: '', error: 'No content in response', status: 200 }
			}

			log('Success, content length:', content.length)
			return { content, status: 200 }
		} catch (e) {
			log('Error:', e)
			return { content: '', error: e instanceof Error ? e.message : String(e) }
		}
	}
)
