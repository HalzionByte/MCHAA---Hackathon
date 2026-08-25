import { getSeverityClass, getSeverityColor } from '../lib/severity';

export default function DiagnosisCard({ diagnosis }) {
  const confidence = diagnosis.confidence;
  const severityClass = getSeverityClass(confidence);
  const progressColor = getSeverityColor(confidence);

  return (
    <div className="glass p-5">
      <h3 className="card-title">Diagnosis</h3>
      <p className="text-muted mb-4">{diagnosis.cause}</p>
      <p className="text-muted mb-4 line-clamp-3">{diagnosis.reasoning}</p>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">Confidence</span>
          <span className={severityClass} font-medium>
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${confidence * 100}%`, backgroundColor: progressColor }}
          ></div>
        </div>
      </div>
    </div>
  );
}