
import React, { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import Studio from './components/Studio';
import { User } from './types';
import { pingBackend } from './services/apiClient';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    pingBackend()
      .then(() => {
        if (!cancelled) setBackendStatus('online');
      })
      .catch((error) => {
        console.error('Backend healthcheck failed', error);
        if (!cancelled) setBackendStatus('offline');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = (user: User) => {
      setUser(user);
  };

  const handleLogout = () => {
      setUser(null);
  };

  return (
    <>
        <div
          style={{
            position: 'fixed',
            top: '8px',
            right: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: backendStatus === 'online' ? '#065f46' : backendStatus === 'offline' ? '#991b1b' : '#1f2937',
            color: '#f9fafb',
            fontSize: '12px',
            zIndex: 50,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          API {backendStatus === 'checking' ? 'checking...' : backendStatus}
        </div>
        {!user ? (
            <LandingPage onLogin={handleLogin} />
        ) : (
            <Studio onLogout={handleLogout} user={user} />
        )}
    </>
  );
};

export default App;
