import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_REGIONS, INITIAL_AUDIT_LOGS } from './data/mockData';
import { RegionData, UserRole, HazardCategory, AuditLogEntry } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { SearchBar } from './components/SearchBar';
import { RegionDetailCard } from './components/RegionDetailCard';
import { SystemIntegrityCard } from './components/SystemIntegrityCard';
import { SensorNetworksView } from './components/SensorNetworksView';
import { RiskModelsView } from './components/RiskModelsView';
import { OperationsAuditView } from './components/OperationsAuditView';
import { AlertModal } from './components/AlertModal';
import { TacticalPlanModal } from './components/TacticalPlanModal';
import { LayerControlModal } from './components/LayerControlModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginScreen } from './components/LoginScreen';
import { CheckCircle2, AlertCircle, Server, ServerOff } from 'lucide-react';
import {
  AuthUser,
  checkBackendHealth,
  fetchAuditLog,
  issueAlert,
  clearAuth,
  getCurrentUser,
  ApiAuditEntry,
} from './api';

// ── Helpers: map backend roles → frontend roles ────────────────
function backendRoleToFrontend(role: string): UserRole {
  if (role === 'administrator') return 'Administrator';
  if (role === 'coordinator') return 'Coordinator';
  return 'Analyst';
}

// ── Helpers: map backend audit entries → frontend AuditLogEntry ─
function mapApiAuditEntry(e: ApiAuditEntry): AuditLogEntry {
  const roleMap: Record<string, UserRole> = {
    administrator: 'Administrator',
    coordinator: 'Coordinator',
    analyst: 'Analyst',
    pio: 'Analyst',
    system: 'Administrator',
  };
  const categoryMap: Record<string, AuditLogEntry['category']> = {
    queried_region: 'QUERY',
    nl_query: 'QUERY',
    issued_alert: 'ALERT',
    alert_status_changed: 'ALERT',
    hash_mismatch_detected: 'SECURITY',
    cross_checked_against_rainfall_implausible: 'SECURITY',
    tile_rejected: 'SECURITY',
    forensic_report_logged: 'SECURITY',
    blocked_spoofed_tile: 'SECURITY',
    resource_staging_plan_dispatch: 'TELEMETRY',
    integrity_daemon_verified: 'SECURITY',
    role_change: 'ROLE_CHANGE',
  };
  const statusMap: Record<string, AuditLogEntry['status']> = {
    hash_mismatch_detected: 'BLOCKED',
    cross_checked_against_rainfall_implausible: 'WARNING',
    tile_rejected: 'BLOCKED',
    forensic_report_logged: 'BLOCKED',
  };
  return {
    id: e.id,
    timestamp: e.timestamp.replace('T', ' ').substring(0, 19) + ' UTC',
    role: roleMap[e.actor_role] ?? 'Analyst',
    actor: (e.detail as Record<string, string>)?.actor_name ?? (e.actor_role === 'system' ? 'Integrity Daemon' : e.actor_role),
    action: e.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    category: categoryMap[e.action] ?? 'QUERY',
    regionId: (e.detail as Record<string, string>)?.region_id,
    status: statusMap[e.action] ?? 'SUCCESS',
    details: (e.detail as Record<string, string>)?.message ?? (e.detail as Record<string, string>)?.note ?? JSON.stringify(e.detail ?? {}),
    hash: `0x${e.id.replace(/-/g, '').substring(0, 16)}`,
  };
}

export default function App() {
  // ── Auth state ──────────────────────────────────────────────
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null); // null = checking

  // ── App state ───────────────────────────────────────────────
  const [regions, setRegions] = useState<RegionData[]>(MOCK_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<RegionData>(MOCK_REGIONS[0]);
  const [role, setRole] = useState<UserRole>('Analyst');
  const [activeTab, setActiveTab] = useState<'map' | 'sensors' | 'models' | 'operations'>('map');
  const [hazardFilter, setHazardFilter] = useState<HazardCategory>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'warning' } | null>(null);

  // ── Modal States ────────────────────────────────────────────
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isTacticalModalOpen, setIsTacticalModalOpen] = useState(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // ── Active Map Layers ───────────────────────────────────────
  const [activeLayers, setActiveLayers] = useState({
    sarInundation: true,
    radarRainfall: true,
    thermalHotspots: true,
    evacuationZones: true,
  });

  // ── Backend health check on mount ──────────────────────────
  useEffect(() => {
    checkBackendHealth().then((ok) => setBackendOnline(ok));
  }, []);

  // ── Sync audit log from backend when logged in ──────────────
  const syncAuditLog = useCallback(async () => {
    if (!authUser) return;
    const entries = await fetchAuditLog(50, 0);
    if (entries.length > 0) {
      setAuditLogs(entries.map(mapApiAuditEntry));
    }
  }, [authUser]);

  useEffect(() => {
    syncAuditLog();
  }, [syncAuditLog]);

  // ── Handle login ────────────────────────────────────────────
  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setRole(backendRoleToFrontend(user.role));
    setBackendOnline(true);
    showToast('Authenticated', `Signed in as ${user.name} (${user.role})`, 'success');
    // Sync audit log after login
    setTimeout(() => syncAuditLog(), 300);
  };

  // ── Utilities ───────────────────────────────────────────────
  const showToast = (title: string, desc: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };
    setAuditLogs((prev) => [newEntry, ...prev]);

    // Also sync to legacy Node API for backwards compat
    try {
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).catch(() => {});
    } catch {}
  };

  // ── Region select ───────────────────────────────────────────
  const handleSelectRegion = (region: RegionData) => {
    setSelectedRegion(region);
    addAuditLog({
      role,
      actor: authUser?.name ?? (role === 'Administrator' ? 'Director Neel Sankhe' : role === 'Coordinator' ? 'Mukund Chaurasiya' : 'Dr. Shreya Wanjari'),
      action: `Queried Regional Telemetry: ${region.name}`,
      category: 'QUERY',
      regionId: region.id,
      status: 'SUCCESS',
      details: `Analyzed cross-modal probability vectors for ${region.name} (${region.code}). Peak vector: ${region.overallSeverity}.`,
      hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });
    // Trigger backend audit write via /py-api/regions/{id} (which auto-logs)
    // This happens implicitly when RegionDetailCard calls the detail endpoint
  };

  // ── Search result ───────────────────────────────────────────
  const handleSearchResult = (regionId: string, explanation?: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (region) {
      setSelectedRegion(region);
      setActiveTab('map');
      showToast(
        `Sector Identified: ${region.name}`,
        explanation || `Satellite data fusion matched ${region.hazardVectors[region.primaryHazard]?.label} signature.`
      );
    }
  };

  // ── Spoof intercepted ───────────────────────────────────────
  const handleSpoofIntercepted = (logData: { action: string; details: string; status: 'BLOCKED' | 'WARNING'; hash: string }) => {
    addAuditLog({
      role: 'Administrator',
      actor: 'Automated Integrity Daemon',
      action: logData.action,
      category: 'SECURITY',
      regionId: selectedRegion.id,
      status: logData.status,
      details: logData.details,
      hash: logData.hash,
    });
    showToast('Intrusion Blocked', 'Tampered Sentinel-1 SAR raster tile intercepted and quarantined.', 'warning');
    // Refresh audit log from backend to show server-persisted entries
    setTimeout(() => syncAuditLog(), 500);
  };

  // ── Issue alert (now calls real backend) ───────────────────
  const handleConfirmIssueAlert = async (regionId: string, headline: string, instructions: string) => {
    // Attempt real backend call if we have auth
    if (authUser && authUser.role === 'administrator') {
      const primaryHazard = selectedRegion.primaryHazard;
      const { alert, error } = await issueAlert(regionId, primaryHazard);
      if (error) {
        showToast('Alert Failed', error, 'warning');
        return;
      }
      if (alert) {
        showToast('Alert Issued (Server-Side)', `Alert ID: ${alert.id.substring(0, 8)}…`);
        setTimeout(() => syncAuditLog(), 400);
      }
    }

    // Update local state regardless
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId
          ? {
              ...r,
              alertIssued: true,
              alertDetails: {
                issuedAt: new Date().toISOString(),
                issuedBy: authUser?.name ?? `Director Neel Sankhe (${role})`,
                headline,
              },
            }
          : r
      )
    );

    if (selectedRegion.id === regionId) {
      setSelectedRegion((prev) => ({ ...prev, alertIssued: true }));
    }

    addAuditLog({
      role: 'Administrator',
      actor: authUser?.name ?? 'Director Neel Sankhe',
      action: `Issued Public Emergency Alert: ${selectedRegion.name}`,
      category: 'ALERT',
      regionId: selectedRegion.id,
      status: 'SUCCESS',
      details: `Dispatched Common Alerting Protocol (CAP) multi-channel warning. Headline: "${headline}"`,
      hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });

    showToast('Public Alert Broadcasted', `CAP 1.2 warning transmitted to ${selectedRegion.populationAtRisk.toLocaleString()} residents.`);
  };

  // ── Resource dispatch ───────────────────────────────────────
  const handleDispatchResources = (regionName: string) => {
    addAuditLog({
      role,
      actor: authUser?.name ?? (role === 'Coordinator' ? 'Mukund Chaurasiya' : 'Operations Dispatcher'),
      action: `Dispatched Emergency Logistics: ${regionName}`,
      category: 'TELEMETRY',
      regionId: selectedRegion.id,
      status: 'SUCCESS',
      details: `Routing rescue boats and NDRF field units to ${selectedRegion.resourceStaging.name} coordinates [${selectedRegion.resourceStaging.coordinates.join(', ')}].`,
      hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });
    showToast('Logistics Dispatched', `Emergency assets routed to ${selectedRegion.resourceStaging.name}.`);
  };

  // ── Refresh ─────────────────────────────────────────────────
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Satellite Telemetry Synced', 'Ingested latest Sentinel-1, GPM IMERG, and MODIS downlinks.');
    }, 900);
    syncAuditLog();
  };

  const toggleLayer = (layerKey: 'sarInundation' | 'radarRainfall' | 'thermalHotspots' | 'evacuationZones') => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // ── Role change (UI still shows switcher, real auth still governs) ──
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    addAuditLog({
      role: newRole,
      actor: authUser?.name ?? (newRole === 'Administrator' ? 'Director Neel Sankhe' : newRole === 'Coordinator' ? 'Mukund Chaurasiya' : 'Dr. Shreya Wanjari'),
      action: `Authorization Role Switched to ${newRole}`,
      category: 'ROLE_CHANGE',
      status: 'INFO',
      details: `RBAC access state transitioned to ${newRole}. Permissions updated.`,
      hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });
  };

  // ── Show login screen if not authenticated ──────────────────
  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen bg-[#09090B] text-[#FAFAFA] flex flex-col overflow-hidden font-sans select-none">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={handleRoleChange}
        unreadAlertCount={regions.filter((r) => r.overallSeverity === 'CRITICAL').length}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        authUser={authUser}
        backendOnline={backendOnline}
        onLogout={() => {
          clearAuth();
          setAuthUser(null);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          selectedHazard={hazardFilter}
          onSelectHazard={(h) => setHazardFilter(h)}
          onRefreshData={handleRefreshData}
          onOpenAuditLog={() => setActiveTab('operations')}
          onToggleLayerModal={() => setIsLayerModalOpen(true)}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 relative overflow-hidden bg-[#09090B]">
          {activeTab === 'map' && (
            <div className="w-full h-full relative">
              {/* Interactive Map */}
              <MapView
                regions={regions}
                selectedRegion={selectedRegion}
                onSelectRegion={handleSelectRegion}
                hazardFilter={hazardFilter}
                activeLayers={activeLayers}
              />

              {/* Floating Center Search Bar */}
              <SearchBar
                onSearchResult={handleSearchResult}
                regions={regions}
              />

              {/* Floating Top-Right Region Detail Card */}
              <div className="absolute top-4 right-4 z-20 hidden md:block">
                <RegionDetailCard
                  region={selectedRegion}
                  role={role}
                  onIssueAlertClick={() => setIsAlertModalOpen(true)}
                  onOpenTacticalPlan={() => setIsTacticalModalOpen(true)}
                />
              </div>

              {/* Floating Bottom-Right System Integrity Cyber Defense Card */}
              <div className="absolute bottom-4 right-4 z-20 hidden md:block">
                <SystemIntegrityCard
                  onSpoofIntercepted={handleSpoofIntercepted}
                  role={role}
                  selectedRegionId={selectedRegion.id}
                  backendOnline={backendOnline === true}
                />
              </div>

              {/* Mobile Floating Drawer */}
              <div className="md:hidden absolute bottom-2 left-2 right-2 z-30 max-h-72 overflow-y-auto space-y-2">
                <RegionDetailCard
                  region={selectedRegion}
                  role={role}
                  onIssueAlertClick={() => setIsAlertModalOpen(true)}
                  onOpenTacticalPlan={() => setIsTacticalModalOpen(true)}
                />
                <SystemIntegrityCard
                  onSpoofIntercepted={handleSpoofIntercepted}
                  role={role}
                  selectedRegionId={selectedRegion.id}
                  backendOnline={backendOnline === true}
                />
              </div>
            </div>
          )}

          {activeTab === 'sensors' && (
            <div className="w-full h-full overflow-y-auto bg-[#09090B]">
              <SensorNetworksView />
            </div>
          )}

          {activeTab === 'models' && (
            <div className="w-full h-full overflow-y-auto bg-[#09090B]">
              <RiskModelsView />
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="w-full h-full overflow-y-auto bg-[#09090B]">
              <OperationsAuditView logs={auditLogs} currentRole={role} />
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-[#FAFAFA] animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold text-zinc-100">{toastMessage.title}</div>
            <div className="text-[11px] text-zinc-400">{toastMessage.desc}</div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AlertModal
        region={selectedRegion}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onConfirmIssue={handleConfirmIssueAlert}
      />

      <TacticalPlanModal
        region={selectedRegion}
        isOpen={isTacticalModalOpen}
        onClose={() => setIsTacticalModalOpen(false)}
        role={role}
        onDispatchResources={handleDispatchResources}
      />

      <LayerControlModal
        isOpen={isLayerModalOpen}
        onClose={() => setIsLayerModalOpen(false)}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        regions={regions}
        onSelectRegion={handleSelectRegion}
      />
    </div>
  );
}
