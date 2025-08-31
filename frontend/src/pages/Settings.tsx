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

  const handleFontSizeToggle = () => {
    const fontSizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
    const currentIndex = fontSizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % fontSizes.length;
    updateSettings({ fontSize: fontSizes[nextIndex] });
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Minimal Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Mobile Section Selector */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-1">
            <div className="grid grid-cols-4 gap-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-col items-center space-y-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`w-4 h-4 flex items-center justify-center ${
                    activeSection === section.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    {section.icon === 'user' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {section.icon === 'palette' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    )}
                    {section.icon === 'layout' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    )}
                    {section.icon === 'database' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    )}
                  </div>
                  <span className="text-center leading-tight text-xs">{section.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center ${
                      activeSection === section.id ? 'text-white' : 'text-gray-400'
                    }`}>
                      {section.icon === 'user' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {section.icon === 'palette' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                      )}
                      {section.icon === 'layout' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      )}
                      {section.icon === 'database' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-sm">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full">
            {activeSection === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your account information and preferences</p>
                    </div>
                  </div>
                </div>
                
                {/* Profile Form */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 ${
                            isEditing.username ? 'bg-white border-gray-300' : 'bg-gray-50'
                          }`}
                          readOnly={!isEditing.username}
                        />
                        <button 
                          onClick={() => handleEditToggle('username')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                          {isEditing.username ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 ${
                            isEditing.email ? 'bg-white border-gray-300' : 'bg-gray-50'
                          }`}
                          readOnly={!isEditing.email}
                        />
                        <button 
                          onClick={() => handleEditToggle('email')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                          {isEditing.email ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Status */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Account Status</h3>
                          <p className="text-xs text-gray-600">Your account is active and verified</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{notesCount}</p>
                      <p className="text-xs text-gray-500">Notes Created</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{storageUsed} KB</p>
                      <p className="text-xs text-gray-500">Storage Used</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-gray-900">Now</p>
                      <p className="text-xs text-gray-500">Last Active</p>
                    </div>
                  </div>
                  
                  {(isEditing.username || isEditing.email) && (
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setIsEditing({ username: false, email: false })}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Appearance Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                      <p className="text-sm text-gray-500 mt-1">Customize the look and feel of your workspace</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          theme === 'light'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">Font Size</label>
                      <button
                        onClick={handleFontSizeToggle}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                        title="Toggle font size"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Toggle</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleFontSizeChange('sm')}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          fontSize === 'sm'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Small
                      </button>
                      <button
                        onClick={() => handleFontSizeChange('md')}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          fontSize === 'md'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => handleFontSizeChange('lg')}
                        className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                          fontSize === 'lg'
                            ? 'bg-gray-900 text-white shadow-sm'
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
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Window Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Window</h2>
                      <p className="text-sm text-gray-500 mt-1">Configure window behavior and display preferences</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <label className="block text-sm font-medium text-gray-700">Default Window Mode</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Current: {windowMode}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        console.log('Setting windowMode to compact, current:', windowMode);
                        handleWindowModeChange('compact');
                      }}
                      className={`p-6 rounded-xl text-sm font-medium transition-all duration-200 ${
                        windowMode === 'compact'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                        </svg>
                        <span>Compact</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        console.log('Setting windowMode to expanded, current:', windowMode);
                        handleWindowModeChange('expanded');
                      }}
                      className={`p-6 rounded-xl text-sm font-medium transition-all duration-200 ${
                        windowMode === 'expanded'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>Expanded</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Data Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Data & Storage</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your data, cache, and storage preferences</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Local Storage</div>
                        <div className="text-xs text-gray-500">Cached notes and preferences • {storageUsed} KB used</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearCache}
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      Clear Cache
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Offline Mode</div>
                        <div className="text-xs text-gray-500">Access notes without internet connection</div>
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

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Auto Backup</div>
                        <div className="text-xs text-gray-500">Automatic backup every 30 minutes</div>
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
