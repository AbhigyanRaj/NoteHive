import React from 'react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onToggleFavorite?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onToggleFavorite, onDelete }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(note);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this note?')) {
      const noteId = note._id || note.localId || note.id!;
      onDelete(noteId);
    }
  };

  const getSyncStatus = () => {
    if (note.needsSync) {
      return { color: 'bg-orange-400', text: 'Pending sync' };
    }
    if (note.localId && !note._id) {
      return { color: 'bg-blue-400', text: 'Local only' };
    }
    return { color: 'bg-green-400', text: 'Synced' };
  };

  const syncStatus = getSyncStatus();

  return (
    <div
      onClick={() => onClick(note)}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-base truncate flex-1 group-hover:text-gray-700">
          {note.title || 'Untitled'}
        </h3>
        <div className="flex items-center space-x-2 ml-3">
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
            {formatDate(note.updatedAt)}
          </span>
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={`p-1 rounded-full transition-colors duration-200 ${
                note.isFavorite 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Delete note"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {getPreview(note.content)}
      </p>
      {note.tags && note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{note.tags.length - 3} more</span>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${syncStatus.color} rounded-full`}></div>
          <span className="text-xs text-gray-500">{syncStatus.text}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;

// code by abhigyann
