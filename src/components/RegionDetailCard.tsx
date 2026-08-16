import React, { useState } from 'react';
import { RegionData, UserRole } from '../types';
import { 
  AlertTriangle, 
  Megaphone, 
  TrendingUp, 
  Droplet, 
  Flame, 
  Mountain, 
  Wind, 
  Activity, 
  ShieldAlert, 
  ChevronRight, 
  Lock,
  LineChart as ChartIcon,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface RegionDetailCardProps {
  region: RegionData;
  role: UserRole;
  onIssueAlertClick: (region: RegionData) => void;
  onOpenTacticalPlan: (region: RegionData) => void;
}

export const RegionDetailCard: React.FC<RegionDetailCardProps> = ({
  region,
  role,
  onIssueAlertClick,
  onOpenTacticalPlan,
}) => {
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [showRbacWarning, setShowRbacWarning] = useState(false);

  const isCritical = region.overallSeverity === 'CRITICAL';
  const isHigh = region.overallSeverity === 'HIGH';

  // Primary hazard vector probabilities
  const floodProb = Math.round((region.hazardVectors['flood']?.probability || 0) * 100);
  const landslideProb = Math.round((region.hazardVectors['landslide']?.probability || 0) * 100);
  const wildfireProb = Math.round((region.hazardVectors['wildfire']?.probability || 0) * 100);
  const cycloneProb = Math.round((region.hazardVectors['cyclone']?.probability || 0) * 100);
  const droughtProb = Math.round((region.hazardVectors['drought']?.probability || 0) * 100);

  const handleAlertButton = () => {
    if (role !== 'Administrator') {
      setShowRbacWarning(true);
      setTimeout(() => setShowRbacWarning(false), 3500);
      return;
    }
    onIssueAlertClick(region);
  };

  return (
    <div className="w-full max-w-[380px] bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] rounded-2xl p-5 shadow-2xl text-[#FAFAFA] flex flex-col space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
      {/* Title & Status Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{region.name}</span>
          </h2>
          <div className="text-[11px] font-mono-code text-zinc-400 mt-0.5 tracking-wider uppercase">
            ID: {region.code}
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
          isCritical
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            : isHigh
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        }`}>
          {region.overallSeverity}
        </span>
      </div>

      {/* Hazard Vectors */}
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono-code">
          HAZARD VECTORS
        </div>

        {/* Flood Vector Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono-code text-zinc-300">
            <span>Flood Probability</span>
            <span className={`font-semibold ${floodProb > 50 ? 'text-rose-400' : 'text-zinc-300'}`}>
              {floodProb}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                floodProb > 70
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${floodProb}%` }}
            />
          </div>
        </div>

        {/* Landslide Risk Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono-code text-zinc-300">
            <span>Landslide Risk</span>
            <span className={`font-semibold ${landslideProb > 50 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {landslideProb}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                landslideProb > 70
                  ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-zinc-500'
              }`}
              style={{ width: `${landslideProb}%` }}
            />
          </div>
        </div>

        {/* Dynamic Secondary Hazard Row if Wildfire, Cyclone, or Drought is dominant */}
        {(wildfireProb > 30 || cycloneProb > 30 || droughtProb > 30) && (
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-xs font-mono-code text-zinc-300">
              <span>
                {wildfireProb > 30
                  ? 'Wildfire Spread Risk'
                  : cycloneProb > 30
                  ? 'Cyclone Surge Risk'
                  : 'Drought Aridity Index'}
              </span>
              <span className="font-semibold text-amber-400">
                {Math.max(wildfireProb, cycloneProb, droughtProb)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(wildfireProb, cycloneProb, droughtProb)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sensor Fusion Delta Box */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 space-y-2">
        <div className="text-[11px] font-semibold text-zinc-300">
          {region.sensorFusionDelta.title}
        </div>
        <div className="space-y-1.5">
          {region.sensorFusionDelta.metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center text-xs text-zinc-300 font-mono-code">
              {metric.icon === 'radar' ? (
                <TrendingUp className="w-3.5 h-3.5 text-blue-400 mr-2 flex-shrink-0" />
              ) : (
                <Droplet className="w-3.5 h-3.5 text-cyan-400 mr-2 flex-shrink-0" />
              )}
              <span>
                {metric.label}{' '}
                <strong className="text-white font-semibold">{metric.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical Recommendation Box */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono-code">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>TACTICAL REC</span>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed font-sans">
          {region.tacticalRecommendation}
        </p>
      </div>

      {/* RBAC Warning Toast */}
      {showRbacWarning && (
        <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-xs text-rose-200 flex items-center space-x-2 animate-in fade-in duration-150 shadow-xl">
          <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            <strong>RBAC Restricted:</strong> Role <em>{role}</em> cannot issue public emergency broadcasts. Switch role to <strong>Administrator</strong>.
          </span>
        </div>
      )}

      {/* Issue Public Alert Button */}
      <button
        onClick={handleAlertButton}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.98] ${
          region.alertIssued
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : role === 'Administrator'
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer'
        }`}
      >
        {region.alertIssued ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>ALERT BROADCAST ACTIVE</span>
          </>
        ) : (
          <>
            <Megaphone className="w-4 h-4" />
            <span>ISSUE PUBLIC ALERT</span>
            {role !== 'Administrator' && (
              <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded ml-1 border border-zinc-700">
                ADMIN ONLY
              </span>
            )}
          </>
        )}
      </button>

      {/* Secondary Controls: Trend Mini-Chart & Resource Staging */}
      <div className="flex items-center justify-between pt-1 border-t border-[#27272A] text-xs">
        <button
          onClick={() => setShowTrendChart(!showTrendChart)}
          className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 transition-colors"
        >
          <ChartIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>{showTrendChart ? 'Hide Trend' : '7-Day Risk Curve'}</span>
        </button>

        <button
          onClick={() => onOpenTacticalPlan(region)}
          className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 transition-colors"
        >
          <span>Resource Staging</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable 7-Day Trend Chart */}
      {showTrendChart && (
        <div className="pt-2 bg-[#09090B] p-3 rounded-xl border border-[#27272A] animate-in fade-in duration-200">
          <div className="text-[11px] font-mono-code text-zinc-400 mb-2 flex items-center justify-between">
            <span>Historical Multi-Sensor Risk Index</span>
            <span className="text-rose-400 font-bold">Peak: {region.historicalTrend[region.historicalTrend.length - 1].riskScore}%</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={region.historicalTrend} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', fontSize: '11px', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
