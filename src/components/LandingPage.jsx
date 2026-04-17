import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, User } from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // 1. Get all users
    const users = JSON.parse(localStorage.getItem('drawdown_users') || '[]');
    // 2. Find match
    const user = users.find(u => u.account === formData.id && u.password === formData.password);
    
    if (user) {
      onLogin(user); // Pass full user object up to App
    } else {
      setError('Invalid Credentials. Please create an account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.15]"></div>

      {/* Main Content Centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 relative z-10">
        
        {/* Title Section */}
        <div
          className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="inline-block px-3 py-1 mb-4 text-xs font-mono text-blue-400 border border-blue-900/50 rounded-full bg-blue-900/10">
            INSTITUTIONAL GRADE TERMINAL
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
            Drawdown<span className="text-blue-500">Labs</span>
          </h1>
          <p className="text-slate-400 text-lg">Risk Visualization & Strategy Engine</p>
        </div>

        {/* Login Card */}
        <div
          className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-500"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Account ID</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="Enter Account ID"
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
              Launch Terminal <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button 
              onClick={() => navigate('/signup')}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              No account? <span className="text-blue-400 underline decoration-blue-400/30 underline-offset-4">Create Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div
        className="py-8 z-10 animate-in fade-in duration-700"
      >
        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
          <Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link>
          <span className="text-slate-700">|</span>
          <Link to="/news" className="hover:text-blue-400 transition-colors">Latest News</Link>
          <span className="text-slate-700">|</span>
          <Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;
