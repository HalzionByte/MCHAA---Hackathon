export default function EvidenceCard({ evidence }) {
  return (
    <div className="glass p-5">
      <h3 className="card-title">Environmental Evidence</h3>
      <div className="space-y-3">
        <div className="stat-row">
          <span className="stat-label">Soil Moisture</span>
          <span className="stat-value">{evidence.soil_moisture_percent}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Rainfall (7d)</span>
          <span className="stat-value">{evidence.rainfall_7d_mm} mm</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Temperature</span>
          <span className="stat-value">{evidence.temperature_c}°C</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{evidence.humidity_percent}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">NDVI Change</span>
          <span className="stat-value">
            {evidence.vegetation_ndvi_change > 0 ? '+' : ''}{evidence.vegetation_ndvi_change} NDVI
          </span>
        </div>
      </div>
    </div>
  );
}