export interface User {
  id: string;
  username?: string;
  name?: string;
  email: string;
}

export interface Note {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSynced?: Date;
  userId: string;
  localId?: string; // For offline notes
  needsSync?: boolean; // Flag for offline changes
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg';
  windowMode: 'compact' | 'expanded';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// code by abhigyann
