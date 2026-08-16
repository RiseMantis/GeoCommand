import React from 'react';
import { Bell, AlertTriangle, CheckCircle, ShieldAlert, X, ChevronRight } from 'lucide-react';
import { RegionData } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegionData[];
  onSelectRegion: (region: RegionData) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  regions,
  onSelectRegion,
}) => {
  if (!isOpen) return null;

  const criticalRegions = regions.filter((r) => r.overallSeverity === 'CRITICAL' || r.overallSeverity === 'HIGH');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#FAFAFA] animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Active Hazard Alerts & Inundation Warnings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {criticalRegions.map((region) => (
            <div
              key={region.id}
              onClick={() => {
                onSelectRegion(region);
                onClose();
              }}
              className="bg-[#09090B] border border-[#27272A] hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition-all flex items-start justify-between space-x-3 group shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                    {region.name}
                  </span>
                  <span className="text-[10px] font-mono-code bg-rose-950/40 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
                    {region.overallSeverity}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {region.tacticalRecommendation}
                </p>
                <div className="text-[10px] font-mono-code text-blue-400 font-semibold">
                  {region.hazardVectors[region.primaryHazard]?.label}: {Math.round((region.hazardVectors[region.primaryHazard]?.probability || 0) * 100)}%
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
