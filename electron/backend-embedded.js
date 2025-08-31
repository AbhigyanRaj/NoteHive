// Embedded backend configuration for Electron
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create a modified backend that works in Electron environment
function createEmbeddedBackend() {
  const app = express();
  
  // CORS configuration for Electron
  app.use(cors({
    origin: ['http://localhost:5001', 'http://localhost:3000', 'file://', 'app://'],
    credentials: true
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files from frontend
  const frontendPath = path.join(__dirname, 'frontend');
  console.log('Frontend path:', frontendPath);
  console.log('Frontend exists:', fs.existsSync(frontendPath));
  
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
  }
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'embedded', frontendPath, frontendExists: fs.existsSync(frontendPath) });
  });
  
  // Mock authentication routes for offline mode
  app.post('/api/auth/login', (req, res) => {
    res.json({ 
      success: true, 
      token: 'demo-token', 
      user: { id: 1, email: 'demo@notehive.com', name: 'Demo User' }
    });
  });
  
  app.post('/api/auth/signup', (req, res) => {
    res.json({ 
      success: true, 
      token: 'demo-token', 
      user: { id: 1, email: req.body.email, name: req.body.name }
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    res.json({ 
      success: true,
      user: { id: 1, email: 'demo@notehive.com', name: 'Demo User' }
    });
  });
  
  // Mock notes routes for offline mode
  let mockNotes = [
    {
      id: 1,
      title: 'Welcome to NoteHive Desktop',
      content: 'This is your first note in NoteHive Desktop! You can create, edit, and organize your notes here.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 1
    }
  ];
  
  app.get('/api/notes', (req, res) => {
    res.json({ success: true, notes: mockNotes });
  });
  
  app.post('/api/notes', (req, res) => {
    const newNote = {
      id: mockNotes.length + 1,
      title: req.body.title || 'Untitled',
      content: req.body.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 1
    };
    mockNotes.push(newNote);
    res.json({ success: true, note: newNote });
  });
  
  app.put('/api/notes/:id', (req, res) => {
    const noteId = parseInt(req.params.id);
    const noteIndex = mockNotes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      mockNotes[noteIndex] = {
        ...mockNotes[noteIndex],
        title: req.body.title || mockNotes[noteIndex].title,
        content: req.body.content || mockNotes[noteIndex].content,
        updatedAt: new Date().toISOString()
      };
      res.json({ success: true, note: mockNotes[noteIndex] });
    } else {
      res.status(404).json({ success: false, message: 'Note not found' });
    }
  });
  
  app.delete('/api/notes/:id', (req, res) => {
    const noteId = parseInt(req.params.id);
    const noteIndex = mockNotes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      mockNotes.splice(noteIndex, 1);
      res.json({ success: true, message: 'Note deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Note not found' });
    }
  });
  
  // Catch-all handler for React Router
  app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`Frontend not found at ${indexPath}`);
    }
  });
  
  return app;
}

module.exports = { createEmbeddedBackend };
