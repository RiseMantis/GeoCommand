import React, { useState } from 'react';
import { Satellite, Shield, User, Users, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { login, AuthUser } from '../api';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

// Quick-login demo accounts (one per role)
const DEMO_ACCOUNTS = [
  {
    label: 'Data Analyst',
    role: 'analyst' as const,
    email: 'analyst@demo.io',
    password: 'Demo1234!',
    desc: 'Query data, view predictions & heatmaps',
    icon: User,
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700',
    activeColor: 'border-blue-500/60 bg-blue-950/30',
  },
  {
    label: 'Disaster Coordinator',
    role: 'coordinator' as const,
    email: 'coordinator@demo.io',
    password: 'Demo1234!',
    desc: 'Dispatch tactical assets & staging resources',
    icon: Users,
    color: 'text-purple-300',
    bgColor: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700',
    activeColor: 'border-purple-500/60 bg-purple-950/30',
  },
  {
    label: 'Administrator',
    role: 'administrator' as const,
    email: 'admin@demo.io',
    password: 'Demo1234!',
    desc: 'Issue & override public emergency alerts',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700',
    activeColor: 'border-blue-400/60 bg-blue-950/40',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, quickEmail?: string, quickPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = quickEmail ?? email;
    const loginPassword = quickPassword ?? password;

    const { user, error: loginError } = await login(loginEmail, loginPassword);
    setLoading(false);

    if (loginError || !user) {
      setError(loginError || 'Login failed. Is the Python backend running?');
      setActiveQuick(null);
      return;
    }
    onLogin(user);
  };

  const handleQuickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setActiveQuick(account.role);
    setEmail(account.email);
    setPassword(account.password);
    await handleLogin(undefined, account.email, account.password);
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Satellite className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase text-white">GEO-COMMAND</h1>
            <p className="text-xs text-zinc-500 mt-1">Multi-Hazard Disaster Prediction Platform</p>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Team Meowiess · NextGen Hack 2026</span>
          </div>
        </div>

        {/* Quick Login Panel */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Quick Demo Login</div>
            <div className="text-xs text-zinc-500">Select a role to sign in instantly — demonstrates RBAC enforcement</div>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              const isActive = activeQuick === account.role;
              return (
                <button
                  key={account.role}
                  onClick={() => handleQuickLogin(account)}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? account.activeColor + ' border-opacity-100'
                      : 'bg-[#09090B] border-[#27272A] hover:border-zinc-600 hover:bg-zinc-900'
                  } ${loading && !isActive ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                    {isActive && loading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : account.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-100">{account.label}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{account.desc}</div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
                    {account.email}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Manual Login</div>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@demo.io"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/70 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo1234!"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/70 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              {loading && activeQuick === null ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start space-x-2.5 px-4 py-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-600">
          All passwords: <code className="text-zinc-500">Demo1234!</code> · JWT auth enforced server-side
        </p>
      </div>
    </div>
  );
};
