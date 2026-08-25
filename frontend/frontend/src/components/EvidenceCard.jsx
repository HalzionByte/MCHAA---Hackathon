export default function EvidenceCard({ evidence }) {
  return (
    <div className="glass p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-6">Environmental Evidence</h3>
      
      <div className="space-y-4">
        <div>
          <span className="text-muted mr-2">Soil Moisture:</span>
          <span className="font-medium">{evidence.soil_moisture_percent}%</span>
        </div>
        <div>
          <span className="text-muted mr-2">Rainfall (7d):</span>
          <span className="font-medium">{evidence.rainfall_7d_mm}mm</span>
        </div>
        <div>
          <span className="text-muted mr-2">Temperature:</span>
          <span className="font-medium">{evidence.temperature_c}°C</span>
        </div>
        <div>
          <span className="text-muted mr-2">Humidity:</span>
          <span className="font-medium">{evidence.humidity_percent}%</span>
        </div>
        <div>
          <span className="text-muted mr-2">Vegetation Change:</span>
          <span className="font-medium">{evidence.vegetation_ndvi_change}</span>
        </div>
      </div>
    </div>
  );
}