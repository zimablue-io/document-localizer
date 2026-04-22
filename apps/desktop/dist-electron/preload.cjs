"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    openFile: (options) => electron_1.ipcRenderer.invoke('dialog:openFile', options),
    readTextFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readTextFile', filePath),
    writeTextFile: (filePath, content) => electron_1.ipcRenderer.invoke('fs:writeTextFile', filePath, content),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
    parsePdf: (filePath) => electron_1.ipcRenderer.invoke('pdf:parse', filePath),
    log: (message) => electron_1.ipcRenderer.invoke('log', message),
    testConnection: (url) => electron_1.ipcRenderer.invoke('test-connection', url),
    generateAI: (options) => electron_1.ipcRenderer.invoke('ai:generate', options),
});
