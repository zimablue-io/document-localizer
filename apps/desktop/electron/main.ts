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
