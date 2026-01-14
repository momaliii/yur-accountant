import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdir } from 'fs';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Keep a global reference of the window objects
let mainWindow;
let splashWindow;
let splashClosed = false; // Flag to prevent multiple close attempts

function createSplashWindow() {
  // Create splash screen window
  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Try to load splash from different locations (dev vs production)
  // In packaged app, files are in app.asar or app.asar.unpacked
  const splashPaths = [
    join(__dirname, 'splash.html'), // Development
    join(__dirname, '../electron/splash.html'), // Development alternative
    join(process.resourcesPath || __dirname, 'electron/splash.html'), // Packaged (unpacked)
    join(process.resourcesPath || __dirname, '../electron/splash.html'), // Packaged alternative
  ];
  
  let splashPath = splashPaths.find(path => existsSync(path));
  if (!splashPath) {
    // Last resort: try first path anyway
    splashPath = splashPaths[0];
    console.warn('Splash file not found in expected locations, using:', splashPath);
  }
  
  try {
    splashWindow.loadFile(splashPath);
  } catch (error) {
    console.error('Failed to load splash screen:', error);
    // If splash fails to load, just show main window immediately
    splashWindow.close();
    splashWindow = null;
  }
  splashWindow.center();
  splashWindow.show();
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0f172a', // Match dark theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: (() => {
        // Handle different paths for dev vs production
        // In packaged app, preload.js should be in app.asar.unpacked
        const preloadPaths = [
          join(__dirname, 'preload.js'), // Development
          join(__dirname, '../electron/preload.js'), // Development alternative
          join(process.resourcesPath || __dirname, 'electron/preload.js'), // Packaged (unpacked)
          join(process.resourcesPath || __dirname, '../electron/preload.js'), // Packaged alternative
        ];
        
        const preloadPath = preloadPaths.find(path => existsSync(path));
        if (preloadPath) {
          console.log('Using preload script at:', preloadPath);
          return preloadPath;
        }
        
        // Fallback
        const fallback = preloadPaths[0];
        console.warn('Preload script not found, using fallback:', fallback);
        return fallback;
      })(),
    },
    icon: join(__dirname, '../public/vite.svg'), // You can add a proper icon later
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    // In packaged app, dist is in app.asar, but loadFile handles it automatically
    const indexPath = join(__dirname, '../dist/index.html');
    
    console.log('Production mode - attempting to load:', indexPath);
    console.log('__dirname:', __dirname);
    console.log('File exists:', existsSync(indexPath));
    
    // loadFile automatically handles asar files, so this should work
    mainWindow.loadFile(indexPath).then(() => {
      console.log('Successfully loaded index.html from:', indexPath);
    }).catch((err) => {
      console.error('Failed to load index.html:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      // Fallback: try loading with URL
      const fileUrl = `file://${indexPath}`;
      console.log('Trying fallback URL load:', fileUrl);
      mainWindow.loadURL(fileUrl).catch((urlErr) => {
        console.error('URL load also failed:', urlErr);
      });
    });
  }

  // Function to close splash and show main window
  const closeSplashAndShowMain = () => {
    if (splashClosed) {
      console.log('Splash already closed, skipping');
      return; // Already closed
    }
    splashClosed = true;
    console.log('Closing splash and showing main window');
    
    try {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
        console.log('Splash window closed');
      }
    } catch (error) {
      console.error('Error closing splash window:', error);
    }
    
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        console.log('Main window shown and focused');
      } else {
        console.error('Main window is null or destroyed');
      }
    } catch (error) {
      console.error('Error showing main window:', error);
    }
  };

  // Track if we've received the app-ready signal
  let appReadyReceived = false;

  // Listen for app ready signal from renderer (preferred method)
  ipcMain.on('app-ready', () => {
    appReadyReceived = true;
    setTimeout(() => {
      closeSplashAndShowMain();
    }, 500);
  });

  // File system IPC handlers
  ipcMain.handle('get-path', async (event, name) => {
    return app.getPath(name || 'userData');
  });

  ipcMain.handle('read-file', async (event, filePath, encoding = 'utf8') => {
    try {
      const data = await fs.readFile(filePath, encoding);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  });

  ipcMain.handle('write-file', async (event, filePath, data, encoding = 'utf8') => {
    try {
      // Ensure directory exists
      const dir = dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, data, encoding);
      return true;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('mkdir', async (event, dirPath, options = {}) => {
    try {
      await fs.mkdir(dirPath, { recursive: true, ...options });
      return true;
    } catch (error) {
      throw error;
    }
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Main window ready-to-show event fired');
    // Wait a bit for app initialization, then show main window and close splash
    // This is a fallback in case app-ready signal doesn't arrive
    setTimeout(() => {
      if (!appReadyReceived) {
        // If we haven't received app-ready signal, close splash anyway
        console.log('App-ready signal not received, using fallback (ready-to-show)');
        closeSplashAndShowMain();
      }
    }, 3000); // Shorter timeout (3 seconds)
  });

  // Additional safety: Close splash after main window loads (even if signal doesn't come)
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Main window did-finish-load event fired');
    setTimeout(() => {
      if (!appReadyReceived) {
        console.log('Main window loaded but app-ready not received, closing splash (did-finish-load)');
        closeSplashAndShowMain();
      }
    }, 1500); // Shorter delay
  });

  // Emergency fallback: Always show window after maximum wait time
  setTimeout(() => {
    if (!splashClosed) {
      console.log('Emergency fallback: Forcing window to show after 5 seconds');
      closeSplashAndShowMain();
    }
  }, 5000);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Debug: Log when page fails to load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // Debug: Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  // DevTools disabled in production
  // Uncomment the line below if you need to debug production builds
  // if (!isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'close', label: 'Close' },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide ' + app.getName() },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit ' + app.getName() },
      ],
    });

    // Window menu
    template[3].submenu = [
      { role: 'close', label: 'Close' },
      { role: 'minimize', label: 'Minimize' },
      { role: 'zoom', label: 'Zoom' },
      { type: 'separator' },
      { role: 'front', label: 'Bring All to Front' },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app ready');
  // Show splash screen first
  createSplashWindow();
  
  // Create main window (hidden initially)
  createWindow();
  createMenu();

  // Safety: Ensure window shows after maximum wait
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible() && !mainWindow.isDestroyed()) {
      console.log('Safety timeout: Forcing main window to show');
      closeSplashAndShowMain();
    }
  }, 6000); // 6 second absolute maximum

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      splashClosed = false; // Reset flag
      createSplashWindow();
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

