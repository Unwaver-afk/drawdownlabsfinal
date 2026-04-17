import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', account: '', password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Get existing users
    const existingUsers = JSON.parse(localStorage.getItem('drawdown_users') || '[]');
    
    // 2. Add new user
    const updatedUsers = [...existingUsers, formData];
    
    // 3. Save back to storage
    localStorage.setItem('drawdown_users', JSON.stringify(updatedUsers));
    
    // 4. Redirect
    alert("Account Created Successfully! Please Login.");
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-white">Initialize Portfolio Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 uppercase">First Name</label>
            <input required name="firstName" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Last Name</label>
            <input required name="lastName" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Date of Birth</label>
            <input required type="date" name="dob" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="col-span-1 md:col-span-2 my-2 border-t border-slate-800"></div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-blue-400 uppercase">Set Account ID</label>
            <input required name="account" placeholder="e.g. prakhar_01" onChange={handleChange} className="w-full bg-slate-950 border border-blue-900/50 rounded p-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-blue-400 uppercase">Set Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-slate-950 border border-blue-900/50 rounded p-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="col-span-1 md:col-span-2 pt-4">
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all">
              <CheckCircle size={20} /> Confirm Registration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SignupPage;