import React, { useState } from 'react';
import { RegionData, UserRole } from '../types';
import { Megaphone, AlertTriangle, ShieldCheck, CheckCircle2, Radio, X, Volume2, Smartphone, MapPin } from 'lucide-react';

interface AlertModalProps {
  region: RegionData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmIssue: (regionId: string, headline: string, instructions: string) => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  region,
  isOpen,
  onClose,
  onConfirmIssue,
}) => {
  if (!isOpen) return null;

  const [headline, setHeadline] = useState(
    `EMERGENCY WARNING: Severe ${region.hazardVectors[region.primaryHazard]?.label || 'Hazard'} Triggered for ${region.name}`
  );
  const [instructions, setInstructions] = useState(
    region.tacticalRecommendation
  );
  const [channels, setChannels] = useState({
    capBroadcast: true,
    cellBroadcast: true,
    sirens: true,
    gisFeed: true,
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      onConfirmIssue(region.id, headline, instructions);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-[#FAFAFA] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#27272A] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Authorize Emergency Public Broadcast
              </h2>
              <div className="text-xs font-mono-code text-zinc-400 mt-0.5">
                Common Alerting Protocol (CAP 1.2) · Sector: {region.name} ({region.code})
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

        {/* Verification Summary */}
        <div className="bg-[#09090B] p-3.5 rounded-xl border border-[#27272A] space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Fused Sensor Confidence:</span>
            <strong className="text-emerald-400 font-mono-code">99.4% (Multi-Pass Verified)</strong>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Estimated Population at Risk:</span>
            <strong className="text-rose-400 font-mono-code">{region.populationAtRisk.toLocaleString()} Residents</strong>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Cryptographic Authorization:</span>
            <strong className="text-blue-400 font-mono-code">Role: Administrator (Signed)</strong>
          </div>
        </div>

        {/* Headline Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Public Alert Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Tactical Instructions Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Tactical Action Directives
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Broadcast Channels */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-300">
            Dispatch Transmission Channels
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center space-x-2 bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.cellBroadcast}
                onChange={(e) => setChannels({ ...channels, cellBroadcast: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Cellular Broadcast (SMS)</span>
            </label>

            <label className="flex items-center space-x-2 bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.sirens}
                onChange={(e) => setChannels({ ...channels, sirens: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Municipal Sirens (Level 3)</span>
            </label>

            <label className="flex items-center space-x-2 bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.gisFeed}
                onChange={(e) => setChannels({ ...channels, gisFeed: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>NDMA / CAP GIS Feed</span>
            </label>

            <label className="flex items-center space-x-2 bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.capBroadcast}
                onChange={(e) => setChannels({ ...channels, capBroadcast: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Emergency Radio Relay</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#27272A]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center space-x-2 transition-all active:scale-95"
          >
            {isBroadcasting ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>Transmitting CAP Payload...</span>
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5" />
                <span>Confirm & Transmit Broadcast</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
