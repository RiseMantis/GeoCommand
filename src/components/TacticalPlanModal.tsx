import React from 'react';
import { RegionData, UserRole } from '../types';
import { Shield, Navigation, Compass, MapPin, Truck, Anchor, Users, X, CheckCircle, ExternalLink } from 'lucide-react';

interface TacticalPlanModalProps {
  region: RegionData;
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onDispatchResources: (regionName: string) => void;
}

export const TacticalPlanModal: React.FC<TacticalPlanModalProps> = ({
  region,
  isOpen,
  onClose,
  role,
  onDispatchResources,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-[#FAFAFA] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#27272A] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Tactical Staging & Evacuation Route Directives
              </h2>
              <div className="text-xs font-mono-code text-zinc-400 mt-0.5">
                Target Sector: {region.name} ({region.code}) · {region.state}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Evacuation Corridor Card */}
        <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-xl space-y-2">
          <div className="text-[10px] font-bold font-mono-code text-blue-400 flex items-center space-x-2 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Designated Evacuation Corridor</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {region.evacuationCorridor}
          </p>
          <div className="text-xs text-zinc-400 flex items-center space-x-4 pt-1 font-mono-code">
            <span>Flow Capacity: 4,800 persons/hr</span>
            <span>Terrain Clearance: High Ground</span>
          </div>
        </div>

        {/* Resource Staging Depot */}
        <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold font-mono-code text-emerald-400 flex items-center space-x-2 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Forward Staging Depot: {region.resourceStaging.name}</span>
            </div>
            <span className="text-[10px] font-mono-code text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-[#27272A]">
              [{region.resourceStaging.coordinates[0].toFixed(2)}, {region.resourceStaging.coordinates[1].toFixed(2)}]
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-xs text-zinc-400 font-semibold">Pre-Allocated Emergency Assets:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {region.resourceStaging.assets.map((asset, idx) => (
                <div key={idx} className="bg-zinc-900/60 px-3 py-2 rounded-lg border border-[#27272A] text-xs text-zinc-200 flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{asset}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Population & Demographics */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono-code">
          <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A]">
            <div className="text-zinc-500 text-[10px]">TOTAL AT-RISK</div>
            <div className="text-sm font-bold text-rose-400 mt-0.5">{region.populationAtRisk.toLocaleString()}</div>
          </div>
          <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A]">
            <div className="text-zinc-500 text-[10px]">RELIEF SHELTERS</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">14 Active</div>
          </div>
          <div className="bg-[#09090B] p-3 rounded-xl border border-[#27272A]">
            <div className="text-zinc-500 text-[10px]">TRANSIT TIME</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">~35 Minutes</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#27272A]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onDispatchResources(region.name);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center space-x-2 transition-all active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Tactical Logistics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
