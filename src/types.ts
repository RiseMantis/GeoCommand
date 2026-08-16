export type HazardCategory = 'all' | 'flood' | 'wildfire' | 'landslide' | 'cyclone' | 'drought';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type UserRole = 'Analyst' | 'Coordinator' | 'Administrator';

export interface HazardVector {
  type: 'flood' | 'wildfire' | 'landslide' | 'cyclone' | 'drought';
  label: string;
  probability: number; // 0 to 1
  severity: SeverityLevel;
  primarySignals: string[];
}

export interface RegionData {
  id: string;
  code: string; // e.g. "REG-IN-442"
  name: string;
  state: string;
  lat: number;
  lng: number;
  zoomLevel?: number;
  overallSeverity: SeverityLevel;
  primaryHazard: 'flood' | 'wildfire' | 'landslide' | 'cyclone' | 'drought';
  hazardVectors: Record<string, HazardVector>;
  sensorFusionDelta: {
    title: string;
    metrics: Array<{
      label: string;
      value: string;
      trend?: 'up' | 'down' | 'neutral';
      icon: 'radar' | 'droplet' | 'thermometer' | 'wind' | 'mountain' | 'satellite';
    }>;
  };
  tacticalRecommendation: string;
  evacuationCorridor: string;
  resourceStaging: {
    name: string;
    coordinates: [number, number];
    assets: string[];
  };
  historicalTrend: Array<{
    day: string;
    riskScore: number;
    rainfall?: number;
    soilMoisture?: number;
    thermalIndex?: number;
  }>;
  satellitePasses: Array<{
    satellite: string;
    sensor: string;
    lastPassTime: string;
    status: 'VERIFIED' | 'PROCESSING' | 'FLAGGED';
    hash: string;
  }>;
  populationAtRisk: number;
  alertIssued: boolean;
  alertDetails?: {
    issuedAt: string;
    issuedBy: string;
    headline: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: UserRole;
  actor: string;
  action: string;
  category: 'QUERY' | 'ALERT' | 'SECURITY' | 'ROLE_CHANGE' | 'TELEMETRY';
  regionId?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'INFO';
  details: string;
  hash: string;
}

export interface SatelliteFeed {
  id: string;
  name: string;
  agency: string;
  orbitType: string;
  sensorType: string;
  spectralBands: string;
  spatialResolution: string;
  revisitPeriod: string;
  status: 'OPERATIONAL' | 'NOMINAL' | 'DEGRADED';
  activePassesToday: number;
  lastIngestTimestamp: string;
  dataIntegrity: number; // 0-100%
  description: string;
}

export interface RiskModelSpec {
  id: string;
  name: string;
  targetHazard: string;
  framework: string;
  architecture: string;
  rocAuc: number;
  f1Score: number;
  inferenceLatencyMs: number;
  lastTrained: string;
  featuresUsed: string[];
  shapWeights: Array<{ feature: string; weight: number }>;
}
