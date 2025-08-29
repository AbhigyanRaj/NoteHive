import type { Note } from '../types';

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
  ? 'https://notehive-9176.onrender.com/api' 
  : 'http://localhost:5001/api';

// Local storage keys
const NOTES_STORAGE_KEY = 'notehive_notes';
const LAST_SYNC_KEY = 'notehive_last_sync';
const OFFLINE_QUEUE_KEY = 'notehive_offline_queue';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  note?: Partial<Note>;
  noteId?: string;
  timestamp: Date;
}

class NotesService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    console.log('🌐 Back online - starting sync');
    this.isOnline = true;
    this.syncNotes();
  }

  private handleOffline() {
    console.log('📴 Gone offline - switching to local mode');
    this.isOnline = false;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Local storage operations
  private getLocalNotes(): Note[] {
    try {
      const notes = localStorage.getItem(NOTES_STORAGE_KEY);
      return notes ? JSON.parse(notes) : [];
    } catch (error) {
      console.error('Error reading local notes:', error);
      return [];
    }
  }

  private saveLocalNotes(notes: Note[]): void {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving local notes:', error);
    }
  }

  private getOfflineQueue(): OfflineAction[] {
    try {
      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  private saveOfflineQueue(queue: OfflineAction[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private addToOfflineQueue(action: OfflineAction): void {
    const queue = this.getOfflineQueue();
    queue.push(action);
    this.saveOfflineQueue(queue);
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // API operations
  async getNotes(params: {
    page?: number;
    limit?: number;
    search?: string;
    favorite?: boolean;
    archived?: boolean;
  } = {}): Promise<{ notes: Note[]; pagination?: any }> {
    if (!this.isOnline) {
      console.log('📱 Offline mode - returning local notes');
      const localNotes = this.getLocalNotes();
      
      // Apply filters locally
      let filteredNotes = localNotes.filter(note => !note.isArchived);
      
      if (params.favorite) {
        filteredNotes = filteredNotes.filter(note => note.isFavorite);
      }
      
      if (params.archived) {
        filteredNotes = localNotes.filter(note => note.isArchived);
      }
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredNotes = filteredNotes.filter(note =>
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by creation date (newest first)
      filteredNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return { notes: filteredNotes };
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/notes?${queryParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local storage with server data
        this.saveLocalNotes(data.notes);
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        return { notes: data.notes, pagination: data.pagination };
      } else {
        throw new Error(data.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes from server:', error);
      // Fallback to local notes
      return { notes: this.getLocalNotes() };
    }
  }

  async createNote(noteData: Partial<Note>): Promise<Note> {
    const newNote: Note = {
      ...noteData,
      _id: this.isOnline ? undefined : this.generateLocalId(),
      localId: !this.isOnline ? this.generateLocalId() : undefined,
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      tags: noteData.tags || [],
      isFavorite: noteData.isFavorite || false,
      isArchived: noteData.isArchived || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '', // Will be set by server
      needsSync: !this.isOnline
    } as Note;

    if (!this.isOnline) {
      console.log('📱 Offline mode - saving note locally');
      const localNotes = this.getLocalNotes();
      localNotes.unshift(newNote);
      this.saveLocalNotes(localNotes);
      
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'create',
        note: newNote,
        timestamp: new Date()
      });
      
      return newNote;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local storage
        const localNotes = this.getLocalNotes();
        localNotes.unshift(data.note);
        this.saveLocalNotes(localNotes);
        
        return data.note;
      } else {
        throw new Error(data.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note on server:', error);
      // Save locally and queue for sync
      const localNotes = this.getLocalNotes();
      localNotes.unshift(newNote);
      this.saveLocalNotes(localNotes);
      
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'create',
        note: newNote,
        timestamp: new Date()
      });
      
      return newNote;
    }
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const localNotes = this.getLocalNotes();
    const noteIndex = localNotes.findIndex(note => 
      note._id === noteId || note.localId === noteId
    );
    
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    const updatedNote = {
      ...localNotes[noteIndex],
      ...updates,
      updatedAt: new Date(),
      needsSync: !this.isOnline
    };

    // Update local storage immediately
    localNotes[noteIndex] = updatedNote;
    this.saveLocalNotes(localNotes);

    if (!this.isOnline) {
      console.log('📱 Offline mode - queuing update');
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'update',
        noteId,
        note: updates,
        timestamp: new Date()
      });
      
      return updatedNote;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local storage with server response
        localNotes[noteIndex] = data.note;
        this.saveLocalNotes(localNotes);
        
        return data.note;
      } else {
        throw new Error(data.message || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note on server:', error);
      // Note is already updated locally, queue for sync
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'update',
        noteId,
        note: updates,
        timestamp: new Date()
      });
      
      return updatedNote;
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    const localNotes = this.getLocalNotes();
    const noteIndex = localNotes.findIndex(note => 
      note._id === noteId || note.localId === noteId
    );
    
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    // Remove from local storage immediately
    localNotes.splice(noteIndex, 1);
    this.saveLocalNotes(localNotes);

    if (!this.isOnline) {
      console.log('📱 Offline mode - queuing deletion');
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'delete',
        noteId,
        timestamp: new Date()
      });
      
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note on server:', error);
      // Note is already deleted locally, queue for sync
      this.addToOfflineQueue({
        id: this.generateLocalId(),
        type: 'delete',
        noteId,
        timestamp: new Date()
      });
    }
  }

  async syncNotes(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync...');

    try {
      const offlineQueue = this.getOfflineQueue();
      
      // Process offline queue
      for (const action of offlineQueue) {
        try {
          switch (action.type) {
            case 'create':
              if (action.note) {
                await this.createNote(action.note);
              }
              break;
            case 'update':
              if (action.noteId && action.note) {
                await this.updateNote(action.noteId, action.note);
              }
              break;
            case 'delete':
              if (action.noteId) {
                await this.deleteNote(action.noteId);
              }
              break;
          }
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error);
        }
      }

      // Clear offline queue after successful sync
      this.saveOfflineQueue([]);

      // Fetch latest from server
      await this.getNotes();
      
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    pendingActions: number;
    lastSync: string | null;
  } {
    return {
      isOnline: this.isOnline,
      pendingActions: this.getOfflineQueue().length,
      lastSync: localStorage.getItem(LAST_SYNC_KEY)
    };
  }
}

export const notesService = new NotesService();
