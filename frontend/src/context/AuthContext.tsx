import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { collaborationService } from '../services/collaborationService';

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null,
  });
  const [loading, setLoading] = useState(false);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          isAuthenticated: true,
          token,
        });
        
        // Store last logged-in user info
        localStorage.setItem('lastLoggedInUser', JSON.stringify({
          name: user.name,
          email: user.email,
          lastLogin: new Date().toISOString()
        }));
        
        // Connect to collaboration service on auth restore
        setTimeout(() => {
          collaborationService.connect(token).catch(error => {
            console.error('Failed to connect to collaboration service on restore:', error);
          });
        }, 2000);
        
        console.log('AuthContext - Restored auth state for:', user.email);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    console.log('AuthContext - Login called with:', { user, token });
    setAuthState({
      user,
      isAuthenticated: true,
      token,
    });
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Connect to collaboration service with delay to ensure auth is complete
    setTimeout(() => {
      collaborationService.connect(token).catch(error => {
        console.error('Failed to connect to collaboration service:', error);
      });
    }, 1000);
    console.log('AuthContext - Login completed, isAuthenticated:', true);
  };

  const logout = () => {
    // Disconnect from collaboration service
    collaborationService.disconnect();
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      token: null,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Attempting signup with:', { name, email });
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://notehive-9176.onrender.com' 
        : 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        login(data.user, data.token);
        return true;
      } else {
        console.error('Signup failed:', data.message);
        if (data.errors) {
          console.error('Validation errors:', data.errors);
        }
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://notehive-9176.onrender.com' 
        : 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user, data.token);
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, signup, loginUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// code by abhigyann
