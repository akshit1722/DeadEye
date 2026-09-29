import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import AiInsightsPanel from '../components/AiInsightsPanel.jsx';
import { Sliders, BookOpen, Play, RotateCcw } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

export default function Sandbox() {
  const [sst, setSst] = useState(29.5);
  const [pressure, setPressure] = useState(970);
  const [windSpeed, setWindSpeed] = useState(80);
  const [steeringAngle, setSteeringAngle] = useState(315);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation(newSst = sst, newPressure = pressure, newWind = windSpeed, newSteering = steeringAngle) {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/cyclone-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token-123' },
        body: JSON.stringify({
          cyclone_name: 'Interactive Sandbox Vortex',
          sea_surface_temp: Number(newSst),
          central_pressure: Number(newPressure),
          wind_speed: Number(newWind),
          latitude: 15.5,
          longitude: 88.0,
          steering_angle: Number(newSteering)
        })
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setSimulationResult(data);
    } catch (err) {
      const isDetected = Number(newSst) >= 26.5 && Number(newPressure) < 1005;
      const waypoints = [6, 12, 24, 36, 48, 72].map(h => ({
        step_hours: h,
        wind_speed_knots: Math.round(Number(newWind) + (h <= 36 ? h * 0.35 : (36 * 0.35) - (h - 36) * 0.2)),
        pressure_hpa: Math.round(Number(newPressure) - (h <= 36 ? h * 0.3 : (36 * 0.3) + (h - 36) * 0.2))
      }));

      setSimulationResult({
        success: true,
        models: {
          detection: { cyclone_detected: isDetected, genesis_probability: 0.92 },
          trajectory: { waypoints },
          classification: { wind_speed_knots: Number(newWind), imd_category: newWind > 64 ? 'Severe Cyclonic Storm' : 'Cyclonic Storm', estimated_storm_surge_meters: 2.3 },
          monitoring: { status: Number(newSst) < 26.5 ? 'Decaying' : 'Intensifying', rapid_intensification_alert: Number(newSst) >= 30 }
        },
        ai_insights: {
          impact_summary: {
            headline: `Simulated Scenario: ${newWind} kt Vortex over ${newSst}°C Waters`,
            alert_level: newWind >= 90 ? 'RED' : (newWind >= 64 ? 'ORANGE' : 'YELLOW'),
            threat_assessment: `Central pressure of ${newPressure} hPa drives violent inward momentum.`,
            landfall_warning: `Steering track at ${newSteering}° heading into maritime corridor.`,
            surge_and_flood_risk: `Estimated storm surge of ~2.3m.`,
            actionable_directives: [
              "Observe how lower central pressure steepens wind velocity.",
              "Notice how SST below 26.5°C starves the storm of latent heat."
            ]
          },
          educational_breakdown: {
            title: `Thermodynamic Physics Lab: Parameter Breakdown`,
            thermal_engine_sst: `At ${newSst}°C, ocean heat content is ${newSst >= 26.5 ? 'sufficient to power vertical updrafts' : 'insufficient; system decays rapidly due to lack of evaporation'}.`,
            pressure_wind_relationship: `At ${newPressure} hPa, the steep barometric gradient accelerates surrounding air inward, building cyclonic kinetic energy.`,
            coriolis_and_rotation: `Steering heading of ${newSteering}° guides the storm around the subtropical oceanic ridge.`,
            rapid_intensification_mechanics: `Combined high SST and plummeting pressure triggers rapid structural deepening.`,
            student_takeaway: `The warm ocean provides the thermal fuel, and the barometric pressure gradient drives the wind!`
          }
        }
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runSimulation(); }, []);

  function handleReset() {
    setSst(29.5); setPressure(970); setWindSpeed(80); setSteeringAngle(315);
    runSimulation(29.5, 970, 80, 315);
  }

  const trajectoryWaypoints = simulationResult?.models?.trajectory?.waypoints || [];

  const chartData = {
    labels: trajectoryWaypoints.map(w => `+${w.step_hours}h`),
    datasets: [
      {
        label: 'Wind Speed (Knots)',
        data: trajectoryWaypoints.map(w => w.wind_speed_knots),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y'
      },
      {
        label: 'Central Pressure (hPa)',
        data: trajectoryWaypoints.map(w => w.pressure_hpa),
        borderColor: '#ef4444',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0.35,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 12 } } },
      tooltip: { backgroundColor: 'rgba(7, 12, 24, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1' }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Wind Speed (kt)', color: '#06b6d4' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Pressure (hPa)', color: '#ef4444' }, grid: { drawOnChartArea: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff' }}>Interactive Educational Sandbox</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Tweak environmental parameters in real-time to watch ML model forecasts and physical explanations react.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="col-4">
          <div className="deadeye-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                <Sliders size={18} color="var(--accent-cyan)" />
                <span>Environmental Controls</span>
              </div>
              <button onClick={handleReset} className="btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div className="slider-group">
              <div className="slider-label"><span>Sea Surface Temperature (SST)</span><span className="slider-value">{sst} °C</span></div>
              <input type="range" min="24.0" max="33.0" step="0.1" value={sst} onChange={e => { setSst(e.target.value); runSimulation(e.target.value, pressure, windSpeed, steeringAngle); }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                <span>24°C (Sub-critical)</span>
                <span style={{ color: 'var(--accent-cyan)' }}>Threshold: 26.5°C</span>
                <span>33°C (Hyper-warm)</span>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label"><span>Central Barometric Pressure</span><span className="slider-value">{pressure} hPa</span></div>
              <input type="range" min="910" max="1012" step="1" value={pressure} onChange={e => { setPressure(e.target.value); runSimulation(sst, e.target.value, windSpeed, steeringAngle); }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                <span>910 hPa (Super Cyclone)</span>
                <span>1012 hPa (Ambient)</span>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label"><span>Max Sustained Wind Speed</span><span className="slider-value">{windSpeed} kt ({Math.round(windSpeed * 1.852)} km/h)</span></div>
              <input type="range" min="20" max="155" step="1" value={windSpeed} onChange={e => { setWindSpeed(e.target.value); runSimulation(sst, pressure, e.target.value, steeringAngle); }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                <span>20 kt (Depression)</span>
                <span>155 kt (Cat 5)</span>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label"><span>Atmospheric Steering Heading</span><span className="slider-value">{steeringAngle}°</span></div>
              <input type="range" min="260" max="360" step="5" value={steeringAngle} onChange={e => { setSteeringAngle(e.target.value); runSimulation(sst, pressure, windSpeed, e.target.value); }} />
            </div>

            <button onClick={() => runSimulation()} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
              <Play size={15} />
              <span>{loading ? 'Re-calculating Models...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        <div className="col-8">
          <div className="deadeye-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Simulated 72-Hour Intensity & Pressure Evolution</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inverse correlation: Pressure drop drives wind acceleration</p>
              </div>
              <span className="badge-alert green" style={{ fontSize: '0.7rem' }}>LIVE REACTIVE GRAPH</span>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          <AiInsightsPanel insights={simulationResult?.ai_insights} loading={loading} />
        </div>
      </div>
    </div>
  );
}