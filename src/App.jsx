import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('./components/LandingPage'));
const SignupPage = lazy(() => import('./components/SignupPage'));
const AboutUs = lazy(() => import('./components/AboutUs'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));

const AppLoader = () => (
  <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
    Loading...
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('drawdown_active_user'));
    } catch {
      return null;
    }
  });

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
      <Suspense fallback={<AppLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
