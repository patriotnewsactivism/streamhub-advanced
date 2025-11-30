
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Studio from './components/Studio';

type ViewState = 'landing' | 'studio';

const App = () => {
  const [view, setView] = useState<ViewState>('landing');

  // Simple view switcher
  // In a real app, this would check authentication status
  const handleLogin = () => {
      setView('studio');
  };

  const handleLogout = () => {
      setView('landing');
  };

  return (
    <>
        {view === 'landing' ? (
            <LandingPage onLogin={handleLogin} />
        ) : (
            <Studio onLogout={handleLogout} />
        )}
    </>
  );
};

export default App;
