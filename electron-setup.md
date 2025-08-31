# NoteHive Desktop App Setup

## Quick Setup Commands

```bash
# 1. Create electron directory
mkdir electron && cd electron

# 2. Initialize electron project
npm init -y

# 3. Install dependencies
npm install electron electron-builder --save-dev
npm install express sqlite3 cors

# 4. Create main.js (Electron entry point)
# 5. Create package.json build config
# 6. Build and package

# Build command
npm run dist
```

## File Structure
```
NoteHive/
├── frontend/dist/     # Built React app
├── backend/src/       # Express server
├── electron/
│   ├── main.js        # Electron main process
│   ├── package.json   # Electron config
│   └── assets/
│       └── icon.ico   # App icon
└── dist-electron/     # Final .exe output
```

## Benefits for Users
- No browser required
- Offline note-taking
- Native Windows integration
- Faster startup
- System notifications
- File system access

## Distribution
- Single .exe installer
- No dependencies needed
- Works on any Windows PC
- Auto-update capability
