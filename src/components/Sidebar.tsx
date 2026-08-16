import React from 'react';
import { HazardCategory } from '../types';
import { 
  Droplet, 
  Flame, 
  Mountain, 
  Wind, 
  RotateCw, 
  FileText, 
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  selectedHazard: HazardCategory;
  onSelectHazard: (hazard: HazardCategory) => void;
  onRefreshData: () => void;
  onOpenAuditLog: () => void;
  onToggleLayerModal: () => void;
  isRefreshing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedHazard,
  onSelectHazard,
  onRefreshData,
  onOpenAuditLog,
  onToggleLayerModal,
  isRefreshing,
}) => {
  return (
    <aside className="w-16 bg-[#18181B] border-r border-[#27272A] flex flex-col items-center justify-between py-4 select-none z-30">
      {/* Top Hazard Filter Icons */}
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        {/* Flood Hazard Filter (Water Drop) */}
        <button
          onClick={() => onSelectHazard(selectedHazard === 'flood' ? 'all' : 'flood')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            selectedHazard === 'flood'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'
          }`}
          title="Filter: Flood Probability & Inundation"
        >
          <Droplet className={`w-5 h-5 ${selectedHazard === 'flood' ? 'fill-white/20' : ''}`} />
          {/* Tooltip */}
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Flood Hazard (SAR / IMERG)
          </span>
        </button>

        {/* Wildfire Hazard Filter (Flame) */}
        <button
          onClick={() => onSelectHazard(selectedHazard === 'wildfire' ? 'all' : 'wildfire')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            selectedHazard === 'wildfire'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'
          }`}
          title="Filter: Wildfire & Thermal Hotspots"
        >
          <Flame className={`w-5 h-5 ${selectedHazard === 'wildfire' ? 'fill-white/20' : ''}`} />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Wildfire (MODIS / VIIRS)
          </span>
        </button>

        {/* Landslide Hazard Filter (Mountain / Slope) */}
        <button
          onClick={() => onSelectHazard(selectedHazard === 'landslide' ? 'all' : 'landslide')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            selectedHazard === 'landslide'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'
          }`}
          title="Filter: Landslide & Slope Deformation"
        >
          <Mountain className={`w-5 h-5 ${selectedHazard === 'landslide' ? 'fill-white/20' : ''}`} />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Landslide (SMAP / InSAR)
          </span>
        </button>

        {/* Cyclone Hazard Filter (Cyclone / Wind Vortex) */}
        <button
          onClick={() => onSelectHazard(selectedHazard === 'cyclone' ? 'all' : 'cyclone')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            selectedHazard === 'cyclone'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'
          }`}
          title="Filter: Tropical Cyclone & Storm Surge"
        >
          <Wind className={`w-5 h-5 ${selectedHazard === 'cyclone' ? 'fill-white/20' : ''}`} />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Cyclone (INSAT-3D / NOAA)
          </span>
        </button>

        {/* Refresh / Resync Satellite Feeds */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors group relative"
          title="Force Satellite Downlink Telemetry Sync"
        >
          <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {isRefreshing ? 'Syncing Feeds...' : 'Sync Satellite Telemetry'}
          </span>
        </button>
      </div>

      {/* Bottom Icons (Audit Log ledger & Layer Controls) */}
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        {/* Audit Log Quick Trigger */}
        <button
          onClick={onOpenAuditLog}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-zinc-800/70 transition-colors group relative"
          title="Forensic Audit Trail Ledger"
        >
          <FileText className="w-5 h-5" />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Audit Ledger (SHA-256)
          </span>
        </button>

        {/* Map Layers & Sensor Overlay Toggles */}
        <button
          onClick={onToggleLayerModal}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-zinc-800/70 transition-colors group relative"
          title="Sensor Layer Overlays (SAR / Thermal / Terrain)"
        >
          <Layers className="w-5 h-5" />
          <span className="absolute left-14 bg-[#18181B] border border-[#27272A] text-zinc-200 text-xs px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Satellite Raster Layers
          </span>
        </button>
      </div>
    </aside>
  );
};
