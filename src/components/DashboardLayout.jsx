import LivePricing from './LivePricing';
import GreeksVisualizer from './GreeksVisualizer';
import VolatilitySim from './VolatilitySim';
import HedgingDemo from './HedgingDemo';
import ScenarioSimulator from './ScenarioSimulator';
import RiskHeatmap from './RiskHeatmap';
import FinancialDictionary from './FinancialDictionary';
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, TrendingUp, Activity, ShieldCheck, 
  Settings, LogOut, BookOpen, Menu, X, Zap, UserCircle
} from 'lucide-react';
 
const FeaturePlaceholder = ({ title }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
    <div className="p-10 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 bg-slate-900/50">
      Feature Module Loading...
    </div>
  </div>
);

// --- 2. Profile Modal Component ---
const ProfileModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Avatar Section */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-blue-900/50">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <h2 className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</h2>
          <p className="text-blue-400 text-sm font-mono mt-1">@{user.account}</p>
        </div>

        {/* Details List */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-500 text-sm font-medium">Account Status</span>
            <span className="text-emerald-400 text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Active
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-500 text-sm font-medium">Date of Birth</span>
            <span className="text-slate-200 text-sm">{user.dob}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm font-medium">Access Level</span>
            <span className="text-slate-200 text-sm">Tier-1 Admin</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-600">
          User ID: {user.account} • Session Secure
        </div>
      </motion.div>
    </div>
  );
};

// --- 3. Sidebar Navigation Config ---
const NAV_ITEMS = [
  { label: 'Live Pricing', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Greeks Visualizer', path: '/dashboard/greeks', icon: Activity },
  { label: 'Volatility Sim', path: '/dashboard/volatility', icon: Zap },
  { label: 'Hedging Demo', path: '/dashboard/hedging', icon: ShieldCheck },
  { label: 'Scenario Lab', path: '/dashboard/scenario', icon: Settings },
  { label: 'Risk Heatmap', path: '/dashboard/risk', icon: TrendingUp },
  { label: 'Dictionary', path: '/dashboard/dictionary', icon: BookOpen },
];

// --- 4. Main Layout Component ---
const DashboardLayout = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      
      {/* --- Sidebar --- */}
      <motion.div 
        animate={{ width: isOpen ? 260 : 80 }}
        className="h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col relative z-20 transition-all duration-300 shadow-xl"
      >
        {/* Logo Area */}
        <div className="p-5 flex items-center justify-between h-20">
          <AnimatePresence mode='wait'>
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
              >
                Drawdown
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link to={item.path} key={item.path}>
                <div className={`
                  flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative overflow-hidden
                  ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                  )}
                  <Icon size={22} className={isActive ? 'text-blue-400' : 'group-hover:text-white transition-colors'} />
                  
                  {/* Text Label (Only shows when open) */}
                  {isOpen && (
                    <span className="text-sm font-medium whitespace-nowrap animate-in fade-in duration-200">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-4 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors group"
          >
            <LogOut size={22} className="group-hover:text-red-400 transition-colors" />
            {isOpen && <span className="text-sm font-medium">Disconnect</span>}
          </button>
        </div>
      </motion.div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 overflow-auto relative bg-slate-950">
        <Routes>
          <Route path="/" element={<LivePricing />} />
          <Route path="/greeks" element={<GreeksVisualizer />} />
          <Route path="/volatility" element={<VolatilitySim />} />
          <Route path="/hedging" element={<HedgingDemo />} />
          <Route path="/scenario" element={<ScenarioSimulator />} />
          <Route path="/risk" element={<RiskHeatmap />} />
          <Route path="/dictionary" element={<FinancialDictionary />} />
        </Routes>

        {/* Floating Profile Button (Bottom Right) */}
        <button 
          onClick={() => setShowProfile(true)}
          className="fixed top-10 right-10 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/50 transition-all hover:scale-110 hover:rotate-3 z-40 group"
          title="My Profile"
        >
          <UserCircle size={28} />
          {/* Tooltip */}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
            View Profile
          </span>
        </button>
      </div>

      {/* --- Profile Modal Overlay --- */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardLayout;
