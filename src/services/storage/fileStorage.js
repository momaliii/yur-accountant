// File-based storage service
// Works in Electron, Capacitor, and Browser

const DATA_FILE_NAME = 'yur-accountant-data.json';
const BACKUP_DIR = 'yur-accountant-backups';

// Detect environment
const isElectron = () => {
  return !!(window.electron || (typeof window !== 'undefined' && window.process && window.process.type === 'renderer'));
};

const isCapacitor = () => {
  return !!(typeof window !== 'undefined' && window.Capacitor);
};

const isBrowser = () => {
  return !isElectron() && !isCapacitor();
};

// Get file path for Electron
const getElectronDataPath = () => {
  if (!isElectron()) return null;
  
  try {
    // Try to get path from Electron API
    if (window.electron && typeof window.electron.getPath === 'function') {
      return window.electron.getPath('userData');
    }
    
    // Fallback: use app.getPath via IPC
    if (window.electron && typeof window.electron.invoke === 'function') {
      return window.electron.invoke('get-user-data-path');
    }
  } catch (error) {
    console.error('Error getting Electron data path:', error);
  }
  
  return null;
};

// File Storage Service
class FileStorageService {
  constructor() {
    this.dataPath = null;
    this.backupPath = null;
    this.autoSaveEnabled = true;
    this.saveDebounceTimer = null;
    this.saveDelay = 1000; // Save 1 second after last change
  }

  // Initialize file storage
  async initialize() {
    if (isElectron()) {
      await this.initializeElectron();
    } else if (isCapacitor()) {
      await this.initializeCapacitor();
    } else {
      await this.initializeBrowser();
    }
  }

  // Initialize for Electron
  async initializeElectron() {
    try {
      const userDataPath = getElectronDataPath();
      if (!userDataPath) {
        console.warn('Could not get Electron user data path');
        return;
      }

      const path = window.electron?.join || ((...parts) => parts.join('/'));
      this.dataPath = path(userDataPath, DATA_FILE_NAME);
      this.backupPath = path(userDataPath, BACKUP_DIR);

      // Ensure backup directory exists
      if (window.electron && typeof window.electron.mkdir === 'function') {
        await window.electron.mkdir(this.backupPath, { recursive: true });
      } else if (window.electron && typeof window.electron.invoke === 'function') {
        await window.electron.invoke('mkdir', this.backupPath, { recursive: true });
      }

      console.log('Electron file storage initialized:', this.dataPath);
    } catch (error) {
      console.error('Error initializing Electron file storage:', error);
    }
  }

  // Initialize for Capacitor
  async initializeCapacitor() {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;
      
      // Use Documents directory for iOS/Android
      this.dataPath = DATA_FILE_NAME;
      this.backupPath = BACKUP_DIR;

      // Ensure backup directory exists
      try {
        await Filesystem.mkdir({
          path: BACKUP_DIR,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (error) {
        // Directory might already exist
        console.log('Backup directory check:', error.message);
      }

      console.log('Capacitor file storage initialized');
    } catch (error) {
      console.error('Error initializing Capacitor file storage:', error);
    }
  }

  // Initialize for Browser
  async initializeBrowser() {
    // Browser uses IndexedDB as primary storage
    // File storage is optional (manual export/import)
    console.log('Browser mode: Using IndexedDB as primary storage');
    this.dataPath = null; // No automatic file saving in browser
  }

  // Save data to file
  async save(data) {
    if (!this.autoSaveEnabled) return;

    try {
      if (isElectron()) {
        await this.saveElectron(data);
      } else if (isCapacitor()) {
        await this.saveCapacitor(data);
      } else {
        // Browser: trigger download
        await this.saveBrowser(data);
      }
    } catch (error) {
      console.error('Error saving to file:', error);
    }
  }

  // Save in Electron
  async saveElectron(data) {
    if (!this.dataPath) return;

    try {
      const jsonData = JSON.stringify(data, null, 2);
      
      if (window.electron && typeof window.electron.writeFile === 'function') {
        await window.electron.writeFile(this.dataPath, jsonData, 'utf8');
      } else if (window.electron && typeof window.electron.invoke === 'function') {
        await window.electron.invoke('write-file', this.dataPath, jsonData);
      } else {
        // Fallback: use require (if available)
        const fs = window.require?.('fs');
        const path = window.require?.('path');
        if (fs && path) {
          await fs.promises.writeFile(this.dataPath, jsonData, 'utf8');
        }
      }

      console.log('Data saved to file:', this.dataPath);
    } catch (error) {
      console.error('Error saving to Electron file:', error);
    }
  }

  // Save in Capacitor
  async saveCapacitor(data) {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;
      const jsonData = JSON.stringify(data, null, 2);

      await Filesystem.writeFile({
        path: this.dataPath,
        data: jsonData,
        directory: Directory.Documents,
        encoding: 'utf8',
      });

      console.log('Data saved to Capacitor file:', this.dataPath);
    } catch (error) {
      console.error('Error saving to Capacitor file:', error);
    }
  }

  // Save in Browser (download file)
  async saveBrowser(data) {
    // Browser: Create download link
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = DATA_FILE_NAME;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also save to localStorage as backup
    try {
      localStorage.setItem('yur-accountant-backup', jsonData);
      localStorage.setItem('yur-accountant-backup-time', new Date().toISOString());
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  // Load data from file
  async load() {
    try {
      if (isElectron()) {
        return await this.loadElectron();
      } else if (isCapacitor()) {
        return await this.loadCapacitor();
      } else {
        return await this.loadBrowser();
      }
    } catch (error) {
      console.error('Error loading from file:', error);
      return null;
    }
  }

  // Load from Electron
  async loadElectron() {
    if (!this.dataPath) return null;

    try {
      let fileData;

      if (window.electron && typeof window.electron.readFile === 'function') {
        fileData = await window.electron.readFile(this.dataPath, 'utf8');
      } else if (window.electron && typeof window.electron.invoke === 'function') {
        fileData = await window.electron.invoke('read-file', this.dataPath);
      } else {
        // Fallback: use require
        const fs = window.require?.('fs');
        if (fs) {
          fileData = await fs.promises.readFile(this.dataPath, 'utf8');
        }
      }

      if (fileData) {
        const data = JSON.parse(fileData);
        console.log('Data loaded from Electron file');
        return data;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading from Electron file:', error);
      }
    }

    return null;
  }

  // Load from Capacitor
  async loadCapacitor() {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;

      try {
        const result = await Filesystem.readFile({
          path: this.dataPath,
          directory: Directory.Documents,
          encoding: 'utf8',
        });

        if (result.data) {
          const data = JSON.parse(result.data);
          console.log('Data loaded from Capacitor file');
          return data;
        }
      } catch (error) {
        if (error.message && !error.message.includes('File does not exist')) {
          console.error('Error loading from Capacitor file:', error);
        }
      }
    } catch (error) {
      console.error('Error in Capacitor load:', error);
    }

    return null;
  }

  // Load from Browser
  async loadBrowser() {
    // Try to load from localStorage backup
    try {
      const backup = localStorage.getItem('yur-accountant-backup');
      if (backup) {
        const data = JSON.parse(backup);
        console.log('Data loaded from browser localStorage backup');
        return data;
      }
    } catch (error) {
      console.error('Error loading from browser localStorage:', error);
    }

    return null;
  }

  // Debounced save (saves after delay)
  debouncedSave(data) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.save(data);
    }, this.saveDelay);
  }

  // Enable/disable auto-save
  setAutoSave(enabled) {
    this.autoSaveEnabled = enabled;
  }

  // Create backup with timestamp
  async createBackup(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;

    try {
      if (isElectron()) {
        const path = window.electron?.join || ((...parts) => parts.join('/'));
        const backupPath = path(this.backupPath, backupFileName);
        const jsonData = JSON.stringify(data, null, 2);

        if (window.electron && typeof window.electron.writeFile === 'function') {
          await window.electron.writeFile(backupPath, jsonData, 'utf8');
        } else if (window.electron && typeof window.electron.invoke === 'function') {
          await window.electron.invoke('write-file', backupPath, jsonData);
        }

        console.log('Backup created:', backupPath);
        return backupPath;
      } else if (isCapacitor()) {
        const { Filesystem, Directory } = window.Capacitor.Plugins;
        const jsonData = JSON.stringify(data, null, 2);

        await Filesystem.writeFile({
          path: `${this.backupPath}/${backupFileName}`,
          data: jsonData,
          directory: Directory.Documents,
          encoding: 'utf8',
        });

        console.log('Backup created in Capacitor');
        return `${this.backupPath}/${backupFileName}`;
      } else {
        // Browser: download backup
        await this.saveBrowser(data);
        return backupFileName;
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
}

// Export singleton instance
const fileStorage = new FileStorageService();
export default fileStorage;
