import React, { useState } from 'react';
import { AuditLogEntry, UserRole } from '../types';
import { FileText, Shield, Search, Filter, Download, Lock, CheckCircle, AlertTriangle, User, Hash } from 'lucide-react';

interface OperationsAuditViewProps {
  logs: AuditLogEntry[];
  currentRole: UserRole;
}

export const OperationsAuditView: React.FC<OperationsAuditViewProps> = ({ logs, currentRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((entry) => {
    const matchesSearch =
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.hash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || entry.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Role', 'Actor', 'Category', 'Action', 'Status', 'Hash', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.role}"`,
      `"${l.actor}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.status}"`,
      `"${l.hash}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `geo_command_audit_log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <span>Forensic Operations & Cryptographic Audit Ledger</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable SHA-256 chain of custody for all satellite ingestions, model queries, spoof interventions, and public alert dispatches.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportAuditCSV}
            className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-200 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span>Export Verified CSV</span>
          </button>
        </div>
      </div>

      {/* RBAC Matrix Explainer Card */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono-code flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Role-Based Access Control (RBAC) Governance Matrix</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className={`p-4 rounded-xl border ${currentRole === 'Analyst' ? 'border-blue-500 bg-blue-950/20' : 'border-[#27272A] bg-[#09090B]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">Analyst</span>
              {currentRole === 'Analyst' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono-code">CURRENT</span>}
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Multi-sensor hazard query & filtering</span>
              </li>
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>View risk heatmaps & driving signals</span>
              </li>
              <li className="flex items-center space-x-1.5 text-rose-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Cannot issue public alerts (Forbidden)</span>
              </li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${currentRole === 'Coordinator' ? 'border-blue-500 bg-blue-950/20' : 'border-[#27272A] bg-[#09090B]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">Coordinator</span>
              {currentRole === 'Coordinator' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono-code">CURRENT</span>}
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Dispatch rescue assets & boats</span>
              </li>
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Configure evacuation corridor routing</span>
              </li>
              <li className="flex items-center space-x-1.5 text-rose-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Cannot override public emergency siren</span>
              </li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${currentRole === 'Administrator' ? 'border-blue-500 bg-blue-950/20' : 'border-[#27272A] bg-[#09090B]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">Administrator</span>
              {currentRole === 'Administrator' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono-code">CURRENT</span>}
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-300">
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Issue Common Alerting Protocol (CAP)</span>
              </li>
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Emergency siren & cell broadcast trigger</span>
              </li>
              <li className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Zero-trust override & cyber forensic sign-off</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#18181B] p-3 rounded-2xl border border-[#27272A]">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, hash, or details..."
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'SECURITY', 'ALERT', 'QUERY', 'TELEMETRY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-[#09090B] hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#09090B] border-b border-[#27272A] text-zinc-400 font-mono-code uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono-code text-zinc-400 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-zinc-200">{log.actor}</div>
                    <div className="text-[10px] font-mono-code text-blue-400">{log.role}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                      log.category === 'SECURITY'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                        : log.category === 'ALERT'
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                    }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-100">{log.action}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 max-w-lg leading-relaxed">
                      {log.details}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                        : log.status === 'BLOCKED'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono-code text-[11px] text-zinc-400 whitespace-nowrap">
                    <span className="bg-[#09090B] px-2 py-1 rounded border border-[#27272A] select-all">
                      {log.hash}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
