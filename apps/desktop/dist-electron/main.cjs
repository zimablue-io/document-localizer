"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// For dev logging
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[electron]', ...args);
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Document Localizer',
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.cjs'),
        },
    });
    // For vite build (production), load from dist folder
    // For vite dev server, load from localhost
    const isDev = process.env.NODE_ENV !== 'production';
    console.log('[electron] NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev);
    console.log('[electron] __dirname:', __dirname);
    console.log('[electron] loading from:', isDev ? 'localhost:1420' : path_1.default.join(__dirname, '../dist/index.html'));
    if (isDev) {
        mainWindow.loadURL('http://localhost:1420');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC Handlers
electron_1.ipcMain.handle('dialog:openFile', async (_event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        multiple: true,
        filters: [{ name: 'Documents', extensions: ['pdf', 'md', 'markdown'] }],
        ...options,
    });
    return result.canceled ? null : result.filePaths;
});
electron_1.ipcMain.handle('fs:readTextFile', async (_event, filePath) => {
    return fs_1.default.readFileSync(filePath, 'utf-8');
});
electron_1.ipcMain.handle('fs:writeTextFile', async (_event, filePath, content) => {
    fs_1.default.writeFileSync(filePath, content, 'utf-8');
});
electron_1.ipcMain.handle('fs:readFile', async (_event, filePath) => {
    const buffer = fs_1.default.readFileSync(filePath);
    return buffer.toString('base64');
});
electron_1.ipcMain.handle('log', (_event, message) => {
    console.log(`[electron] ${message}`);
});
electron_1.ipcMain.handle('test-connection', async (_event, url) => {
    try {
        const response = await electron_1.net.fetch(url);
        const data = await response.json();
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return { status: response.status, headers, body: JSON.stringify(data).substring(0, 500) };
    }
    catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
});
electron_1.ipcMain.handle('pdf:parse', async (_event, filePath) => {
    const buffer = fs_1.default.readFileSync(filePath);
    // Return base64 encoded PDF for frontend processing
    return { base64: buffer.toString('base64'), size: buffer.length };
});
// AI Generation using Electron's net.fetch (Chromium networking)
electron_1.ipcMain.handle('ai:generate', async (_event, options) => {
    const { url, body } = options;
    log('ai:generate called, URL:', url);
    try {
        const response = await electron_1.net.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        log('Response status:', response.status);
        if (response.status !== 200) {
            const text = await response.text();
            return {
                content: '',
                error: `HTTP ${response.status}: ${text.substring(0, 500)}`,
                status: response.status,
            };
        }
        const data = (await response.json());
        const content = data.choices?.[0]?.message?.content || data.message?.content || data.content;
        if (!content) {
            log('No content extracted from response');
            return { content: '', error: 'No content in response', status: 200 };
        }
        log('Success, content length:', content.length);
        return { content, status: 200 };
    }
    catch (e) {
        log('Error:', e);
        return { content: '', error: e instanceof Error ? e.message : String(e) };
    }
});
