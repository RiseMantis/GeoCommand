import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Radio, RefreshCw, Terminal, CheckCircle2, AlertOctagon } from 'lucide-react';
import { UserRole } from '../types';
import { injectSpoofDemo } from '../api';

interface SystemIntegrityCardProps {
  onSpoofIntercepted: (logDetails: {
    action: string;
    details: string;
    status: 'BLOCKED' | 'WARNING';
    hash: string;
  }) => void;
  role: UserRole;
  selectedRegionId?: string;
  backendOnline?: boolean;
}

export const SystemIntegrityCard: React.FC<SystemIntegrityCardProps> = ({
  onSpoofIntercepted,
  role,
  selectedRegionId = 'kali-basin',
  backendOnline = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '>> Integrity daemon listening on Sentinel-1 & GPM downlink streams...',
  ]);
  const [spoofStatus, setSpoofStatus] = useState<'idle' | 'running' | 'blocked'>('idle');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSimulateSpoofedTile = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSpoofStatus('running');
    setLogs(['>> Initiating test payload: Injecting spoofed SAR tile (S1-INU-442)...']);

    // ── Real backend path ──────────────────────────────────────
    if (backendOnline) {
      const result = await injectSpoofDemo(selectedRegionId);
      if (result) {
        // Animate through the server-returned steps
        result.steps.forEach((step, index) => {
          setTimeout(() => {
            setLogs((prev) => [...prev, `>> ${step.message}`]);

            if (index === result.steps.length - 1) {
              setIsRunning(false);
              setSpoofStatus('blocked');
              onSpoofIntercepted({
                action: 'Blocked Spoofed SAR Satellite Tile (S1-INU-442)',
                details: `Intercepted malicious SAR tile suppressing flood inundation from ${result.actual_value} down to ${result.claimed_value}. Server-side hash mismatch (${result.tile_hash}) and rainfall physics correlation failed. Restored baseline feed. Event: ${result.spoof_event_id.substring(0, 8)}.`,
                status: 'BLOCKED',
                hash: `0x${result.spoof_event_id.replace(/-/g, '').substring(0, 16)}`,
              });
            }
          }, index * 900);
        });
        return;
      }
      // Fall through to client-side simulation if backend call failed
      setLogs((prev) => [...prev, '>> Backend response error — running local simulation...']);
    }

    // ── Client-side fallback simulation ───────────────────────
    const steps = [
      { delay: 800, text: '>> [STAGE 1] Checking file SHA-256 against ESA Copernicus manifest... ⚠️ MISMATCH' },
      { delay: 1600, text: '>> [STAGE 2] Cross-checking against GPM IMERG rainfall record... ❌ IMPLAUSIBLE (Rainfall >90th percentile cannot yield 12% SAR inundation)' },
      { delay: 2400, text: '>> [STAGE 3] Rejecting rogue tile. Rolling back to last verified Sentinel-1 SAR pass #8841 (46% inundation)...' },
      { delay: 3200, text: '>> [STAGE 4] Threat neutralized. Forensic telemetry report generated & committed to cryptographic audit ledger.' },
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step.text]);

        if (index === steps.length - 1) {
          setIsRunning(false);
          setSpoofStatus('blocked');
          const incidentHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
          
          onSpoofIntercepted({
            action: 'Blocked Spoofed SAR Satellite Tile (S1-INU-442)',
            details: 'Intercepted malicious SAR tile suppressing flood inundation from 46% down to 12%. Manifest hash mismatch and rainfall physics correlation failed. Restored baseline feed.',
            status: 'BLOCKED',
            hash: incidentHash,
          });
        }
      }, step.delay);
    });
  };

  const handleReset = () => {
    setSpoofStatus('idle');
    setLogs(['>> Integrity daemon listening on Sentinel-1 & GPM downlink streams...']);
  };

  return (
    <div className="w-full max-w-[380px] bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] rounded-2xl p-4 shadow-2xl text-[#FAFAFA] flex flex-col space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
      {/* Title & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono-code">System Integrity</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Backend indicator */}
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
            backendOnline
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-900 border-zinc-700 text-zinc-600'
          }`}>
            {backendOnline ? 'SERVER' : 'LOCAL'}
          </span>
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Shield className={`w-3.5 h-3.5 ${spoofStatus === 'blocked' ? 'text-emerald-400' : 'text-blue-400'}`} />
            <span className={`text-[10px] font-mono-code font-bold ${spoofStatus === 'blocked' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {spoofStatus === 'blocked' ? 'VERIFIED' : 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Simulate Spoofed Tile */}
      <div className="flex space-x-2">
        <button
          onClick={handleSimulateSpoofedTile}
          disabled={isRunning}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
            isRunning
              ? 'bg-zinc-900 border-blue-500/50 text-blue-300 animate-pulse'
              : 'bg-[#09090B] hover:bg-zinc-800 text-zinc-200 border-[#27272A] hover:border-zinc-600 shadow-sm active:scale-95'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
          <span>{isRunning ? 'Analyzing Ingestion Stream...' : 'Simulate Spoofed Tile'}</span>
        </button>

        {spoofStatus === 'blocked' && (
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-[#09090B] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-[#27272A]"
            title="Reset Daemon Terminal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Terminal Console Box */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 h-36 overflow-y-auto font-mono-code text-[11px] space-y-1.5 terminal-glow select-text">
        {logs.map((log, index) => {
          let textColor = 'text-zinc-400';
          if (log.includes('MISMATCH') || log.includes('IMPLAUSIBLE') || log.includes('STAGE') || log.includes('STAGE')) {
            textColor = 'text-rose-400 font-semibold';
          } else if (log.includes('neutralized') || log.includes('PRESERVED') || log.includes('Restoring') || log.includes('Threat') || log.includes('committed')) {
            textColor = 'text-emerald-400 font-semibold';
          } else if (log.includes('Initiating') || log.includes('Injecting')) {
            textColor = 'text-amber-400';
          } else if (log.includes('error') || log.includes('REJECTED') || log.includes('Rejecting')) {
            textColor = 'text-rose-400 font-semibold';
          }

          return (
            <div key={index} className={`${textColor} leading-relaxed break-words`}>
              {log}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* End State Banner */}
      {spoofStatus === 'blocked' && (
        <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center space-x-2 animate-in fade-in duration-200 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">
            Spoofed data blocked — authentic SAR data restored{backendOnline ? ' (server-persisted)' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
