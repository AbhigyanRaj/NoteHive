import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Settings: React.FC = () => {
  const { theme, fontSize, windowMode, updateSettings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState({ username: false, email: false });
  const [formData, setFormData] = useState({ username: user?.name || '', email: user?.email || '' });
  const [notesCount, setNotesCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState('0');
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    updateSettings({ theme: newTheme });
  };

  const handleFontSizeChange = (newFontSize: 'sm' | 'md' | 'lg') => {
    updateSettings({ fontSize: newFontSize });
  };

  const handleWindowModeChange = (newMode: 'compact' | 'expanded') => {
    updateSettings({ windowMode: newMode });
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('notehive_notes_cache');
      localStorage.removeItem('notehive_offline_data');
      setStorageUsed('0');
      alert('Cache cleared successfully!');
    } catch (error) {
      alert('Failed to clear cache');
    }
  };

  const handleEditToggle = (field: 'username' | 'email') => {
    setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = () => {
    // Here you would typically make an API call to update user profile
    console.log('Saving profile:', formData);
    setIsEditing({ username: false, email: false });
    alert('Profile updated successfully!');
  };

  useEffect(() => {
    // Calculate storage usage
    const calculateStorage = () => {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      setStorageUsed((totalSize / 1024).toFixed(1));
    };

    // Get notes count (mock data for now)
    const getNotesCount = () => {
      try {
        const notes = JSON.parse(localStorage.getItem('notehive_notes') || '[]');
        setNotesCount(notes.length);
      } catch {
        setNotesCount(0);
      }
    };

    calculateStorage();
    getNotesCount();
  }, []);

  useEffect(() => {
    setFormData({ username: user?.name || '', email: user?.email || '' });
  }, [user]);

  const settingsSections = [
    { id: 'profile', name: 'Profile', icon: 'user' },
    { id: 'appearance', name: 'Appearance', icon: 'palette' },
    { id: 'window', name: 'Window', icon: 'layout' },
    { id: 'data', name: 'Data & Storage', icon: 'database' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Settings Menu</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-28">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activeSection === section.id ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {section.icon === 'user' && (
                        <svg className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {section.icon === 'palette' && (
                        <svg className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                      )}
                      {section.icon === 'layout' && (
                        <svg className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {section.icon === 'database' && (
                        <svg className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full lg:w-auto">
            {activeSection === 'profile' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-10 transition-all duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 sm:mb-10">
                  <div className="relative mx-auto sm:mx-0">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-3xl flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-5 sm:w-6 h-5 sm:h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                      <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                    <p className="text-gray-600 text-base sm:text-lg">Manage your account information and preferences</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Username</label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          className={`w-full px-5 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-300 group-hover:border-gray-300 ${
                            isEditing.username ? 'bg-white border-blue-300' : 'bg-gray-50/80'
                          }`}
                          readOnly={!isEditing.username}
                        />
                        <button 
                          onClick={() => handleEditToggle('username')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                        >
                          {isEditing.username ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Email Address</label>
                      <div className="relative group">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full px-5 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-300 group-hover:border-gray-300 ${
                            isEditing.email ? 'bg-white border-blue-300' : 'bg-gray-50/80'
                          }`}
                          readOnly={!isEditing.email}
                        />
                        <button 
                          onClick={() => handleEditToggle('email')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                        >
                          {isEditing.email ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Account Status</h3>
                          <p className="text-gray-600">Your account is active and verified</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-bold text-green-600">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gray-50/80 rounded-2xl p-6 text-center border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Notes Created</h4>
                      <p className="text-2xl font-bold text-blue-600">{notesCount}</p>
                    </div>
                    
                    <div className="bg-gray-50/80 rounded-2xl p-6 text-center border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Storage Used</h4>
                      <p className="text-2xl font-bold text-purple-600">{storageUsed} KB</p>
                    </div>
                    
                    <div className="bg-gray-50/80 rounded-2xl p-6 text-center border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Last Active</h4>
                      <p className="text-2xl font-bold text-orange-600">Now</p>
                    </div>
                  </div>
                  
                  {(isEditing.username || isEditing.email) && (
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditing({ username: false, email: false })}
                        className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Appearance</h2>
                  <p className="text-gray-600">Customize the look and feel of your workspace</p>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-4">Theme</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-4">Font Size</label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => handleFontSizeChange('sm')}
                        className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                          fontSize === 'sm'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Small
                      </button>
                      <button
                        onClick={() => handleFontSizeChange('md')}
                        className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                          fontSize === 'md'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => handleFontSizeChange('lg')}
                        className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                          fontSize === 'lg'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'window' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Window</h2>
                  <p className="text-gray-600">Configure window behavior and display preferences</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">Default Window Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleWindowModeChange('compact')}
                      className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                        windowMode === 'compact'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Compact
                    </button>
                    <button
                      onClick={() => handleWindowModeChange('expanded')}
                      className={`p-4 rounded-lg text-sm font-medium transition-colors ${
                        windowMode === 'expanded'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Expanded
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Data & Storage</h2>
                    <p className="text-gray-600">Manage your data, cache, and storage preferences</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Local Storage</div>
                        <div className="text-xs text-gray-600">Cached notes and preferences • 2.4 MB used</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearCache}
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      Clear Cache
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Offline Mode</div>
                        <div className="text-xs text-gray-600">Access notes without internet connection</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setOfflineMode(!offlineMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                        offlineMode ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          offlineMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Auto Backup</div>
                        <div className="text-xs text-gray-600">Automatic backup every 30 minutes</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoBackup(!autoBackup)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                        autoBackup ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoBackup ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

// code by abhigyann
