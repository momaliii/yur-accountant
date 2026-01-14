const { contextBridge, ipcRenderer } = require('electron');
const path = require('path').join || ((...parts) => parts.join('/'));

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['app-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['app-ready'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // File system operations
  getPath: (name) => {
    return ipcRenderer.invoke('get-path', name);
  },
  readFile: async (filePath, encoding = 'utf8') => {
    return await ipcRenderer.invoke('read-file', filePath, encoding);
  },
  writeFile: async (filePath, data, encoding = 'utf8') => {
    return await ipcRenderer.invoke('write-file', filePath, data, encoding);
  },
  mkdir: async (dirPath, options = {}) => {
    return await ipcRenderer.invoke('mkdir', dirPath, options);
  },
  join: (...paths) => {
    return path.join(...paths);
  },
});

