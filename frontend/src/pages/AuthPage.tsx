import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { signup, loginUser, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_not_configured') {
      setError('Google OAuth is not configured on this server. Please use email login instead.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      let success = false;
      
      if (isLogin) {
        success = await loginUser(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          setError('Name is required');
          return;
        }
        success = await signup(formData.name, formData.email, formData.password);
      }
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError(isLogin ? 'Invalid email or password' : 'Failed to create account');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleGoogleAuth = () => {
    // Redirect to Google OAuth endpoint
    const isProduction = window.location.hostname !== 'localhost';
    const backendUrl = isProduction
      ? 'https://notehive-9176.onrender.com' 
      : 'http://localhost:5001';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding & Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <img 
              src="/assest.png" 
              alt="Notes Illustration" 
              className="w-80 h-80 object-contain opacity-90"
            />
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-8 bg-gray-200 rounded-full blur-xl opacity-30"></div>
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Monument Extended, sans-serif' }}>NoteHive</h1>
            <p className="text-lg text-gray-600 max-w-md leading-relaxed">
              Organize your thoughts, capture ideas, and stay productive with our modern note-taking platform
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/assest.png" 
              alt="Notes Illustration" 
              className="w-24 h-24 object-contain mx-auto mb-4 opacity-90"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Monument Extended, sans-serif' }}>NoteHive</h1>
            <p className="text-gray-600">Your personal note-taking companion</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex bg-gray-50 rounded-xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-6">
              <button
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 py-3 px-4 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" data-form-type="other">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      autoComplete="name"
                      data-form-type="other"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="username"
                    data-form-type="other"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    data-form-type="other"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Sign In to NoteHive' : 'Create Your Account'
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 text-center space-y-2">
              <div className="mb-3">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200 underline"
                >
                  Admin Portal Access
                </button>
              </div>
              <p className="text-xs text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="text-xs text-gray-400">
                Powered by Stremly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

// code by abhigyann
