import React from 'react';
import { MotionMetrics } from '../services/motionDetectionService';

interface MotionPanelProps {
  motionMetrics: MotionMetrics;
}

const MotionPanel: React.FC<MotionPanelProps> = ({ motionMetrics }) => {
  const getMotionColor = (intensity: number) => {
    if (intensity < 20) return 'text-slate-500 bg-slate-500/10';
    if (intensity < 40) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (intensity < 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const getMotionStatusText = (intensity: number) => {
    if (intensity === 0) return 'IDLE';
    if (intensity < 20) return 'MINIMAL';
    if (intensity < 40) return 'LOW';
    if (intensity < 60) return 'MEDIUM';
    if (intensity < 80) return 'HIGH';
    return 'CRITICAL';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
        Motion Detection Scan
      </h3>

      {/* Motion Intensity Gauge */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Intensity Level</span>
          <span className={`text-lg font-bold ${getMotionColor(motionMetrics.motionIntensity).split(' ')[0]}`}>
            {motionMetrics.motionIntensity.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              motionMetrics.motionIntensity < 20 ? 'bg-slate-600' :
              motionMetrics.motionIntensity < 40 ? 'bg-cyan-500' :
              motionMetrics.motionIntensity < 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${motionMetrics.motionIntensity}%` }}
          />
        </div>
      </div>

      {/* Motion Status */}
      <div className="mb-6">
        <div className={`rounded-lg p-3 border ${getMotionColor(motionMetrics.motionIntensity)}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider">
            Motion Status: {getMotionStatusText(motionMetrics.motionIntensity)}
          </div>
          {motionMetrics.motionDetected && (
            <div className="text-[9px] mt-1 opacity-75">
              ✓ Motion detected in {motionMetrics.motionAreas.length} area(s)
            </div>
          )}
        </div>
      </div>

      {/* Motion Areas */}
      {motionMetrics.motionAreas.length > 0 && (
        <div>
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-3">
            Active Motion Zones ({motionMetrics.motionAreas.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {motionMetrics.motionAreas.map((area, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono text-slate-400">Zone {idx + 1}</span>
                  <span className={`text-[8px] font-bold ${
                    area.intensity < 30 ? 'text-cyan-400' :
                    area.intensity < 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {area.intensity.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded overflow-hidden">
                  <div
                    className={`h-full ${
                      area.intensity < 30 ? 'bg-cyan-500' :
                      area.intensity < 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${area.intensity}%` }}
                  />
                </div>
                <div className="text-[7px] text-slate-500 mt-1">
                  Pos: ({area.x}px, {area.y}px) | Size: {area.width}×{area.height}px
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Motion */}
      {!motionMetrics.motionDetected && motionMetrics.motionIntensity === 0 && (
        <div className="text-center py-6">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">
            No Motion Detected
          </div>
          <div className="text-[8px] text-slate-600 mt-1">
            Scene is stable
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <span className="text-[8px] font-mono text-slate-600">
          Last Update: {new Date(motionMetrics.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default MotionPanel;
