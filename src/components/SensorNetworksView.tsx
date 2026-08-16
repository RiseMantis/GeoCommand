import React from 'react';
import { SatelliteFeed } from '../types';
import { SATELLITE_FEEDS } from '../data/mockData';
import { Satellite, Radio, CheckCircle, Activity, Layers, ArrowUpRight, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export const SensorNetworksView: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <Satellite className="w-5 h-5 text-blue-400" />
            </div>
            <span>Cross-Modal Satellite Sensor Constellation</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time telemetry, radiometric correction, and temporal alignment across 6 orbital sensor suites.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono-code text-zinc-300">Downlink: 1.42 Gbps</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono-code text-blue-200">SHA-256 Merkle: OK</span>
          </div>
        </div>
      </div>

      {/* Cross-Modal Data Fusion Pipeline Visualizer */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono-code flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Multi-Sensor Regional Alignment & Spatial Gridding Pipeline</span>
          </div>
          <span className="text-[10px] font-mono-code bg-[#09090B] text-zinc-300 px-2.5 py-0.5 rounded-full border border-[#27272A]">
            CRS: EPSG:4326 (WGS 84) · Resampled 10m
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {[
            { name: 'Sentinel-1 SAR', role: 'Inundation & Deformation', color: 'border-blue-500/30 bg-blue-950/20' },
            { name: 'Sentinel-2 Optical', role: 'NDVI & Burn Boundaries', color: 'border-emerald-500/30 bg-emerald-950/20' },
            { name: 'GPM IMERG', role: '30m Rainfall Accumulation', color: 'border-cyan-500/30 bg-cyan-950/20' },
            { name: 'SMAP L-Band', role: 'Soil Saturation Matrix', color: 'border-amber-500/30 bg-amber-950/20' },
            { name: 'MODIS / VIIRS', role: 'Thermal Brightness 4µm', color: 'border-rose-500/30 bg-rose-950/20' },
            { name: 'INSAT-3D Geo', role: 'Atmospheric Cloud Motion', color: 'border-indigo-500/30 bg-indigo-950/20' },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${item.color} flex flex-col justify-between`}>
              <div className="text-xs font-bold text-zinc-100">{item.name}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{item.role}</div>
              <div className="mt-2 text-[10px] text-emerald-400 font-mono-code flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Synchronized</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Feeds Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SATELLITE_FEEDS.map((feed) => (
          <div
            key={feed.id}
            className="bg-[#18181B] border border-[#27272A] hover:border-zinc-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                    {feed.name}
                  </h3>
                  <div className="text-[11px] font-mono-code text-zinc-400 mt-0.5">
                    {feed.agency} · {feed.orbitType}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                  {feed.status}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {feed.description}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#27272A] text-xs font-mono-code">
                <div className="flex justify-between text-zinc-400">
                  <span>Sensor Type:</span>
                  <span className="text-zinc-200 text-right">{feed.sensorType}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Spatial Res:</span>
                  <span className="text-zinc-200">{feed.spatialResolution}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Revisit Cycle:</span>
                  <span className="text-zinc-200">{feed.revisitPeriod}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Ingest Latency:</span>
                  <span className="text-blue-400 font-semibold">{feed.lastIngestTimestamp}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 text-zinc-400 font-mono-code">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fidelity: {feed.dataIntegrity}%</span>
              </div>
              <span className="text-zinc-400 text-[11px] font-mono-code">
                {feed.activePassesToday} passes/day
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
