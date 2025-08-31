# NoteHive Desktop Packaging Guide

## Overview
NoteHive has been successfully packaged into standalone desktop applications for both Windows and macOS using Electron. The applications include an embedded backend server, making them completely self-contained and runnable without any external dependencies.

## Generated Files

### Windows
- **File**: `electron/dist/NoteHive Setup 1.0.0.exe` (81.6 MB)
- **Type**: NSIS Installer
- **Architecture**: x64
- **Features**: 
  - Desktop shortcut creation
  - Start menu integration
  - Customizable installation directory
  - Uninstaller included

### macOS
- **File**: `electron/dist/NoteHive-1.0.0.dmg` (107 MB)
- **Type**: DMG Installer
- **Architecture**: Universal (x64 + ARM64)
- **Features**:
  - Drag-and-drop installation
  - Compatible with Intel and Apple Silicon Macs
  - macOS 10.12+ support

## Installation Instructions

### Windows Installation
1. Download `NoteHive Setup 1.0.0.exe`
2. Run the installer as administrator (if needed)
3. Follow the installation wizard
4. Launch NoteHive from Desktop or Start Menu

### macOS Installation
1. Download `NoteHive-1.0.0.dmg`
2. Double-click to mount the DMG
3. Drag NoteHive.app to Applications folder
4. Launch from Applications or Spotlight

## Build Commands

### Quick Build (Current Platform)
```bash
./build-desktop.sh
```

### Platform-Specific Builds
```bash
# Windows only
./build-desktop.sh win

# macOS only  
./build-desktop.sh mac

# All platforms
./build-desktop.sh all
```

### Manual Build Process
```bash
# 1. Build frontend
cd frontend && npm run build && cd ..

# 2. Setup Electron
cd electron && npm install

# 3. Copy files
npm run copy-frontend
npm run prepare-backend

# 4. Build executables
npm run dist-win    # Windows
npm run dist-mac    # macOS
npm run dist-all    # Both platforms
```

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io client

### Backend (Embedded)
- **Runtime**: Node.js (embedded in Electron)
- **Framework**: Express.js
- **Database**: MongoDB (configurable)
- **Authentication**: JWT + Google OAuth
- **Real-time**: Socket.io server

### Desktop Wrapper
- **Framework**: Electron 28.x
- **Process Model**: Main + Renderer
- **Security**: Context isolation enabled
- **Auto-updater**: Ready for implementation

## Features

### Core Functionality
- ✅ Note creation, editing, and deletion
- ✅ Real-time collaboration
- ✅ Cross-tab synchronization
- ✅ User authentication
- ✅ Offline support
- ✅ File system integration

### Desktop-Specific Features
- ✅ Native window controls
- ✅ System tray integration ready
- ✅ Keyboard shortcuts (Cmd/Ctrl+N, Cmd/Ctrl+S)
- ✅ Native menus
- ✅ Auto-start capability
- ✅ Local data storage

## Configuration

### Environment Variables
The desktop app uses these default configurations:
- `PORT`: 5001 (backend server)
- `NODE_ENV`: production
- `JWT_SECRET`: Auto-generated
- `DATABASE_URL`: Local MongoDB or embedded DB
- `DISABLE_GOOGLE_AUTH`: true (for offline mode)
- `DISABLE_REDIS`: true (uses in-memory storage)

### Customization
To customize the build:
1. Edit `electron/package.json` build configuration
2. Modify `electron/main.js` for app behavior
3. Update `electron/assets/` for icons and resources

## Troubleshooting

### Common Issues

**Windows: "App can't be opened"**
- Solution: Run installer as administrator
- Alternative: Right-click → Properties → Unblock

**macOS: "App is damaged"**
- Solution: Run `xattr -cr /Applications/NoteHive.app`
- Cause: Unsigned application (normal for development)

**Backend not starting**
- Check: MongoDB connection
- Fallback: App uses embedded server automatically

### Development Mode
```bash
cd electron
npm run dev  # Runs with hot reload
```

## Distribution

### For End Users
1. Share the installer files directly
2. Host on your website/GitHub releases
3. Use auto-updater for seamless updates

### For Developers
1. Code signing recommended for production
2. Notarization required for macOS App Store
3. Windows Store packaging available

## Security Notes

- App runs with standard user permissions
- Network access limited to localhost by default
- File system access sandboxed
- Auto-updates disabled (can be enabled)

## File Sizes
- Windows installer: ~82 MB
- macOS installer: ~107 MB
- Installed size: ~200-250 MB per platform

## Next Steps

1. **Code Signing**: Add developer certificates for trusted installation
2. **Auto-Updates**: Implement Electron's auto-updater
3. **Store Distribution**: Package for Microsoft Store / Mac App Store
4. **CI/CD**: Automate builds with GitHub Actions
5. **Monitoring**: Add crash reporting and analytics

---

**Built with ❤️ using Electron Builder**
*NoteHive Desktop v1.0.0*
