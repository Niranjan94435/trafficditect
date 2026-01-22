
import React from 'react';

interface DashboardHeaderProps {
  currentUser?: string | null;
  onLogout?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ7mm_A9Ivxsl-jHTcHJaAmRgNscfwRHwpXw&s" 
          alt="STP Analyser Logo"
          className="w-10 h-10 rounded-lg shadow-lg shadow-emerald-500/20 object-cover"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight">STP <span className="text-emerald-400 text-sm font-medium ml-1 uppercase tracking-widest">Analyser</span></h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-tighter">Smart Traffic Analysis Platform</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          LIVE ANALYTICS
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          CPU Optimized Engine v4.2
        </div>
        {currentUser && (
          <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-sm">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 hidden sm:inline">{currentUser}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-2 px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all font-mono uppercase tracking-wider"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
