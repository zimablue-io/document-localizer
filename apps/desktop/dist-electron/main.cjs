"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
// For dev logging
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[electron]', ...args);
// Auto-updater setup
function setupAutoUpdater() {
    // Disable auto-download - we'll prompt user first
    electron_updater_1.autoUpdater.autoDownload = false;
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        log('Checking for updates...');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        log('Update available:', info.version);
        // Prompt user to download
        if (mainWindow) {
            electron_1.dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `A new version (${info.version}) is available. Would you like to download it now?`,
                buttons: ['Download', 'Later'],
            }).then((result) => {
                if (result.response === 0) {
                    electron_updater_1.autoUpdater.downloadUpdate();
                }
            });
        }
    });
    electron_updater_1.autoUpdater.on('update-not-available', () => {
        log('No updates available');
    });
    electron_updater_1.autoUpdater.on('download-progress', (progress) => {
        log(`Download progress: ${progress.percent.toFixed(1)}%`);
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        log('Update downloaded');
        if (mainWindow) {
            electron_1.dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to install the update.',
                buttons: ['Restart Now', 'Later'],
            }).then((result) => {
                if (result.response === 0) {
                    electron_updater_1.autoUpdater.quitAndInstall();
                }
            });
        }
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        log('Auto-updater error:', err.message);
        // Don't crash the app if auto-updater fails
    });
}
// Check for updates (skip in dev mode)
function checkForUpdates() {
    if (process.env.NODE_ENV === 'production') {
        electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
            log('Update check failed (this is normal if not published yet):', err.message);
        });
    }
}
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
            preload: node_path_1.default.join(__dirname, 'preload.cjs'),
        },
    });
    // For vite build (production), load from dist folder
    // For vite dev server, load from localhost
    const isDev = !electron_1.app.isPackaged;
    console.log('[electron] isPackaged:', electron_1.app.isPackaged, 'isDev:', isDev);
    console.log('[electron] __dirname:', __dirname);
    console.log('[electron] loading from:', isDev ? 'localhost:1420' : node_path_1.default.join(__dirname, '../dist/index.html'));
    if (isDev) {
        mainWindow.loadURL('http://localhost:1420');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(node_path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();
    checkForUpdates();
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
// File validation for drag and drop
const ALLOWED_EXTENSIONS = ['pdf', 'md', 'markdown'];
function isValidFilePath(filePath) {
    const ext = node_path_1.default.extname(filePath).toLowerCase().replace('.', '');
    return ALLOWED_EXTENSIONS.includes(ext);
}
electron_1.ipcMain.handle('dialog:validateFilePaths', async (_event, filePaths) => {
    const validPaths = filePaths.filter(isValidFilePath);
    return {
        valid: validPaths,
        invalid: filePaths.filter((p) => !isValidFilePath(p)),
    };
});
// Handle drag and drop from UI - receive file paths and validate
electron_1.ipcMain.handle('dialog:handleFileDrop', async (_event, filePaths) => {
    const validPaths = filePaths.filter(isValidFilePath);
    return {
        valid: validPaths,
        invalid: filePaths.filter((p) => !isValidFilePath(p)),
    };
});
electron_1.ipcMain.handle('dialog:openFile', async (_event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Documents', extensions: ['pdf', 'md', 'markdown'] }],
        ...options,
    });
    return result.canceled ? null : result.filePaths;
});
electron_1.ipcMain.handle('dialog:saveFile', async (_event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Markdown', extensions: ['md'] }],
        ...options,
    });
    return result.canceled ? null : result.filePath;
});
electron_1.ipcMain.handle('fs:readTextFile', async (_event, filePath) => {
    return node_fs_1.default.readFileSync(filePath, 'utf-8');
});
electron_1.ipcMain.handle('fs:writeTextFile', async (_event, filePath, content) => {
    node_fs_1.default.writeFileSync(filePath, content, 'utf-8');
});
electron_1.ipcMain.handle('fs:writeBase64File', async (_event, filePath, base64) => {
    const buffer = Buffer.from(base64, 'base64');
    node_fs_1.default.writeFileSync(filePath, buffer);
});
electron_1.ipcMain.handle('fs:readFile', async (_event, filePath) => {
    const buffer = node_fs_1.default.readFileSync(filePath);
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
    const buffer = node_fs_1.default.readFileSync(filePath);
    // Return base64 encoded PDF for frontend processing
    return { base64: buffer.toString('base64'), size: buffer.length };
});
// Settings persistence using JSON file
const settingsFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'settings.json');
function ensureUserDataDir() {
    const userDataPath = electron_1.app.getPath('userData');
    if (!node_fs_1.default.existsSync(userDataPath)) {
        node_fs_1.default.mkdirSync(userDataPath, { recursive: true });
    }
}
electron_1.ipcMain.handle('settings:load', async () => {
    try {
        ensureUserDataDir();
        if (node_fs_1.default.existsSync(settingsFilePath)) {
            const data = node_fs_1.default.readFileSync(settingsFilePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        log('Error loading settings:', e);
    }
    return null;
});
electron_1.ipcMain.handle('settings:save', async (_event, settings) => {
    try {
        ensureUserDataDir();
        node_fs_1.default.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
        log('Settings saved to:', settingsFilePath);
        return true;
    }
    catch (e) {
        log('Error saving settings:', e);
        return false;
    }
});
// History persistence using JSON file
const historyFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'history.json');
const MAX_HISTORY_ITEMS = 100;
electron_1.ipcMain.handle('history:get', async () => {
    try {
        ensureUserDataDir();
        if (node_fs_1.default.existsSync(historyFilePath)) {
            const data = node_fs_1.default.readFileSync(historyFilePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        log('Error loading history:', e);
    }
    return [];
});
electron_1.ipcMain.handle('history:add', async (_event, entry) => {
    try {
        ensureUserDataDir();
        const history = node_fs_1.default.existsSync(historyFilePath)
            ? JSON.parse(node_fs_1.default.readFileSync(historyFilePath, 'utf-8'))
            : [];
        const newEntry = {
            ...entry,
            id: crypto.randomUUID(),
        };
        history.unshift(newEntry);
        node_fs_1.default.writeFileSync(historyFilePath, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS), null, 2), 'utf-8');
        return newEntry;
    }
    catch (e) {
        log('Error adding history entry:', e);
        return null;
    }
});
electron_1.ipcMain.handle('history:update', async (_event, id, updates) => {
    try {
        ensureUserDataDir();
        if (!node_fs_1.default.existsSync(historyFilePath))
            return null;
        const history = JSON.parse(node_fs_1.default.readFileSync(historyFilePath, 'utf-8'));
        const index = history.findIndex((h) => h.id === id);
        if (index !== -1) {
            history[index] = { ...history[index], ...updates };
            node_fs_1.default.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
            return history[index];
        }
        return null;
    }
    catch (e) {
        log('Error updating history entry:', e);
        return null;
    }
});
electron_1.ipcMain.handle('history:clear', async () => {
    try {
        ensureUserDataDir();
        node_fs_1.default.writeFileSync(historyFilePath, JSON.stringify([], null, 2), 'utf-8');
        return true;
    }
    catch (e) {
        log('Error clearing history:', e);
        return false;
    }
});
electron_1.ipcMain.handle('uploaded:load', async () => {
    try {
        ensureUserDataDir();
        const uploadedFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'uploaded.json');
        if (node_fs_1.default.existsSync(uploadedFilePath)) {
            const data = node_fs_1.default.readFileSync(uploadedFilePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        log('Error loading uploaded docs:', e);
    }
    return [];
});
electron_1.ipcMain.handle('uploaded:save', async (_event, documents) => {
    try {
        ensureUserDataDir();
        const uploadedFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'uploaded.json');
        node_fs_1.default.writeFileSync(uploadedFilePath, JSON.stringify(documents, null, 2), 'utf-8');
        log('Uploaded docs saved to:', uploadedFilePath);
        return true;
    }
    catch (e) {
        log('Error saving uploaded docs:', e);
        return false;
    }
});
electron_1.ipcMain.handle('processed:load', async () => {
    try {
        ensureUserDataDir();
        const processedFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'processed.json');
        if (node_fs_1.default.existsSync(processedFilePath)) {
            const data = node_fs_1.default.readFileSync(processedFilePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        log('Error loading processed docs:', e);
    }
    return [];
});
electron_1.ipcMain.handle('processed:save', async (_event, documents) => {
    try {
        ensureUserDataDir();
        const processedFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'processed.json');
        node_fs_1.default.writeFileSync(processedFilePath, JSON.stringify(documents, null, 2), 'utf-8');
        log('Processed docs saved to:', processedFilePath);
        return true;
    }
    catch (e) {
        log('Error saving processed docs:', e);
        return false;
    }
});
// Tasks persistence (active processing outputs) using JSON file
const tasksFilePath = node_path_1.default.join(electron_1.app.getPath('userData'), 'tasks.json');
electron_1.ipcMain.handle('tasks:load', async () => {
    try {
        ensureUserDataDir();
        if (node_fs_1.default.existsSync(tasksFilePath)) {
            const data = node_fs_1.default.readFileSync(tasksFilePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        log('Error loading tasks docs:', e);
    }
    return [];
});
electron_1.ipcMain.handle('tasks:save', async (_event, documents) => {
    try {
        ensureUserDataDir();
        node_fs_1.default.writeFileSync(tasksFilePath, JSON.stringify(documents, null, 2), 'utf-8');
        log('Tasks docs saved to:', tasksFilePath);
        return true;
    }
    catch (e) {
        log('Error saving tasks docs:', e);
        return false;
    }
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        log('Error message details:', JSON.stringify(e));
        // Clean up Chrome network errors for better UX
        let userMessage = errorMessage;
        if (errorMessage.includes('ERR_EMPTY_RESPONSE')) {
            userMessage = 'Server did not respond. Please check if your AI server is running.';
        }
        else if (errorMessage.includes('ERR_CONNECTION_REFUSED')) {
            userMessage = 'Could not connect to server. Please verify your API URL in settings.';
        }
        else if (errorMessage.includes('ERR_CONNECTION_TIMED_OUT')) {
            userMessage = 'Connection timed out. The server may be busy or unreachable.';
        }
        else if (errorMessage.includes('net::ERR_')) {
            userMessage = `Connection error: ${errorMessage.replace('net::ERR_', '').replace(/_/g, ' ').toLowerCase()}`;
        }
        log('User-facing error:', userMessage);
        return { content: '', error: userMessage };
    }
});
