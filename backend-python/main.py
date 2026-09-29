import math
from typing import List, Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="DeadEye Cyclone ML Model Serving Gateway",
    description="Serves Detection, Trajectory, Classification, and Monitoring ML models",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DetectInput(BaseModel):
    sea_surface_temp: float = Field(29.5, description="Sea Surface Temperature in °C")
    central_pressure: float = Field(998.0, description="Central atmospheric pressure in hPa")
    vorticity: Optional[float] = Field(12.5)
    relative_humidity: Optional[float] = Field(82.0)
    latitude: float = Field(15.2)
    longitude: float = Field(88.4)
    vertical_wind_shear: Optional[float] = Field(8.0)

class TrajectoryInput(BaseModel):
    cyclone_id: Optional[str] = "CYC-2026-ALPHA"
    current_lat: float = Field(15.2)
    current_lon: float = Field(88.4)
    current_wind_speed: float = Field(85.0)
    current_pressure: float = Field(968.0)
    steering_angle_deg: Optional[float] = Field(315.0)
    translation_speed_kmh: Optional[float] = Field(18.0)
    forecast_hours: Optional[int] = Field(72)

class ClassifyInput(BaseModel):
    wind_speed_knots: float = Field(85.0)
    central_pressure: Optional[float] = Field(968.0)
    eye_diameter_km: Optional[float] = Field(28.0)
    basin: Optional[str] = Field("North Indian Ocean")

class MonitorInput(BaseModel):
    cyclone_id: Optional[str] = "CYC-2026-ALPHA"
    time_series_pressure: Optional[List[float]] = Field(default=[990.0, 982.0, 974.0, 968.0])
    time_series_wind: Optional[List[float]] = Field(default=[55.0, 65.0, 75.0, 85.0])
    satellite_convective_score: Optional[float] = Field(0.88)
    radar_reflectivity_dbz: Optional[float] = Field(48.5)

def calculate_imd_category(wind_knots: float) -> Dict[str, Any]:
    if wind_knots < 17:
        return {"category": "Low Pressure Area", "code": "LPA", "severity": "Low", "saffir_simpson": "Tropical Depression"}
    elif wind_knots <= 27:
        return {"category": "Depression", "code": "D", "severity": "Moderate", "saffir_simpson": "Tropical Depression"}
    elif wind_knots <= 33:
        return {"category": "Deep Depression", "code": "DD", "severity": "Elevated", "saffir_simpson": "Tropical Depression"}
    elif wind_knots <= 47:
        return {"category": "Cyclonic Storm", "code": "CS", "severity": "High", "saffir_simpson": "Tropical Storm"}
    elif wind_knots <= 63:
        return {"category": "Severe Cyclonic Storm", "code": "SCS", "severity": "Severe", "saffir_simpson": "Tropical Storm"}
    elif wind_knots <= 89:
        return {"category": "Very Severe Cyclonic Storm", "code": "VSCS", "severity": "Very Severe", "saffir_simpson": "Category 1-2 Hurricane"}
    elif wind_knots <= 119:
        return {"category": "Extremely Severe Cyclonic Storm", "code": "ESCS", "severity": "Extreme", "saffir_simpson": "Category 3-4 Major Hurricane"}
    else:
        return {"category": "Super Cyclonic Storm", "code": "SuCS", "severity": "Catastrophic", "saffir_simpson": "Category 5 Major Hurricane"}

@app.get("/")
def root():
    return {"service": "DeadEye Cyclone ML Model Server", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi-ml-engine"}

@app.post("/predict/detect")
def predict_detect(data: DetectInput):
    sst_factor = max(0.0, min(1.0, (data.sea_surface_temp - 26.0) / 5.0))
    coriolis_factor = min(1.0, abs(math.sin(math.radians(data.latitude))) * 3.5)
    pressure_deficit = max(0.0, (1013.25 - data.central_pressure) / 30.0)
    shear_penalty = 1.0 - min(1.0, (data.vertical_wind_shear or 10.0) / 35.0)

    genesis_score = round(max(0.05, min(0.99, (sst_factor * 0.35) + (coriolis_factor * 0.25) + (pressure_deficit * 0.25) + (shear_penalty * 0.15))), 3)
    is_detected = genesis_score > 0.45
    threat = "High" if genesis_score > 0.75 else ("Medium" if genesis_score > 0.45 else "Low")

    return {
        "cyclone_detected": is_detected,
        "genesis_probability": genesis_score,
        "confidence": round(0.85 + (genesis_score * 0.1), 2),
        "threat_level": threat,
        "detected_center": {"latitude": round(data.latitude, 3), "longitude": round(data.longitude, 3)},
        "environmental_diagnostics": {
            "sst_favorable": data.sea_surface_temp >= 26.5,
            "coriolis_sufficient": abs(data.latitude) >= 4.0,
            "shear_favorable": (data.vertical_wind_shear or 10.0) < 20.0
        }
    }

@app.post("/predict/trajectory")
def predict_trajectory(data: TrajectoryInput):
    waypoints = []
    lat = data.current_lat
    lon = data.current_lon
    wind = data.current_wind_speed
    pressure = data.current_pressure

    angle_rad = math.radians(data.steering_angle_deg or 315.0)
    speed_kmh = data.translation_speed_kmh or 18.0
    forecast_steps = [6, 12, 18, 24, 36, 48, 72]
    cum_h = 0
    landfall_step = None

    for step in forecast_steps:
        delta_h = step - cum_h
        cum_h = step
        dist_km = speed_kmh * delta_h
        delta_lat = (dist_km * math.cos(angle_rad)) / 111.0
        cos_lat = max(0.2, math.cos(math.radians(lat)))
        delta_lon = (dist_km * math.sin(angle_rad)) / (111.0 * cos_lat)

        lat += delta_lat
        lon += delta_lon

        if step <= 36:
            wind = min(140.0, wind + (delta_h * 0.4))
            pressure = max(920.0, pressure - (delta_h * 0.35))
        else:
            wind = max(35.0, wind - (delta_h * 0.3))
            pressure = min(1005.0, pressure + (delta_h * 0.3))

        uncertainty_radius = round(25.0 + (step * 2.2), 1)
        cat_info = calculate_imd_category(wind)

        if (lat >= 19.5 and lon <= 86.8) or step == 48:
            if not landfall_step:
                landfall_step = {
                    "estimated_time_hours": step,
                    "projected_lat": round(lat, 3),
                    "projected_lon": round(lon, 3),
                    "wind_at_landfall_knots": round(wind, 1),
                    "estimated_region": "Odisha - West Bengal Coastal Corridor"
                }

        waypoints.append({
            "step_hours": step,
            "lat": round(lat, 3),
            "lon": round(lon, 3),
            "wind_speed_knots": round(wind, 1),
            "pressure_hpa": round(pressure, 1),
            "uncertainty_radius_km": uncertainty_radius,
            "category": cat_info["category"],
            "severity": cat_info["severity"]
        })

    return {
        "cyclone_id": data.cyclone_id,
        "origin_point": {"lat": data.current_lat, "lon": data.current_lon},
        "forecast_horizon_hours": data.forecast_hours or 72,
        "waypoints": waypoints,
        "landfall_forecast": landfall_step or {
            "estimated_time_hours": 54,
            "projected_lat": round(lat, 3),
            "projected_lon": round(lon, 3),
            "wind_at_landfall_knots": round(wind, 1),
            "estimated_region": "Coastal Maritime Sector"
        }
    }

@app.post("/predict/classify")
def predict_classify(data: ClassifyInput):
    cat_info = calculate_imd_category(data.wind_speed_knots)
    pressure = data.central_pressure or (1013.25 - (data.wind_speed_knots * 0.65))
    pressure_deficit = max(0.0, 1013.25 - pressure)
    surge_height_meters = round((pressure_deficit * 0.01) + ((data.wind_speed_knots / 35.0) ** 1.8 * 0.4), 2)
    gale_radius_km = round(140.0 + (data.wind_speed_knots * 1.5), 1)

    return {
        "wind_speed_knots": data.wind_speed_knots,
        "wind_speed_kmh": round(data.wind_speed_knots * 1.852, 1),
        "central_pressure_hpa": round(pressure, 1),
        "imd_category": cat_info["category"],
        "imd_code": cat_info["code"],
        "saffir_simpson_equivalent": cat_info["saffir_simpson"],
        "threat_severity": cat_info["severity"],
        "estimated_storm_surge_meters": surge_height_meters,
        "radius_of_gale_winds_km": gale_radius_km
    }

@app.post("/predict/monitor")
def predict_monitor(data: MonitorInput):
    pressures = data.time_series_pressure or [990.0, 982.0, 974.0, 968.0]
    winds = data.time_series_wind or [55.0, 65.0, 75.0, 85.0]
    pressure_drop = pressures[0] - pressures[-1] if len(pressures) >= 2 else 0.0
    wind_gain = winds[-1] - winds[0] if len(winds) >= 2 else 0.0
    is_rapid_intensification = (wind_gain >= 30.0) or (pressure_drop >= 24.0)

    return {
        "cyclone_id": data.cyclone_id,
        "status": "Rapid Intensification Underway" if is_rapid_intensification else "Steady Intensification",
        "rapid_intensification_alert": is_rapid_intensification,
        "24h_pressure_change_hpa": round(-pressure_drop, 1),
        "24h_wind_change_knots": round(wind_gain, 1),
        "convective_symmetry_score": data.satellite_convective_score,
        "radar_reflectivity_dbz": data.radar_reflectivity_dbz
    }