import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import AboutUs from './components/AboutUs';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if a user is currently active
    const activeUser = JSON.parse(localStorage.getItem('drawdown_active_user'));
    if (activeUser) setCurrentUser(activeUser);
  }, []);

  const handleLogin = (user) => {
    localStorage.setItem('drawdown_active_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('drawdown_active_user');
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!currentUser ? <LandingPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<AboutUs />} />
        
        {/* Placeholder Routes for Links */}
        <Route path="/news" element={<div className="text-white p-10">Latest News Page (Under Construction)</div>} />
        <Route path="/contact" element={<div className="text-white p-10">Contact Us Page (Under Construction)</div>} />

        <Route 
          path="/dashboard/*" 
          element={currentUser ? <DashboardLayout user={currentUser} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
