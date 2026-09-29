import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Color map per cyclone phase/category
const PHASE_COLOR = {
  genesis: '#a3e635',          // lime
  depression: '#facc15',       // yellow
  deepening: '#fb923c',        // orange
  cyclone: '#f97316',          // orange-red
  intensifying: '#ef4444',     // red
  rapid_intensification: '#dc2626', // deep red
  peak: '#b91c1c',             // darkest red
  current: '#ef4444',          // red pulsing
  forecast: '#38bdf8',         // cyan
  landfall: '#f97316',         // orange
  weakening: '#94a3b8'         // slate
};

const PHASE_LABEL = {
  genesis: 'Genesis',
  depression: 'Depression',
  deepening: 'Deep Depression',
  cyclone: 'Cyclonic Storm',
  intensifying: 'Intensifying',
  rapid_intensification: '⚡ Rapid Intensification',
  peak: '🔴 Peak Intensity',
  current: '📍 Current Position',
  forecast: 'Forecast',
  landfall: '⚠️ Landfall Zone',
  weakening: 'Weakening'
};

export default function CycloneMap({
  currentPosition = { lat: 16.8, lon: 87.5 },
  waypoints = [],
  landfall = null,
  cycloneName = 'Cyclone Sagar',
  // NEW: historical track for animated demo
  historicalTrack = [],
  forecastTrack = [],
  animationMode = false
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const animTimerRef = useRef(null);

  const totalFrames = historicalTrack.length;
  const hasHistoricalTrack = historicalTrack.length > 0;

  // ─── Map Initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [currentPosition.lon, currentPosition.lat],
      zoom: 5.2,
      attributionControl: false
    });

    mapInstance.current = map;

    map.on('load', () => {
      // Sources and layers for historical, forecast, and fallback path
      map.addSource('historical-path', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
      });
      map.addSource('forecast-path', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
      });
      // fallback (non-animated) path
      map.addSource('cyclone-path', {
        type: 'geojson',
        data: {
          type: 'Feature', properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[currentPosition.lon, currentPosition.lat], ...waypoints.map(w => [w.lon, w.lat])]
          }
        }
      });

      // Historical track — solid warm gradient line
      map.addLayer({
        id: 'historical-glow', type: 'line', source: 'historical-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ef4444', 'line-width': 8, 'line-opacity': 0.3, 'line-blur': 6 }
      });
      map.addLayer({
        id: 'historical-line', type: 'line', source: 'historical-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#f97316', 'line-width': 2.5 }
      });

      // Forecast track — dashed cyan
      map.addLayer({
        id: 'forecast-glow', type: 'line', source: 'forecast-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#06b6d4', 'line-width': 7, 'line-opacity': 0.35, 'line-blur': 4 }
      });
      map.addLayer({
        id: 'forecast-line', type: 'line', source: 'forecast-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-dasharray': [2, 1.5] }
      });

      // Fallback path (when no historical track)
      map.addLayer({
        id: 'cyclone-path-glow', type: 'line', source: 'cyclone-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#06b6d4', 'line-width': 7, 'line-opacity': 0.45, 'line-blur': 4 }
      });
      map.addLayer({
        id: 'cyclone-path-line', type: 'line', source: 'cyclone-path',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#38bdf8', 'line-width': 2.5, 'line-dasharray': [2, 1] }
      });

      // Draw static markers (fallback mode)
      if (!hasHistoricalTrack) {
        drawFallbackMarkers(map);
      }
    });

    return () => {
      clearInterval(animTimerRef.current);
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ─── Draw Fallback Markers (no historical track) ───────────────────────────
  function drawFallbackMarkers(map) {
    const currentEl = document.createElement('div');
    currentEl.innerHTML = `
      <div style="width:32px;height:32px;background:rgba(239,68,68,0.25);border:2px solid #ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #ef4444;cursor:pointer;">
        <div style="width:10px;height:10px;background:#ef4444;border-radius:50%;"></div>
      </div>`;
    const m = new maplibregl.Marker({ element: currentEl })
      .setLngLat([currentPosition.lon, currentPosition.lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
        `<div style="color:#070c18;padding:6px;font-family:sans-serif;">
          <strong style="color:#ef4444;">${cycloneName} (Eye Center)</strong><br/>
          Lat: ${currentPosition.lat}°N, Lon: ${currentPosition.lon}°E<br/>Status: Active & Intensifying
        </div>`))
      .addTo(map);
    markersRef.current.push(m);

    waypoints.forEach(pt => {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:14px;height:14px;background:#06b6d4;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px #06b6d4;cursor:pointer;"></div>`;
      const wm = new maplibregl.Marker({ element: el })
        .setLngLat([pt.lon, pt.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="color:#070c18;padding:6px;font-family:sans-serif;">
            <strong>T+${pt.step_hours}h Forecast</strong><br/>
            Wind: ${pt.wind_speed_knots} kt<br/>Pressure: ${pt.pressure_hpa} hPa<br/>Category: ${pt.category}
          </div>`))
        .addTo(map);
      markersRef.current.push(wm);
    });

    if (landfall) {
      const lfEl = document.createElement('div');
      lfEl.innerHTML = `<div style="background:#f97316;color:#fff;font-weight:bold;font-size:10px;padding:3px 6px;border-radius:4px;border:1px solid #fff;box-shadow:0 0 12px #f97316;cursor:pointer;">⚠️ LANDFALL +${landfall.estimated_time_hours}h</div>`;
      const lm = new maplibregl.Marker({ element: lfEl })
        .setLngLat([landfall.projected_lon, landfall.projected_lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="color:#070c18;padding:6px;font-family:sans-serif;">
            <strong style="color:#f97316;">Projected Coastal Landfall</strong><br/>
            Sector: ${landfall.estimated_region}<br/>Winds: ${landfall.wind_at_landfall_knots} knots
          </div>`))
        .addTo(map);
      markersRef.current.push(lm);
    }
  }

  // ─── Animation: update map on frameIndex change ────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded() || !hasHistoricalTrack) return;

    const visibleTrack = historicalTrack.slice(0, frameIndex + 1);
    const coords = visibleTrack.map(p => [p.lon, p.lat]);

    // Update historical path line
    map.getSource('historical-path')?.setData({
      type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: coords }
    });

    // Show forecast only on final frame
    const isFinal = frameIndex >= totalFrames - 1;
    const forecastCoords = isFinal
      ? [[currentPosition.lon, currentPosition.lat], ...forecastTrack.map(p => [p.lon, p.lat])]
      : [];
    map.getSource('forecast-path')?.setData({
      type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: forecastCoords }
    });

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Draw track waypoint dots
    visibleTrack.forEach((pt, i) => {
      const color = PHASE_COLOR[pt.phase] || '#38bdf8';
      const isCurrent = i === visibleTrack.length - 1;
      const el = document.createElement('div');
      if (isCurrent) {
        el.innerHTML = `<div style="width:${isFinal ? 32 : 22}px;height:${isFinal ? 32 : 22}px;background:${color}33;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${color};cursor:pointer;animation:pulse 1.5s infinite;">
          <div style="width:${isFinal ? 10 : 7}px;height:${isFinal ? 10 : 7}px;background:${color};border-radius:50%;"></div></div>`;
      } else {
        el.innerHTML = `<div style="width:11px;height:11px;background:${color};border:1.5px solid #fff;border-radius:50%;opacity:0.85;cursor:pointer;"></div>`;
      }
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pt.lon, pt.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="color:#070c18;padding:8px;font-family:sans-serif;min-width:180px;">
            <strong style="color:${color};">${PHASE_LABEL[pt.phase] || pt.phase}</strong><br/>
            <em style="font-size:11px;color:#555;">${pt.label}</em><br/><br/>
            💨 Wind: <strong>${pt.wind_speed_knots} kt</strong><br/>
            📉 Pressure: <strong>${pt.pressure_hpa} hPa</strong><br/>
            🌡️ SST: ${pt.sea_surface_temp_c || '—'}°C<br/>
            📋 Category: ${pt.category}
          </div>`))
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Forecast markers on final frame
    if (isFinal) {
      forecastTrack.forEach(pt => {
        const color = pt.phase === 'landfall' ? '#f97316' : '#38bdf8';
        const el = document.createElement('div');
        el.innerHTML = pt.phase === 'landfall'
          ? `<div style="background:#f97316;color:#fff;font-weight:bold;font-size:10px;padding:3px 7px;border-radius:4px;box-shadow:0 0 12px #f97316;cursor:pointer;">⚠️ LANDFALL +${pt.step_hours}h</div>`
          : `<div style="width:12px;height:12px;background:${color};border:1.5px solid #fff;border-radius:50%;opacity:0.8;cursor:pointer;"></div>`;
        const fm = new maplibregl.Marker({ element: el })
          .setLngLat([pt.lon, pt.lat])
          .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div style="color:#070c18;padding:8px;font-family:sans-serif;">
              <strong style="color:${color};">T+${pt.step_hours}h ${PHASE_LABEL[pt.phase] || 'Forecast'}</strong><br/>
              💨 Wind: ${pt.wind_speed_knots} kt<br/>📉 Pressure: ${pt.pressure_hpa} hPa<br/>📋 ${pt.category}
            </div>`))
          .addTo(map);
        markersRef.current.push(fm);
      });

      // Fly to current position on final frame
      map.flyTo({ center: [currentPosition.lon, currentPosition.lat], zoom: 5.5, duration: 1200 });
    } else {
      // Pan to current animated point
      const cur = visibleTrack[visibleTrack.length - 1];
      map.easeTo({ center: [cur.lon, cur.lat], zoom: 5, duration: 800 });
    }
  }, [frameIndex, hasHistoricalTrack]);

  // ─── Animation Play/Pause logic ───────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      animTimerRef.current = setInterval(() => {
        setFrameIndex(prev => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            clearInterval(animTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    } else {
      clearInterval(animTimerRef.current);
    }
    return () => clearInterval(animTimerRef.current);
  }, [isPlaying, totalFrames]);

  const currentTrackPoint = hasHistoricalTrack ? historicalTrack[frameIndex] : null;

  return (
    <div className="map-viewport-wrapper" style={{ position: 'relative' }}>
      <div ref={mapContainer} className="map-viewport" />

      {/* Top badge */}
      <div className="map-overlay-badge">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="pulse-dot" style={{ color: 'var(--alert-red)' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            {hasHistoricalTrack ? 'DEMO TRACK · ANIMATED GENESIS → LANDFALL' : 'MAPLIBRE RADAR · RECURRENT ML TRAJECTORY'}
          </span>
        </div>
      </div>

      {/* Animation Controls — only show if historical track exists */}
      {hasHistoricalTrack && (
        <div style={{
          position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(7,12,24,0.92)', border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center',
          gap: '14px', zIndex: 10, backdropFilter: 'blur(8px)', minWidth: '340px'
        }}>
          {/* Play/Pause/Reset */}
          <button
            onClick={() => { setFrameIndex(0); setIsPlaying(false); }}
            title="Reset"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '2px 4px' }}>
            ⏮
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              background: isPlaying ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)',
              border: `1px solid ${isPlaying ? '#ef4444' : '#38bdf8'}`,
              borderRadius: '8px', color: isPlaying ? '#ef4444' : '#38bdf8',
              cursor: 'pointer', fontWeight: 700, padding: '4px 14px', fontSize: '14px'
            }}>
            {isPlaying ? '⏸ Pause' : '▶ Play Track'}
          </button>

          {/* Scrubber */}
          <input
            type="range" min={0} max={totalFrames - 1} value={frameIndex}
            onChange={e => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
            style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
          />

          {/* Frame label */}
          <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>
            {currentTrackPoint
              ? <span style={{ color: PHASE_COLOR[currentTrackPoint.phase] || '#38bdf8' }}>
                  {PHASE_LABEL[currentTrackPoint.phase] || currentTrackPoint.phase}
                </span>
              : `Frame ${frameIndex + 1}/${totalFrames}`}
          </div>
        </div>
      )}

      {/* Live telemetry mini-card during animation */}
      {hasHistoricalTrack && currentTrackPoint && (
        <div style={{
          position: 'absolute', top: '52px', right: '12px',
          background: 'rgba(7,12,24,0.88)', border: `1px solid ${PHASE_COLOR[currentTrackPoint.phase] || '#38bdf8'}`,
          borderRadius: '10px', padding: '10px 14px', zIndex: 10, backdropFilter: 'blur(8px)',
          fontSize: '12px', color: '#cbd5e1', minWidth: '170px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: PHASE_COLOR[currentTrackPoint.phase], marginBottom: '6px' }}>
            {currentTrackPoint.label}
          </div>
          <div>💨 Wind: <strong style={{ color: '#fff' }}>{currentTrackPoint.wind_speed_knots} kt</strong></div>
          <div>📉 Pressure: <strong style={{ color: '#fff' }}>{currentTrackPoint.pressure_hpa} hPa</strong></div>
          <div>📋 {currentTrackPoint.category}</div>
          {currentTrackPoint.rapid_intensification && (
            <div style={{ marginTop: '4px', color: '#ef4444', fontWeight: 700 }}>⚡ RAPID INTENSIFICATION</div>
          )}
        </div>
      )}
    </div>
  );
}