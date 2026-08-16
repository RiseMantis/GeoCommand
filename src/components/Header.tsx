import React from 'react';
import { UserRole } from '../types';
import { AuthUser } from '../api';
import { Shield, Bell, User, Settings, Satellite, AlertTriangle, CheckCircle2, ChevronDown, Lock, LogOut, ServerOff, Server } from 'lucide-react';

interface HeaderProps {
  activeTab: 'map' | 'sensors' | 'models' | 'operations';
  setActiveTab: (tab: 'map' | 'sensors' | 'models' | 'operations') => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  authUser?: AuthUser | null;
  backendOnline?: boolean | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  role,
  setRole,
  unreadAlertCount,
  onOpenNotifications,
  onOpenSettings,
  authUser,
  backendOnline,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  const roles: Array<{ role: UserRole; title: string; desc: string }> = [
    { role: 'Analyst', title: 'Data Analyst', desc: 'Query data, view predictions & multi-hazard heatmaps' },
    { role: 'Coordinator', title: 'Disaster Coordinator', desc: 'Dispatch tactical assets & stage rescue resources' },
    { role: 'Administrator', title: 'Civil Defence Administrator', desc: 'Authorized to issue & override public alerts' },
  ];

  return (
    <header className="h-16 bg-[#18181B] border-b border-[#27272A] px-4 md:px-6 flex items-center justify-between relative z-40 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <div 
          onClick={() => setActiveTab('map')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-sans font-bold text-lg md:text-xl tracking-tight text-[#FAFAFA] uppercase group-hover:text-white transition-colors">
              GEO-COMMAND
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Bento style nav */}
        <nav className="hidden lg:flex items-center space-x-1 pl-4 bg-[#09090B] p-1 rounded-xl border border-[#27272A]">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-[#18181B] text-white shadow-sm border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            Hazard Map
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sensors'
                ? 'bg-[#18181B] text-white shadow-sm border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            Sensor Networks
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'models'
                ? 'bg-[#18181B] text-white shadow-sm border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            Risk Models
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'operations'
                ? 'bg-[#18181B] text-white shadow-sm border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            Operations
          </button>
        </nav>
      </div>

      {/* Right Controls: Role Switcher, Notifications, Profile, Settings */}
      <div className="flex items-center space-x-3 md:space-x-3">
        {/* Backend Status Indicator */}
        <div className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold ${
          backendOnline === true
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
            : backendOnline === false
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
            : 'bg-zinc-900 border-zinc-700 text-zinc-500'
        }`}>
          {backendOnline === true ? <Server className="w-3 h-3" /> : <ServerOff className="w-3 h-3" />}
          <span>{backendOnline === true ? 'API ONLINE' : backendOnline === false ? 'API OFFLINE' : 'CHECKING…'}</span>
        </div>

        {/* Hackathon Badge */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#09090B] border border-[#27272A] text-xs text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-zinc-400">Team Meowiess · NextGen Hack</span>
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#09090B] hover:bg-zinc-900 border border-[#27272A] text-xs text-zinc-200 font-semibold transition-colors"
            title="Switch authorization role"
          >
            <span className="text-zinc-500 font-mono-code">Role:</span>
            <span className={`${
              role === 'Administrator' ? 'text-blue-400' : role === 'Coordinator' ? 'text-purple-400' : 'text-zinc-200'
            }`}>
              {role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-[#27272A] mb-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  Role-Based Access Control (RBAC)
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Controls permission to broadcast alerts & dispatch assets
                </div>
              </div>

              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start space-x-2.5 my-1 ${
                    role === r.role
                      ? 'bg-[#27272A] text-white border border-zinc-700'
                      : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {r.role === 'Administrator' ? (
                      <Shield className="w-4 h-4 text-blue-400" />
                    ) : r.role === 'Coordinator' ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <User className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{r.role}</span>
                      {role === r.role && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono-code font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      {r.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-[#09090B] hover:bg-zinc-900 border border-[#27272A] text-zinc-400 hover:text-white transition-colors"
          title="Active Alerts & Incidents"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-lg">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <div 
          className="flex items-center space-x-2 pl-1 cursor-pointer group"
          title={`Signed in as ${authUser?.name ?? (role === 'Administrator' ? 'Director Neel Sankhe' : role === 'Coordinator' ? 'Mukund Chaurasiya' : 'Dr. Shreya Wanjari')}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {(authUser?.name ?? (role === 'Administrator' ? 'Director Neel Sankhe' : role === 'Coordinator' ? 'Mukund Chaurasiya' : 'Dr. Shreya Wanjari')).split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#09090B] hover:bg-zinc-900 border border-[#27272A] text-zinc-400 hover:text-white transition-colors"
          title="Platform Settings & Ingestion Diagnostics"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-[#09090B] hover:bg-rose-950 border border-[#27272A] hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
