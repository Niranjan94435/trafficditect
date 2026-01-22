
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color, subValue }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-400`}>
          {icon}
        </div>
        {subValue && (
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {subValue}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
};

export default StatsCard;
