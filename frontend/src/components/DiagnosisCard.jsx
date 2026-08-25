export default function DiagnosisCard({ diagnosis }) {
  const severityClass = diagnosis.confidence > 0.7 ? 'severity-high' : 
                       diagnosis.confidence > 0.3 ? 'severity-medium' : 'severity-low';

  return (
    <div className="glass p-5">
      <h3 className="card-title">Diagnosis</h3>
      <p className="text-muted mb-4">{diagnosis.cause}</p>
      <p className="text-muted mb-4 line-clamp-3">{diagnosis.reasoning}</p>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">Confidence</span>
          <span className={severityClass} font-medium>
            {(diagnosis.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${diagnosis.confidence * 100}%`, backgroundColor: 'var(--emerald)' }}
          ></div>
        </div>
      </div>
    </div>
  );
}