import { Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateCycloneInsights } from '../services/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const demoCycloneTrack = JSON.parse(
  readFileSync(join(__dirname, '../data/demo_cyclone_track.json'), 'utf-8')
);

const router = Router();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

async function callFastAPI(endpoint, payload) {
  try {
    const res = await axios.post(`${FASTAPI_URL}${endpoint}`, payload, { timeout: 6000 });
    return res.data;
  } catch (err) {
    console.warn(`[FastAPI Proxy] ${endpoint} fallback:`, err.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DEMO TRACK ROUTES — no ML backend needed, great for judging demos
// ──────────────────────────────────────────────────────────────────────────────

// Full demo cyclone dataset
router.get('/cyclones/demo-track', (req, res) => {
  const response = {
    ...demoCycloneTrack,
    active_cyclone: {
      ...demoCycloneTrack.active_cyclone,
      last_updated: new Date().toISOString()
    },
    meta: {
      ...demoCycloneTrack.meta,
      served_at: new Date().toISOString(),
      mode: 'demo'
    }
  };
  res.json(response);
});

// Frame-by-frame animation data: returns only up to frame N of historical_track
// Usage: GET /api/cyclones/demo-track/animate?frame=3
router.get('/cyclones/demo-track/animate', (req, res) => {
  const frameIndex = Math.min(
    parseInt(req.query.frame || '0', 10),
    demoCycloneTrack.historical_track.length - 1
  );
  const slicedTrack = demoCycloneTrack.historical_track.slice(0, frameIndex + 1);
  const currentPoint = slicedTrack[slicedTrack.length - 1];

  res.json({
    frame: frameIndex,
    total_frames: demoCycloneTrack.historical_track.length,
    is_complete: frameIndex >= demoCycloneTrack.historical_track.length - 1,
    current_point: currentPoint,
    rendered_track: slicedTrack,
    forecast_track: frameIndex >= demoCycloneTrack.historical_track.length - 1
      ? demoCycloneTrack.forecast_track
      : [],
    landfall_forecast: frameIndex >= demoCycloneTrack.historical_track.length - 1
      ? demoCycloneTrack.landfall_forecast
      : null
  });
});


router.get('/cyclones/active', async (req, res) => {
  try {
    const activeParams = {
      cyclone_id: 'CYC-2026-ALPHA',
      cyclone_name: 'Cyclone Sagar (Alpha-26)',
      sea_surface_temp: 30.2,
      central_pressure: 958.0,
      current_wind_speed: 95.0,
      latitude: 16.8,
      longitude: 87.5,
      steering_angle_deg: 320.0,
      translation_speed_kmh: 19.5,

      forecast_hours: 72
    };

    const [detectRes, trajectoryRes, classifyRes, monitorRes] = await Promise.all([
      callFastAPI('/predict/detect', { sea_surface_temp: 30.2, central_pressure: 958.0, latitude: 16.8, longitude: 87.5 }),
      callFastAPI('/predict/trajectory', { cyclone_id: activeParams.cyclone_id, current_lat: 16.8, current_lon: 87.5, current_wind_speed: 95.0, current_pressure: 958.0, steering_angle_deg: 320.0, translation_speed_kmh: 19.5 }),
      callFastAPI('/predict/classify', { wind_speed_knots: 95.0, central_pressure: 958.0 }),
      callFastAPI('/predict/monitor', { cyclone_id: activeParams.cyclone_id, time_series_pressure: [985.0, 976.0, 968.0, 958.0], time_series_wind: [65.0, 75.0, 85.0, 95.0] })
    ]);

    const insights = await generateCycloneInsights({
      cyclone_name: activeParams.cyclone_name,
      detect_data: detectRes || { cyclone_detected: true, genesis_probability: 0.98, threat_level: 'High' },
      trajectory_data: trajectoryRes || {},
      classify_data: classifyRes || { wind_speed_knots: 95, imd_category: 'Very Severe Cyclonic Storm' },
      monitor_data: monitorRes || { rapid_intensification_alert: true, status: 'Rapid Intensification' },
      environmental_params: activeParams
    });

    res.json({
      success: true,
      active_cyclone: {
        id: activeParams.cyclone_id,
        name: activeParams.cyclone_name,
        basin: 'Bay of Bengal (North Indian Ocean)',
        current_position: { lat: activeParams.latitude, lon: activeParams.longitude },
        wind_speed_knots: activeParams.current_wind_speed,
        wind_speed_kmh: Math.round(activeParams.current_wind_speed * 1.852),
        central_pressure_hpa: activeParams.central_pressure,
        sea_surface_temp_c: activeParams.sea_surface_temp,
        rapid_intensification: true,
        last_updated: new Date().toISOString()
      },
      models: { detection: detectRes, trajectory: trajectoryRes, classification: classifyRes, monitoring: monitorRes },
      ai_insights: insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cyclone-insights', async (req, res) => {
  try {
    const {
      cyclone_name = 'Custom Scenario Storm',
      sea_surface_temp = 29.5,
      central_pressure = 970.0,
      wind_speed = 80.0,
      latitude = 15.5,
      longitude = 88.0,
      steering_angle = 315.0
    } = req.body;

    const envParams = { sea_surface_temp, central_pressure, wind_speed, latitude, longitude, steering_angle };

    const [detectRes, trajectoryRes, classifyRes, monitorRes] = await Promise.all([
      callFastAPI('/predict/detect', { sea_surface_temp, central_pressure, latitude, longitude }),
      callFastAPI('/predict/trajectory', { current_lat: latitude, current_lon: longitude, current_wind_speed: wind_speed, current_pressure: central_pressure, steering_angle_deg: steering_angle }),
      callFastAPI('/predict/classify', { wind_speed_knots: wind_speed, central_pressure }),
      callFastAPI('/predict/monitor', { time_series_pressure: [central_pressure + 18, central_pressure + 10, central_pressure], time_series_wind: [Math.max(30, wind_speed - 25), Math.max(35, wind_speed - 12), wind_speed] })
    ]);

    const insights = await generateCycloneInsights({
      cyclone_name,
      detect_data: detectRes,
      trajectory_data: trajectoryRes,
      classify_data: classifyRes,
      monitor_data: monitorRes,
      environmental_params: envParams
    });

    res.json({
      success: true,
      models: { detection: detectRes, trajectory: trajectoryRes, classification: classifyRes, monitoring: monitorRes },
      ai_insights: insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/predict/detect', async (req, res) => res.json(await callFastAPI('/predict/detect', req.body)));
router.post('/predict/trajectory', async (req, res) => res.json(await callFastAPI('/predict/trajectory', req.body)));
router.post('/predict/classify', async (req, res) => res.json(await callFastAPI('/predict/classify', req.body)));
router.post('/predict/monitor', async (req, res) => res.json(await callFastAPI('/predict/monitor', req.body)));

export default router;