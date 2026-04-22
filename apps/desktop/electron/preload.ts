import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
	openFile: (options?: { multiple?: boolean }) => ipcRenderer.invoke('dialog:openFile', options),

	readTextFile: (filePath: string) => ipcRenderer.invoke('fs:readTextFile', filePath),

	writeTextFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeTextFile', filePath, content),

	readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),

	parsePdf: (filePath: string) => ipcRenderer.invoke('pdf:parse', filePath),

	log: (message: string) => ipcRenderer.invoke('log', message),

	testConnection: (url: string) => ipcRenderer.invoke('test-connection', url),

	generateAI: (options: { url: string; body: object }) => ipcRenderer.invoke('ai:generate', options),
})
