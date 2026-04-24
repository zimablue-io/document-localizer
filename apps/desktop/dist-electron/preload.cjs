"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    openFile: (options) => electron_1.ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => electron_1.ipcRenderer.invoke('dialog:saveFile', options),
    getDroppedFilePaths: (files) => {
        return files.map((file) => electron_1.webUtils.getPathForFile(file));
    },
    readTextFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readTextFile', filePath),
    writeTextFile: (filePath, content) => electron_1.ipcRenderer.invoke('fs:writeTextFile', filePath, content),
    writeBase64File: (filePath, base64) => electron_1.ipcRenderer.invoke('fs:writeBase64File', filePath, base64),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
    parsePdf: (filePath) => electron_1.ipcRenderer.invoke('pdf:parse', filePath),
    log: (message) => electron_1.ipcRenderer.invoke('log', message),
    testConnection: (url) => electron_1.ipcRenderer.invoke('test-connection', url),
    generateAI: (options) => electron_1.ipcRenderer.invoke('ai:generate', options),
    loadSettings: () => electron_1.ipcRenderer.invoke('settings:load'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('settings:save', settings),
    getHistory: () => electron_1.ipcRenderer.invoke('history:get'),
    addHistory: (entry) => electron_1.ipcRenderer.invoke('history:add', entry),
    updateHistory: (id, updates) => electron_1.ipcRenderer.invoke('history:update', id, updates),
    clearHistory: () => electron_1.ipcRenderer.invoke('history:clear'),
    loadUploaded: () => electron_1.ipcRenderer.invoke('uploaded:load'),
    saveUploaded: (documents) => electron_1.ipcRenderer.invoke('uploaded:save', documents),
    loadTasks: () => electron_1.ipcRenderer.invoke('tasks:load'),
    saveTasks: (documents) => electron_1.ipcRenderer.invoke('tasks:save', documents),
    loadProcessed: () => electron_1.ipcRenderer.invoke('processed:load'),
    saveProcessed: (documents) => electron_1.ipcRenderer.invoke('processed:save', documents),
});
