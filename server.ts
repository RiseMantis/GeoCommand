import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ── Python FastAPI reverse proxy ──────────────────────────
  // Forwards /py-api/* → http://localhost:8000/* so the React
  // frontend can reach the Python backend through the same origin.
  const PYTHON_API = 'http://localhost:8000';

  function proxyToPython(req: express.Request, res: express.Response): void {
    // Strip the /py-api prefix when forwarding
    const targetPath = req.url.replace(/^\/py-api/, '') || '/';

    // Build body buffer upfront so we know Content-Length before opening the socket
    let bodyBuf: Buffer | null = null;
    if (req.body && Object.keys(req.body).length > 0) {
      bodyBuf = Buffer.from(JSON.stringify(req.body), 'utf-8');
    }

    // Build forwarded headers — override content fields if we have a body
    const forwardHeaders: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: 'localhost:8000',
    };
    if (bodyBuf) {
      forwardHeaders['content-type'] = 'application/json';
      forwardHeaders['content-length'] = String(bodyBuf.byteLength);
    } else {
      // Remove content headers so the upstream doesn't wait for a body
      delete forwardHeaders['content-length'];
      delete forwardHeaders['transfer-encoding'];
    }

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: targetPath,
      method: req.method,
      headers: forwardHeaders,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(503).json({ error: 'Python backend unavailable', detail: err.message });
      }
      console.warn('[proxy] Python backend unreachable:', err.message);
    });

    if (bodyBuf) {
      proxyReq.write(bodyBuf);
    }
    proxyReq.end();
  }

  // Register proxy for all methods on /py-api/*
  app.all('/py-api/*', proxyToPython);


  const auditLogsStore: Array<{
    id: string;
    timestamp: string;
    role: string;
    actor: string;
    action: string;
    category: string;
    regionId?: string;
    status: string;
    details: string;
    hash: string;
  }> = [
    {
      id: 'aud-001',
      timestamp: '2026-08-16 07:15:22 UTC',
      role: 'Analyst',
      actor: 'Dr. Shreya Wanjari',
      action: 'Cross-Modal Regional Ingestion Query',
      category: 'QUERY',
      regionId: 'kali-basin',
      status: 'SUCCESS',
      details: 'Queried fused Sentinel-1 SAR + GPM IMERG rainfall stack for Kali River Basin (ID: REG-IN-442). Generated 82% flood probability.',
      hash: '0x9e12a4b981cf0045d',
    },
    {
      id: 'aud-002',
      timestamp: '2026-08-16 07:22:40 UTC',
      role: 'Coordinator',
      actor: 'Mukund Chaurasiya',
      action: 'Resource Staging Plan Dispatch',
      category: 'TELEMETRY',
      regionId: 'kali-basin',
      status: 'INFO',
      details: 'Routed NDRF Platoon Delta & 4x inflatable rescue craft to Sector 4 Riverine Depot coordinates [15.24, 74.39].',
      hash: '0x3a4f89d02e881bc42',
    },
    {
      id: 'aud-003',
      timestamp: '2026-08-16 07:30:15 UTC',
      role: 'Administrator',
      actor: 'Director Neel Sankhe',
      action: 'Zero-Trust Policy Authorization Audit',
      category: 'SECURITY',
      status: 'SUCCESS',
      details: 'Verified SHA-256 Merkle root integrity across 6 active satellite downlinks. Daemon heartbeat nominal.',
      hash: '0x77c90184fa2198ebd',
    },
  ];

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'GEO-COMMAND Tactical Engine', timestamp: new Date().toISOString() });
  });

  // Audit log endpoints
  app.get('/api/audit-logs', (req, res) => {
    res.json({ logs: auditLogsStore });
  });

  app.post('/api/audit-logs', (req, res) => {
    const entry = req.body;
    if (entry && entry.action) {
      const newEntry = {
        id: entry.id || `aud-${Date.now()}`,
        timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        role: entry.role || 'Analyst',
        actor: entry.actor || 'Operations User',
        action: entry.action,
        category: entry.category || 'QUERY',
        regionId: entry.regionId,
        status: entry.status || 'SUCCESS',
        details: entry.details || '',
        hash: entry.hash || `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      };
      auditLogsStore.unshift(newEntry);
      res.json({ success: true, entry: newEntry });
    } else {
      res.status(400).json({ error: 'Invalid audit log entry' });
    }
  });

  // Natural Language Hazard Query Endpoint with Gemini 3.7 Flash
  app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string required' });
    }

    const availableRegions = [
      { id: 'kali-basin', name: 'Kali River Basin', hazard: 'flood', keywords: ['kali', 'basin', 'sar', 'inundation', 'rainfall', 'imerg', 'river', 'flood', 'karnataka', 'goa', 'boat'] },
      { id: 'wayanad-hills', name: 'Wayanad Hill Complex', hazard: 'landslide', keywords: ['wayanad', 'kerala', 'landslide', 'slope', 'soil', 'saturation', 'mudflow', 'insar', 'creep', 'meppadi', 'debris'] },
      { id: 'simlipal-forest', name: 'Simlipal Biosphere Reserve', hazard: 'wildfire', keywords: ['simlipal', 'forest', 'wildfire', 'fire', 'thermal', 'modis', 'viirs', 'ndvi', 'dryness', 'odisha', 'canopy'] },
      { id: 'paradip-coast', name: 'Paradip Coastal Delta', hazard: 'cyclone', keywords: ['paradip', 'cyclone', 'coast', 'surge', 'wind', 'insat', 'pressure', 'storm', 'bay of bengal', 'shelter'] },
      { id: 'marathwada-basin', name: 'Marathwada Agricultural Basin', hazard: 'drought', keywords: ['marathwada', 'drought', 'aridity', 'smap', 'moisture', 'crop', 'reservoir', 'tanker', 'maharashtra'] },
      { id: 'teesta-gorge', name: 'Teesta River Basin & Glacial Lakes', hazard: 'flood', keywords: ['teesta', 'glacial', 'glof', 'lake', 'sikkim', 'moraine', 'cloudburst', 'spillway', 'flash flood'] },
    ];

    // Fallback keyword matcher
    const queryLower = query.toLowerCase();
    let bestMatch = availableRegions[0];
    let maxMatches = 0;

    for (const r of availableRegions) {
      let count = 0;
      for (const kw of r.keywords) {
        if (queryLower.includes(kw)) count++;
      }
      if (count > maxMatches) {
        maxMatches = count;
        bestMatch = r;
      }
    }

    // Attempt Gemini AI Parsing if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are the GEO-COMMAND satellite data fusion AI engine. A disaster response analyst submitted this query:
"${query}"

Given our active monitoring sectors:
1. "kali-basin": Kali River Basin (Flood, SAR inundation +34%, IMERG 90th percentile rainfall)
2. "wayanad-hills": Wayanad Hill Complex (Landslide, SMAP soil saturation 95%, InSAR slope creep)
3. "simlipal-forest": Simlipal Biosphere Reserve (Wildfire, MODIS thermal anomaly 44.8°C, NDVI deficit)
4. "paradip-coast": Paradip Coastal Delta (Cyclone, INSAT-3D central pressure 978hPa, storm surge)
5. "marathwada-basin": Marathwada Basin (Drought, SMAP moisture < 7.8%, reservoir deficit)
6. "teesta-gorge": Teesta River Basin (GLOF Glacial Lake Outburst / Flash Flood, Sentinel-1 moraine expansion)

Analyze the query and determine the most relevant sector ID, the primary hazard category ('flood', 'wildfire', 'landslide', 'cyclone', 'drought'), a concise tactical summary (1 sentence), and the key fused satellite signals detected.
Respond ONLY with a valid JSON object strictly matching this format:
{
  "targetRegionId": "kali-basin",
  "hazardCategory": "flood",
  "reasoning": "Detected rising SAR backscatter inundation and high GPM precipitation signature matching the Kali catchment.",
  "satelliteSources": ["Sentinel-1 SAR", "GPM IMERG", "SRTM DEM"],
  "confidence": 0.94
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = aiResponse.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.targetRegionId) {
            return res.json({
              query,
              matchedRegionId: parsed.targetRegionId,
              hazardCategory: parsed.hazardCategory || bestMatch.hazard,
              reasoning: parsed.reasoning || `Matched query to ${bestMatch.name} hazard vectors.`,
              satelliteSources: parsed.satelliteSources || ['Sentinel-1 SAR', 'GPM IMERG'],
              confidence: parsed.confidence || 0.92,
              source: 'gemini-ai',
            });
          }
        }
      } catch (err) {
        console.warn('Gemini query processing encountered error, using fallback matcher:', err);
      }
    }

    // Fallback response
    return res.json({
      query,
      matchedRegionId: bestMatch.id,
      hazardCategory: bestMatch.hazard,
      reasoning: `Keyword heuristic matched ${bestMatch.name} based on multi-sensor terms.`,
      satelliteSources: ['Sentinel-1 SAR', 'GPM IMERG', 'SMAP', 'MODIS'],
      confidence: maxMatches > 0 ? 0.88 : 0.75,
      source: 'heuristic-engine',
    });
  });

  // Vite middleware for development vs Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GEO-COMMAND] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
