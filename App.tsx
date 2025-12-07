
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Studio from './components/Studio';
import { User } from './types';

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
      setUser(user);
  };

  const handleLogout = () => {
      setUser(null);
  };

  return (
    <>
        {!user ? (
            <LandingPage onLogin={handleLogin} />
        ) : (
            <Studio onLogout={handleLogout} user={user} />
        )}
    </>
  );
};

export default App;
