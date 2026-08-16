import React from 'react';
import { Settings, Shield, Globe, Cpu, RefreshCw, X, Radio, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-[#FAFAFA] animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Platform Configuration & Ingestion Diagnostics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Zero-Trust Security */}
          <div className="bg-[#09090B] p-3.5 rounded-xl border border-[#27272A] space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Zero-Trust Ingestion Verification</span>
              </span>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono-code font-bold">
                ENFORCED
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Every satellite raster tile is checked against provider SHA-256 manifests and verified for physical consistency with correlated precipitation & terrain records.
            </p>
          </div>

          {/* AI Inference Mode */}
          <div className="bg-[#09090B] p-3.5 rounded-xl border border-[#27272A] space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>AI Prediction Engine</span>
              </span>
              <span className="text-[10px] bg-blue-950/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono-code font-bold">
                GEMINI 3.7 + PYTORCH
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Cross-modal NLP queries parsed with Gemini 3.7 Flash server-side; raster segmentation computed with PyTorch Hydro-UNet v3.4.
            </p>
          </div>

          {/* Satellite Telemetry Refresh Interval */}
          <div className="bg-[#09090B] p-3.5 rounded-xl border border-[#27272A] space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Downlink Polling Cadence</span>
              </span>
              <span className="text-zinc-300 font-mono-code font-bold">15 Seconds</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-4/5 h-full bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
