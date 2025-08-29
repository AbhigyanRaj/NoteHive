import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    console.log('AuthSuccess - Token:', token);
    console.log('AuthSuccess - UserParam:', userParam);

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('AuthSuccess - Parsed user:', user);
        
        login(user, token);
        setProcessed(true);
        
        // Use setTimeout to ensure login completes before navigation
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setProcessed(true);
        navigate('/auth?error=invalid_data', { replace: true });
      }
    } else {
      console.error('Missing token or user data');
      setProcessed(true);
      navigate('/auth?error=missing_data', { replace: true });
    }
  }, [searchParams, login, navigate, processed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
