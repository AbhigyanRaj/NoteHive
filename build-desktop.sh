#!/bin/bash

# NoteHive Desktop Build Script
# This script builds the desktop application for Windows and macOS

set -e  # Exit on any error

echo "🚀 Starting NoteHive Desktop Build Process..."

# Step 1: Build Frontend
echo "📦 Building frontend for production..."
cd frontend
npm install
npm run build
cd ..

# Step 2: Setup Electron Environment
echo "⚡ Setting up Electron environment..."
cd electron
npm install

# Step 3: Copy Frontend Files
echo "📁 Copying frontend files..."
mkdir -p frontend
npm run copy-frontend

# Step 4: Prepare Backend Files
echo "🔧 Preparing backend files..."
mkdir -p backend
npm run prepare-backend

# Step 5: Build Desktop Applications
echo "🖥️ Building desktop applications..."

# Check if specific platform is requested
if [ "$1" = "win" ]; then
    echo "Building for Windows..."
    npm run dist-win
elif [ "$1" = "mac" ]; then
    echo "Building for macOS..."
    npm run dist-mac
elif [ "$1" = "all" ]; then
    echo "Building for all platforms..."
    npm run dist-all
else
    echo "Building for current platform..."
    npm run dist
fi

echo "✅ Build completed successfully!"
echo "📂 Output files are in: electron/dist/"

# List the generated files
echo "Generated files:"
ls -la dist/

echo ""
echo "🎉 NoteHive Desktop is ready!"
echo "📋 Installation files:"
if [ -f "dist/NoteHive Setup*.exe" ]; then
    echo "  Windows: $(ls dist/NoteHive\ Setup*.exe 2>/dev/null || echo 'Not built')"
fi
if [ -f "dist/NoteHive*.dmg" ]; then
    echo "  macOS: $(ls dist/NoteHive*.dmg 2>/dev/null || echo 'Not built')"
fi
