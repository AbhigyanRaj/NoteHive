const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notes
// @desc    Get user's notes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

        let query = { createdBy: req.user._id };
    
    if (search) {
      query.$text = { $search: search };
    }

    const notes = await Note.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');

    const total = await Note.countDocuments(query);

    res.json({
      success: true,
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching note'
    });
  }
});

// @route   POST /api/notes
// @desc    Create new note
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('content').optional().trim().isLength({ max: 10000 }).withMessage('Content must be at most 10000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { title, content, tags = [], isFavorite = false } = req.body;
    
    const note = new Note({
      title,
      content,
      tags,
      isFavorite,
      createdBy: req.user._id,
      lastEditedBy: req.user._id
    });
    
    await note.save();
    
    // Broadcast note creation to all connected users
    if (req.app.get('io')) {
      req.app.get('io').broadcastNoteCreated(note);
    }
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    console.error('Create note error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error while creating note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('content').optional().trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be 1-10000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOne({ _id: req.params.id, createdBy: req.user._id });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    const { title, content, tags, isFavorite, isArchived } = req.body;
    
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isFavorite !== undefined) note.isFavorite = isFavorite;
    if (isArchived !== undefined) note.isArchived = isArchived;
    
    note.lastEditedBy = req.user._id;
    note.lastSynced = new Date();
    await note.save();
    
    // Broadcast note update to all connected users
    if (req.app.get('io')) {
      req.app.get('io').emit('note-changed', {
        noteId: req.params.id,
        changes: { title, content, tags, isFavorite, isArchived },
        version: 1, // Simple versioning
        userId: req.user._id.toString(),
        userName: req.user.name || req.user.email,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating note'
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Broadcast note deletion to the note owner
    if (req.app.get('io')) {
      req.app.get('io').broadcastNoteDeleted(req.params.id, note.createdBy);
    }
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note'
    });
  }
});

// @route   POST /api/notes/sync
// @desc    Sync notes (for offline-first functionality)
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    const { notes: clientNotes = [], lastSync } = req.body;
    
    // Get server notes modified after last sync (only user's notes)
    const serverQuery = { createdBy: req.user._id };
    if (lastSync) {
      serverQuery.lastSynced = { $gt: new Date(lastSync) };
    }
    
    const serverNotes = await Note.find(serverQuery)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');
    
    // Process client notes for sync
    const syncResults = {
      updated: [],
      created: [],
      conflicts: []
    };
    
    for (const clientNote of clientNotes) {
      if (clientNote._id) {
        // Update existing note (only if user owns it)
        const existingNote = await Note.findOne({ _id: clientNote._id, createdBy: req.user._id });
        
        if (existingNote) {
          // Check for conflicts (server version newer than client)
          if (existingNote.lastSynced > new Date(clientNote.lastSynced || 0)) {
            syncResults.conflicts.push({
              clientNote,
              serverNote: existingNote
            });
          } else {
            // Update with client data
            Object.assign(existingNote, {
              title: clientNote.title,
              content: clientNote.content,
              tags: clientNote.tags || [],
              isFavorite: clientNote.isFavorite || false,
              isArchived: clientNote.isArchived || false,
              lastSynced: new Date()
            });
            await existingNote.save();
            syncResults.updated.push(existingNote);
          }
        }
      } else {
        // Create new note
        const newNote = new Note({
          ...clientNote,
          createdBy: req.user._id,
          lastEditedBy: req.user._id,
          lastSynced: new Date()
        });
        await newNote.save();
        syncResults.created.push(newNote);
      }
    }
    
    res.json({
      success: true,
      serverNotes,
      syncResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sync'
    });
  }
});

module.exports = router;
