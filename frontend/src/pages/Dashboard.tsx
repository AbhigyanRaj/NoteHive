import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import type { Note } from '../types';
import { notesService } from '../services/notesService';
import { collaborationService } from '../services/collaborationService';

const Dashboard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [syncStatus, setSyncStatus] = useState(notesService.getSyncStatus());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { windowMode, updateSettings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const handleNoteCreated = (data: { note: Note }) => {
      console.log('🆕 New note created by another user:', data.note);
      setNotes(prevNotes => {
        // Check for duplicates using all possible ID fields
        const noteId = data.note._id || data.note.localId || data.note.id;
        const exists = prevNotes.some(note => {
          const existingId = note._id || note.localId || note.id;
          return existingId === noteId;
        });
        
        if (exists) {
          console.log('🔄 Note already exists, skipping duplicate:', noteId);
          return prevNotes;
        }
        
        console.log('✅ Adding new note to list:', noteId);
        return [data.note, ...prevNotes];
      });
    };

    const handleNoteDeleted = (data: { noteId: string }) => {
      console.log(' Note deleted by another user:', data.noteId);
      setNotes(prevNotes => prevNotes.filter(note => 
        note._id !== data.noteId && note.localId !== data.noteId && note.id !== data.noteId
      ));
      
      // Close editor if deleted note is currently open
      if (selectedNote && (
        selectedNote._id === data.noteId || 
        selectedNote.localId === data.noteId || 
        selectedNote.id === data.noteId
      )) {
        setSelectedNote(null);
        setIsEditorOpen(false);
      }
    };

    const handleNoteChanged = (data: { noteId: string; changes: Partial<Note>; userId: string }) => {
      console.log(' Note updated by another user:', data);
      setNotes(prevNotes => 
        prevNotes.map(note => {
          const noteId = note._id || note.localId || note.id;
          if (noteId === data.noteId) {
            const updatedNote = { ...note, ...data.changes };
            console.log('Updating note in dashboard:', updatedNote);
            return updatedNote;
          }
          return note;
        })
      );
      
      // Update selected note if it's currently open
      if (selectedNote) {
        const selectedNoteId = selectedNote._id || selectedNote.localId || selectedNote.id;
        if (selectedNoteId === data.noteId) {
          setSelectedNote(prev => prev ? { ...prev, ...data.changes } : null);
        }
      }
    };

    console.log('🎧 Setting up Dashboard event listeners for real-time sync');
    collaborationService.on('note-created', handleNoteCreated);
    collaborationService.on('note-deleted', handleNoteDeleted);
    collaborationService.on('note-changed', handleNoteChanged);

    return () => {
      console.log('🧹 Cleaning up Dashboard event listeners');
      collaborationService.off('note-created', handleNoteCreated);
      collaborationService.off('note-deleted', handleNoteDeleted);
      collaborationService.off('note-changed', handleNoteChanged);
    };
  }, [selectedNote]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(notesService.getSyncStatus());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotes = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const params: any = {
        page,
        limit: 20
      };
      
      if (activeFilter === 'favorites') {
        params.favorite = true;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const result = await notesService.getNotes(params);
      
      if (append && page > 1) {
        setNotes(prev => [...prev, ...result.notes]);
      } else {
        setNotes(result.notes);
      }
      
      // Check if there are more pages
      if (result.pagination) {
        setHasMore(result.pagination.page < result.pagination.pages);
        setCurrentPage(result.pagination.page);
      } else {
        // For offline mode, assume no more pages if we got less than limit
        setHasMore(result.notes.length === 20);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNotes = async () => {
    if (!hasMore || loadingMore) return;
    await loadNotes(currentPage + 1, true);
  };

  // Reset and load notes when filter or search changes
  useEffect(() => {
    loadNotes(1, false);
  }, [activeFilter, searchQuery]);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMoreNotes();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, currentPage]);

  const handleAddNote = () => {
    setSelectedNote(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      let savedNote: Note;
      if (isCreating) {
        console.log('📝 Creating new note:', noteData);
        savedNote = await notesService.createNote(noteData);
        setNotes([savedNote, ...notes]);
        console.log('✅ Note created locally, broadcasting should happen automatically');
      } else if (selectedNote) {
        const noteId = selectedNote._id || selectedNote.localId || selectedNote.id!;
        console.log('📝 Updating existing note:', noteId);
        savedNote = await notesService.updateNote(noteId, noteData);
        setNotes(notes.map(note => 
          (note._id || note.localId || note.id) === noteId 
            ? savedNote 
            : note
        ));
      }
      setIsEditorOpen(false);
      setSyncStatus(notesService.getSyncStatus());
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesService.deleteNote(noteId);
      setNotes(notes.filter(note => 
        (note._id || note.localId || note.id) !== noteId
      ));
      setSyncStatus(notesService.getSyncStatus());
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleToggleFavorite = async (note: Note) => {
    try {
      const noteId = note._id || note.localId || note.id!;
      const updatedNote = await notesService.updateNote(noteId, {
        isFavorite: !note.isFavorite
      });
      setNotes(notes.map(n => 
        (n._id || n.localId || n.id) === noteId ? updatedNote : n
      ));
      setSyncStatus(notesService.getSyncStatus());
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleToggleMode = () => {
    const newMode = windowMode === 'compact' ? 'expanded' : 'compact';
    updateSettings({ windowMode: newMode });
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onAddNote={handleAddNote}
        onToggleMode={handleToggleMode}
      />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Notes</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
                {syncStatus.pendingActions > 0 && ` • ${syncStatus.pendingActions} pending`}
              </span>
            </div>
            {syncStatus.lastSync && (
              <span>Last synced: {new Date(syncStatus.lastSync).toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${
                activeFilter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Notes
            </button>
            <button 
              onClick={() => setActiveFilter('recent')}
              className={`px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${
                activeFilter === 'recent' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Recent
            </button>
            <button 
              onClick={() => setActiveFilter('favorites')}
              className={`px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${
                activeFilter === 'favorites' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Favorites
            </button>
          </div>
          
          <button
            onClick={handleSettingsClick}
            className="bg-white text-gray-700 px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            Settings
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 max-w-md mx-auto shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchQuery ? 'No notes found' : 'Start writing your first note'}
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {searchQuery 
                  ? `No notes match "${searchQuery}". Try a different search term.`
                  : 'Capture your thoughts, ideas, and important information in one organized place'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddNote}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm"
                >
                  Create Your First Note
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              windowMode === 'compact' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {notes.map((note, index) => {
                const noteKey = note._id || note.localId || note.id || `note-${index}`;
                return (
                  <NoteCard
                    key={noteKey}
                    note={note}
                    onClick={handleNoteClick}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteNote}
                  />
                );
              })}
            </div>
            
            {/* Load More / Loading Indicator */}
            {hasMore && (
              <div className="text-center mt-8">
                {loadingMore ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="text-gray-600">Loading more notes...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreNotes}
                    className="bg-white text-gray-700 px-6 py-3 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Load More Notes
                  </button>
                )}
              </div>
            )}
            
            {!hasMore && notes.length > 0 && (
              <div className="text-center mt-8 text-gray-500 text-sm">
                You've reached the end of your notes
              </div>
            )}
          </>
        )}
      </div>

      {isEditorOpen && (
        <NoteEditor
          note={selectedNote}
          onSave={handleSaveNote}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;

// code by abhigyann
