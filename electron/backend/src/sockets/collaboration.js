const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Note = require('../models/Note');

const collaborationHandler = (io) => {
  // Store active users and note rooms
  const activeUsers = new Map(); // userId -> { socketId, user, currentNote }
  const noteRooms = new Map(); // noteId -> Set of userIds
  const userCursors = new Map(); // noteId -> Map(userId -> cursorPosition)
  const typingUsers = new Map(); // noteId -> Set of userIds

  // Broadcast note creation to the note owner only
  const broadcastNoteCreated = (note) => {
    console.log('📡 Broadcasting note-created event to note owner:', note.createdBy);
    io.to(`user_${note.createdBy}`).emit('note-created', {
      note,
      timestamp: new Date().toISOString()
    });
  };

  // Broadcast note deletion to the note owner only
  const broadcastNoteDeleted = (noteId, ownerId) => {
    console.log('📡 Broadcasting note-deleted event to note owner:', ownerId);
    io.to(`user_${ownerId}`).emit('note-deleted', {
      noteId,
      timestamp: new Date().toISOString()
    });
  };

  // Export broadcast functions for use in routes
  io.broadcastNoteCreated = broadcastNoteCreated;
  io.broadcastNoteDeleted = broadcastNoteDeleted;

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('🔐 Socket auth attempt with token:', token ? 'present' : 'missing');
      
      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded:', decoded.userId);
      
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.log('❌ User not found:', decoded.userId);
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      socket.userName = user.name || user.email;
      console.log('✅ Socket authenticated for user:', socket.userName);
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(` User ${socket.user.name || socket.user.email} connected (${socket.id})`);

    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      currentNote: null
    });

    // Join user to their personal room for receiving all note updates
    socket.join(`user_${socket.userId}`);

    // Handle joining a note room
    socket.on('join-note', async (data) => {
      try {
        const { noteId } = data;
        const userId = socket.userId;

        // Find note (only accessible to owner)
        const note = await Note.findOne({ _id: noteId, createdBy: userId });
        if (!note) {
          socket.emit('error', { message: 'Note not found or access denied' });
          return;
        }

        // Leave previous note room if any
        if (activeUsers.has(userId)) {
          const userData = activeUsers.get(userId);
          if (userData.currentNote) {
            socket.leave(userData.currentNote);

            // Remove from note room
            if (noteRooms.has(userData.currentNote)) {
              noteRooms.get(userData.currentNote).delete(userId);

              // Notify others in the room
              socket.to(userData.currentNote).emit('user-left', {
                userId,
                userName: socket.user.name || socket.user.email
              });
            }
          }
        }

        // Join new note room
        socket.join(noteId);

        // Update user data
        activeUsers.set(userId, {
          socketId: socket.id,
          user: socket.user,
          currentNote: noteId
        });

        // Add to note room
        if (!noteRooms.has(noteId)) {
          noteRooms.set(noteId, new Set());
        }
        noteRooms.get(noteId).add(userId);

        // Get current collaborators
        const collaborators = [];
        for (const uid of noteRooms.get(noteId)) {
          if (activeUsers.has(uid)) {
            const user = activeUsers.get(uid);
            collaborators.push({
              userId: uid,
              name: user.user.name || user.user.email,
              avatar: user.user.avatar || null
            });
          }
        }

        // Notify user they joined
        socket.emit('note-joined', {
          noteId,
          collaborators
        });

        // Notify others in the room
        socket.to(noteId).emit('user-joined', {
          userId,
          name: socket.user.name || socket.user.email,
          avatar: socket.user.avatar || null
        });

      } catch (error) {
        console.error('Error joining note:', error);
        socket.emit('error', { message: 'Failed to join note' });
      }
    });

    // Handle real-time note content updates
    socket.on('note-update', async (data) => {
      try {
        const { noteId, changes, version } = data;
        const userId = socket.userId;

        // Find note (only accessible to owner)
        const note = await Note.findOne({ _id: noteId, createdBy: userId });
        if (!note) {
          socket.emit('error', { message: 'Note not found or access denied' });
          return;
        }

        // Update note in database
        Object.assign(note, changes);
        note.lastEditedBy = userId;
        note.lastSynced = new Date();
        await note.save();

        // Broadcast changes only to the note owner
        io.to(`user_${userId}`).emit('note-changed', {
          noteId,
          changes,
          version: version + 1,
          userId,
          userName: socket.user.name || socket.user.email,
          timestamp: new Date().toISOString()
        });

        // Confirm update to sender
        socket.emit('note-update-confirmed', {
          noteId,
          version: version + 1,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error updating note:', error);
        socket.emit('error', { message: 'Failed to update note' });
      }
    });

    // Handle cursor position updates
    socket.on('cursor-update', (data) => {
      const { noteId, position, selection } = data;

      if (!noteRooms.has(noteId) || !noteRooms.get(noteId).has(socket.userId)) {
        return; // User not in this note room
      }

      // Update cursor position
      if (!userCursors.has(noteId)) {
        userCursors.set(noteId, new Map());
      }
      userCursors.get(noteId).set(socket.userId, {
        position,
        selection,
        timestamp: Date.now()
      });

      // Broadcast cursor update to other users
      socket.to(noteId).emit('cursor-moved', {
        userId: socket.userId,
        userName: socket.user.name || socket.user.email,
        position,
        selection
      });
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { noteId } = data;
      if (!typingUsers.has(noteId)) {
        typingUsers.set(noteId, new Set());
      }
      typingUsers.get(noteId).add(socket.userId);
      socket.to(noteId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name || socket.user.email,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { noteId } = data;
      if (typingUsers.has(noteId)) {
        typingUsers.get(noteId).delete(socket.userId);
      }
      socket.to(noteId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name || socket.user.email,
        isTyping: false
      });
    });

    // Handle leaving a note
    socket.on('leave-note', (data) => {
      const { noteId } = data;
      if (noteRooms.has(noteId)) {
        noteRooms.get(noteId).delete(socket.userId);
      }
      socket.leave(noteId);

      const userData = activeUsers.get(socket.userId);
      if (userData) {
        userData.currentNote = null;
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(` User ${socket.user.name || socket.user.email} disconnected`);

      const userData = activeUsers.get(socket.userId);
      if (userData && userData.currentNote) {
        if (noteRooms.has(userData.currentNote)) {
          noteRooms.get(userData.currentNote).delete(socket.userId);
        }
        socket.to(userData.currentNote).emit('user-left', {
          userId: socket.userId,
          userName: socket.user.name || socket.user.email
        });
      }

      activeUsers.delete(socket.userId);
    });
  });

  // Periodic cleanup of stale data
  setInterval(() => {
    // Clean up old cursor positions (older than 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;

    for (const [noteId, cursors] of userCursors.entries()) {
      for (const [userId, cursorData] of cursors.entries()) {
        if (cursorData.timestamp < thirtySecondsAgo) {
          cursors.delete(userId);

          // Notify room about cursor removal
          io.to(noteId).emit('cursor-removed', {
            userId,
            noteId
          });
        }
      }

      // Remove empty cursor maps
      if (cursors.size === 0) {
        userCursors.delete(noteId);
      }
    }
  }, 10000); // Run every 10 seconds

  return io;
};

module.exports = collaborationHandler;
