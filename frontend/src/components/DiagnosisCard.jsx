export default function DiagnosisCard({ diagnosis }) {
  const confidence = diagnosis.confidence;
  const severityClass = confidence > 0.7 ? 'severity-high' : 
                       confidence > 0.3 ? 'severity-medium' : 'severity-low';
  const progressColor = confidence > 0.7 ? 'var(--crimson)' : 
                       confidence > 0.3 ? 'var(--amber)' : 'var(--emerald)';

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