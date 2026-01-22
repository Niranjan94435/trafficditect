
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoricalData, TrafficStats, PollutionMetrics } from '../types';

interface AnalyticsPanelProps {
  history: HistoricalData[];
  stats: TrafficStats;
  pollution: PollutionMetrics;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ history, stats, pollution }) => {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Pollution Indices
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden relative">
             <div className="h-40 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="co2" stroke="#10b981" fillOpacity={1} fill="url(#colorCo2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-4 left-4">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-tighter">Estimated CO₂ Output</span>
              <span className="text-xl font-bold text-emerald-400">{pollution.co2.toFixed(1)}g</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-slate-500 text-[10px] block uppercase tracking-tighter mb-1">NOx Index</span>
                <span className="text-lg font-bold text-blue-400">{pollution.nox.toFixed(3)}g</span>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-slate-500 text-[10px] block uppercase tracking-tighter mb-1">PM2.5 Factor</span>
                <span className="text-lg font-bold text-amber-400">{pollution.pm25.toFixed(3)}g</span>
             </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Congestion Index</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
            stats.congestion === 'High' ? 'border-red-500 text-red-500' : 
            stats.congestion === 'Medium' ? 'border-amber-500 text-amber-500' : 
            'border-emerald-500 text-emerald-500'
          }`}>
            <span className="text-lg font-black">{stats.congestion[0]}</span>
          </div>
          <div>
            <div className="font-bold text-white">{stats.congestion} Congestion</div>
            <div className="text-xs text-slate-500">{stats.density.toFixed(1)} vehicles / snapshot</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPanel;
