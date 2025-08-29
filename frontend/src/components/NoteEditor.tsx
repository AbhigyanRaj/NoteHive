import React, { useState, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { collaborationService, type Collaborator, type NoteChange, type TypingUser } from '../services/collaborationService';

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      
      // Join collaboration room for this note
      const noteId = note._id || note.localId || note.id;
      if (noteId) {
        collaborationService.joinNote(noteId);
      }
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  // Set up collaboration event listeners
  useEffect(() => {
    const handleNoteJoined = (data: { collaborators: Collaborator[] }) => {
      setCollaborators(data.collaborators);
      setIsConnected(true);
    };

    const handleUserJoined = (collaborator: Collaborator) => {
      setCollaborators(prev => [...prev, collaborator]);
    };

    const handleUserLeft = (data: { userId: string }) => {
      setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleNoteChanged = (change: NoteChange) => {
      // Apply changes from other users (avoid updating if it's from current user)
      console.log('📥 Received note change:', change);
      if (change.changes.title !== undefined && change.changes.title !== title) {
        console.log('📝 Updating title from:', title, 'to:', change.changes.title);
        setTitle(change.changes.title);
      }
      if (change.changes.content !== undefined && change.changes.content !== content) {
        console.log('📝 Updating content from:', content.substring(0, 50), 'to:', change.changes.content.substring(0, 50));
        setContent(change.changes.content);
      }
    };

    const handleUserTyping = (typingUser: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== typingUser.userId);
        return typingUser.isTyping ? [...filtered, typingUser] : filtered;
      });
    };

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setCollaborators([]);
      setTypingUsers([]);
    };

    // Register event listeners
    collaborationService.on('note-joined', handleNoteJoined);
    collaborationService.on('user-joined', handleUserJoined);
    collaborationService.on('user-left', handleUserLeft);
    collaborationService.on('note-changed', handleNoteChanged);
    collaborationService.on('user-typing', handleUserTyping);
    collaborationService.on('connect', handleConnect);
    collaborationService.on('disconnect', handleDisconnect);

    return () => {
      // Cleanup event listeners
      collaborationService.off('note-joined', handleNoteJoined);
      collaborationService.off('user-joined', handleUserJoined);
      collaborationService.off('user-left', handleUserLeft);
      collaborationService.off('note-changed', handleNoteChanged);
      collaborationService.off('user-typing', handleUserTyping);
      collaborationService.off('connect', handleConnect);
      collaborationService.off('disconnect', handleDisconnect);
      
      // Leave note room when component unmounts
      collaborationService.leaveNote();
    };
  }, []);

  // Calculate word count and reading time
  useEffect(() => {
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // Average reading speed: 200 words per minute
  }, [content]);

  // Auto-focus title when modal opens
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title, content]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    
    const noteData = {
      title: title.trim() || 'Untitled',
      content: content.trim(),
      tags: [], // Will be enhanced later
      isFavorite: note?.isFavorite || false,
    };
    
    // Send real-time update to collaborators
    const noteId = note?._id || note?.localId || note?.id;
    if (noteId && isConnected) {
      collaborationService.updateNote(noteId, noteData);
    }
    
    onSave(noteData);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Send real-time update with debouncing
    const noteId = note?._id || note?.localId || note?.id;
    if (noteId && isConnected) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Debounce the update
      typingTimeoutRef.current = setTimeout(() => {
        collaborationService.updateNote(noteId, { title: newTitle });
        console.log('📤 Sending title update:', newTitle);
      }, 300);
    }
    
    // Handle typing indicators
    handleTypingStart();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Send real-time update with debouncing
    const noteId = note?._id || note?.localId || note?.id;
    if (noteId && isConnected) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Debounce the update
      typingTimeoutRef.current = setTimeout(() => {
        collaborationService.updateNote(noteId, { content: newContent });
        console.log('📤 Sending content update:', newContent.substring(0, 50) + '...');
      }, 300);
    }
    
    // Handle typing indicators
    handleTypingStart();
  };

  const handleTypingStart = () => {
    const noteId = note?._id || note?.localId || note?.id;
    if (noteId && isConnected) {
      collaborationService.startTyping(noteId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        collaborationService.stopTyping(noteId);
      }, 2000);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 ${isFullscreen ? 'p-0' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-3xl w-full flex flex-col shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300 ${
        isFullscreen ? 'max-w-none max-h-none h-full rounded-none' : 'max-w-4xl max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {note ? 'Edit Note' : 'Create New Note'}
              </h2>
              <p className="text-sm text-gray-500">
                {note ? 'Make changes to your note' : 'Start writing your thoughts'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 mr-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono">⌘</kbd>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono">S</kbd>
                <span>to save</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden min-h-0">
            <input
              ref={titleRef}
              type="text"
              placeholder="Give your note a title..."
              value={title}
              onChange={handleTitleChange}
              className="w-full text-3xl font-bold mb-6 p-0 border-none outline-none bg-transparent text-gray-900 placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && contentRef.current) {
                  e.preventDefault();
                  contentRef.current.focus();
                }
              }}
            />
          <div className="relative h-full">
            <textarea
              ref={contentRef}
              placeholder="Start writing your note here... You can write anything - ideas, thoughts, reminders, or detailed notes."
              value={content}
              onChange={handleContentChange}
              className="w-full h-full resize-none border-none outline-none bg-transparent text-base leading-relaxed text-gray-700 placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-200"
            />
            
            {/* Floating word count for long content */}
            {content.length > 100 && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 shadow-sm">
                <div className="flex items-center space-x-3">
                  <span>{wordCount} words</span>
                  {readingTime > 0 && (
                    <>
                      <span>•</span>
                      <span>{readingTime} min read</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {/* Collaboration Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              
              {/* Active Collaborators */}
              {collaborators.length > 1 && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>{collaborators.length} collaborators</span>
                </div>
              )}
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].userName} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last saved: just now</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-gray-500">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{content.length} characters</span>
              {readingTime > 0 && (
                <>
                  <span>•</span>
                  <span>{readingTime} min read</span>
                </>
              )}
            </div>
          </div>
          
          {/* Collaborator Avatars */}
          {collaborators.length > 1 && (
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 mr-2">Active collaborators:</span>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                    title={collaborator.name}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;

// code by abhigyann
