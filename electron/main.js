const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
let serverUrl;

// Backend server setup
function startBackendServer() {
  return new Promise((resolve, reject) => {
    // Start the backend server as a child process
    const backendDir = path.resolve(__dirname, '../backend');
    const backendScript = path.join(backendDir, 'src', 'index.js');

    serverProcess = fork(backendScript, [], {
      cwd: backendDir, // Set the working directory for the backend
      // Pass environment variables to the backend process
      env: {
        ...process.env,
        PORT: '0', // '0' means assign a random available port
        NODE_ENV: 'development' // Or 'production' as needed
      },
      silent: false // Pipe stdout/stderr to parent
    });

    serverProcess.on('message', (message) => {
      if (message.type === 'SERVER_READY' && message.url) {
        serverUrl = message.url;
        console.log(`NoteHive backend is running at: ${serverUrl}`);
        resolve(serverUrl);
      }
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start backend process:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      serverProcess = null;
    });
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'), // Add icon later
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  console.log(`Loading URL: ${serverUrl}`);
  mainWindow.loadURL(serverUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start backend server first and wait for it to be ready
    await startBackendServer();
    
    // Create the Electron window
    createWindow();
    createMenu();

    // macOS specific - recreate window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize the app:', error);
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Terminate the backend process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-note');
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
        { role: 'paste' }
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
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

