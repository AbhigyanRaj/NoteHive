const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

const isDev = process.argv.includes('--dev');
const BACKEND_PORT = 5001;
const FRONTEND_PORT = isDev ? 5173 : null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  const startUrl = isDev 
    ? `http://localhost:${FRONTEND_PORT}` 
    : `http://localhost:${BACKEND_PORT}`;
  
  mainWindow.loadURL(startUrl);

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting embedded backend server for desktop app...');
    startEmbeddedServer();
    
    // Wait for server to start
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

function startEmbeddedServer() {
  console.log('Starting embedded backend server...');
  try {
    const { createEmbeddedBackend } = require(path.join(__dirname, 'backend-embedded.js'));
    const app = createEmbeddedBackend();
    
    app.listen(BACKEND_PORT, () => {
      console.log(`Embedded backend server running on port ${BACKEND_PORT}`);
    });
  } catch (error) {
    console.error('Failed to start embedded server:', error);
    // Create a minimal fallback server
    const express = require('express');
    const app = express();
    
    app.use(require('cors')());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'frontend')));
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', mode: 'fallback' });
    });
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    });
    
    app.listen(BACKEND_PORT, () => {
      console.log(`Fallback server running on port ${BACKEND_PORT}`);
    });
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-note');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About NoteHive',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About NoteHive',
              message: 'NoteHive Desktop',
              detail: 'A powerful note-taking application with real-time collaboration.\n\nVersion: 1.0.0\nAuthor: abhigyann'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start backend server first
    if (!isDev) {
      await startBackendServer();
    }
    
    // Create the main window
    createWindow();
    
    // Create application menu
    createMenu();
    
    console.log('NoteHive Desktop started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start NoteHive. Please try again.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Clean up backend process
  if (backendProcess) {
    backendProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
