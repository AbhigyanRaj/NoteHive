import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with key:', secretKey);
      const response = await fetch('http://localhost:5001/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretKey }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Use the existing login function but mark as admin
        login({ ...data.admin, isAdmin: true }, data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid admin secret key');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Connection error. Please try again. Make sure backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-300">Enter your admin secret key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-200 mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  id="secretKey"
                  type={showKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter admin secret key"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !secretKey.trim()}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Access Admin Portal'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
              >
                ← Back to User Login
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Admin access is restricted. Contact system administrator for the secret key.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
