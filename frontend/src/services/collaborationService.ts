import { io, Socket } from 'socket.io-client';
import type { Note } from '../types';

export interface Collaborator {
  userId: string;
  name: string;
  avatar?: string;
}

export interface CursorPosition {
  position: number;
  selection?: { start: number; end: number };
}

export interface NoteChange {
  noteId: string;
  changes: Partial<Note>;
  version: number;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

class CollaborationService {
  private socket: Socket | null = null;
  private currentNoteId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Initialize event listener arrays
    const events = [
      'note-joined',
      'note-changed',
      'note-created',
      'note-deleted',
      'user-joined',
      'user-left',
      'cursor-moved',
      'cursor-removed',
      'user-typing',
      'note-update-confirmed',
      'error',
      'connect',
      'disconnect',
      'reconnect'
    ];

    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  // Connect to Socket.io server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Attempting to connect to collaboration server with token:', token ? 'present' : 'missing');
        
        // Detect if running in Electron
        const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type;
        const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
        
        const socketUrl = isElectron || window.location.hostname === 'localhost'
          ? 'http://localhost:5001'
          : isProduction
            ? 'https://notehive-9176.onrender.com' 
            : 'http://localhost:5001';
            
        this.socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('🔌 Connected to collaboration server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connect');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from collaboration server:', reason);
          this.isConnected = false;
          this.emit('disconnect', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.socket?.connect();
            }, 2000 * this.reconnectAttempts);
          } else {
            reject(new Error('Failed to connect to collaboration server'));
          }
        });

        // Set up event handlers
        this.setupEventHandlers();

      } catch (error) {
        console.error('Failed to initialize socket connection:', error);
        reject(error);
      }
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Note collaboration events
    this.socket.on('note-joined', (data) => {
      console.log('📝 Joined note room:', data);
      this.emit('note-joined', data);
    });

    this.socket.on('note-changed', (data: NoteChange) => {
      console.log('📝 Note changed by another user:', data);
      this.emit('note-changed', data);
    });

    this.socket.on('note-update-confirmed', (data) => {
      console.log('✅ Note update confirmed:', data);
      this.emit('note-update-confirmed', data);
    });

    // Global note events (for dashboard updates)
    this.socket.on('note-created', (data) => {
      console.log('🆕 New note created:', data);
      this.emit('note-created', data);
    });

    this.socket.on('note-deleted', (data) => {
      console.log('🗑️ Note deleted:', data);
      this.emit('note-deleted', data);
    });

    // User presence events
    this.socket.on('user-joined', (data: Collaborator) => {
      console.log('👤 User joined:', data);
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('👤 User left:', data);
      this.emit('user-left', data);
    });

    // Cursor and typing events
    this.socket.on('cursor-moved', (data) => {
      this.emit('cursor-moved', data);
    });

    this.socket.on('cursor-removed', (data) => {
      this.emit('cursor-removed', data);
    });

    this.socket.on('user-typing', (data: TypingUser) => {
      this.emit('user-typing', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🚨 Collaboration error:', error);
      this.emit('error', error);
    });
  }

  // Join a note room for collaboration
  joinNote(noteId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join note: not connected to collaboration server');
      return;
    }

    if (this.currentNoteId === noteId) {
      console.log('Already in note room:', noteId);
      return;
    }

    // Leave current note if any
    if (this.currentNoteId) {
      this.leaveNote();
    }

    this.currentNoteId = noteId;
    this.socket.emit('join-note', { noteId });
    console.log('🚪 Joining note room:', noteId);
  }

  // Leave current note room
  leaveNote(): void {
    if (!this.socket || !this.currentNoteId) return;

    this.socket.emit('leave-note', { noteId: this.currentNoteId });
    console.log('🚪 Leaving note room:', this.currentNoteId);
    this.currentNoteId = null;
  }

  // Send note updates to other collaborators
  updateNote(noteId: string, changes: Partial<Note>, version: number = 0): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot update note: not connected to collaboration server');
      return;
    }

    this.socket.emit('note-update', {
      noteId,
      changes,
      version
    });
  }

  // Send cursor position updates
  updateCursor(noteId: string, position: number, selection?: { start: number; end: number }): void {
    if (!this.socket || !this.isConnected || this.currentNoteId !== noteId) return;

    this.socket.emit('cursor-update', {
      noteId,
      position,
      selection
    });
  }

  // Send typing indicators
  startTyping(noteId: string): void {
    if (!this.socket || !this.isConnected || this.currentNoteId !== noteId) return;

    this.socket.emit('typing-start', { noteId });
  }

  stopTyping(noteId: string): void {
    if (!this.socket || !this.isConnected || this.currentNoteId !== noteId) return;

    this.socket.emit('typing-stop', { noteId });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.set(event, []);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      this.leaveNote();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentNoteId = null;
      console.log('🔌 Disconnected from collaboration server');
    }
  }

  // Get connection status
  getStatus(): {
    isConnected: boolean;
    currentNoteId: string | null;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      currentNoteId: this.currentNoteId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Utility method to check if user is in a specific note room
  isInNote(noteId: string): boolean {
    return this.currentNoteId === noteId && this.isConnected;
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
