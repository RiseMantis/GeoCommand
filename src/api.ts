/**
 * GeoScan API Client
 * Wraps all calls to the Python FastAPI backend at /py-api/*
 * Falls back gracefully when the backend is unavailable.
 */

const BASE = '/py-api';

// ─── Token management (in-memory only) ────────────────────────
let _token: string | null = null;
let _currentUser: AuthUser | null = null;

export function getToken(): string | null { return _token; }
export function getCurrentUser(): AuthUser | null { return _currentUser; }

export function clearAuth() {
  _token = null;
  _currentUser = null;
}

// ─── Types ────────────────────────────────────────────────────
export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
  role: 'analyst' | 'coordinator' | 'administrator' | 'pio';
  access_token: string;
}

export interface ApiHazardScore {
  id: string;
  hazard_type: string;
  probability: number;
  severity: string;
  signals: string[];
  updated_at: string;
}

export interface ApiRecommendation {
  id: string;
  hazard_type: string;
  text: string;
}

export interface ApiRegionListItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  highest_severity: string;
}

export interface ApiRegionDetail {
  id: string;
  name: string;
  lat: number;
  lng: number;
  hazard_scores: ApiHazardScore[];
  recommendations: ApiRecommendation[];
}

export interface ApiAuditEntry {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  detail: Record<string, unknown> | null;
}

export interface ApiAlert {
  id: string;
  region_id: string;
  hazard_type: string;
  issued_by: string;
  status: string;
  created_at: string;
}

export interface ApiSpoofStep {
  step: number;
  message: string;
  status: string;
}

export interface ApiSpoofResult {
  spoof_event_id: string;
  region_id: string;
  tile_hash: string;
  claimed_value: string;
  actual_value: string;
  result: string;
  steps: ApiSpoofStep[];
}

export interface ApiQueryResult {
  matched_region_id: string | null;
  reason: string;
  source: string;
}

// ─── Fetch helper ─────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch {}
      return { data: null, error: detail };
    }
    const data: T = await res.json();
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ─── Auth ─────────────────────────────────────────────────────
export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const { data, error } = await apiFetch<{
    access_token: string;
    role: string;
    user_id: string;
    name: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (error || !data) return { user: null, error: error || 'Login failed' };

  const user: AuthUser = {
    user_id: data.user_id,
    name: data.name,
    email,
    role: data.role as AuthUser['role'],
    access_token: data.access_token,
  };
  _token = data.access_token;
  _currentUser = user;
  return { user, error: null };
}

// ─── Regions ──────────────────────────────────────────────────
export async function fetchRegions(): Promise<ApiRegionListItem[]> {
  const { data } = await apiFetch<ApiRegionListItem[]>('/regions');
  return data ?? [];
}

export async function fetchRegionDetail(id: string): Promise<ApiRegionDetail | null> {
  const { data } = await apiFetch<ApiRegionDetail>(`/regions/${id}`);
  return data;
}

// ─── NL Query ─────────────────────────────────────────────────
export async function nlQuery(text: string): Promise<ApiQueryResult | null> {
  const { data } = await apiFetch<ApiQueryResult>('/query', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return data;
}

// ─── Alerts ───────────────────────────────────────────────────
export async function issueAlert(
  regionId: string,
  hazardType: string
): Promise<{ alert: ApiAlert | null; error: string | null }> {
  const { data, error } = await apiFetch<ApiAlert>('/alerts', {
    method: 'POST',
    body: JSON.stringify({ region_id: regionId, hazard_type: hazardType }),
  });
  return { alert: data, error };
}

export async function fetchAlerts(): Promise<ApiAlert[]> {
  const { data } = await apiFetch<ApiAlert[]>('/alerts');
  return data ?? [];
}

// ─── Spoof Demo ───────────────────────────────────────────────
export async function injectSpoofDemo(regionId: string): Promise<ApiSpoofResult | null> {
  const { data } = await apiFetch<ApiSpoofResult>('/spoof-demo/inject', {
    method: 'POST',
    body: JSON.stringify({ region_id: regionId }),
  });
  return data;
}

// ─── Audit Log ────────────────────────────────────────────────
export async function fetchAuditLog(limit = 50, offset = 0): Promise<ApiAuditEntry[]> {
  const { data } = await apiFetch<ApiAuditEntry[]>(`/audit-log?limit=${limit}&offset=${offset}`);
  return data ?? [];
}

// ─── Health ───────────────────────────────────────────────────
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
