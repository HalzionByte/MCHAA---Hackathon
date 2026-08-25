export default function DiagnosisCard({ diagnosis }) {
  const severityClass = diagnosis.confidence > 0.7 ? 'severity-high' : 
                       diagnosis.confidence > 0.3 ? 'severity-medium' : 'severity-low';

  return (
    <div className="glass p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-6">Diagnosis</h3>
      
      <p className="text-muted mb-4">{diagnosis.cause}</p>
      
      <p className="text-muted mb-6 line-clamp-3">{diagnosis.reasoning}</p>
      
      <div>
        <span className="text-muted mr-2">Confidence:</span>
        <span className={severityClass} font-medium>
          {(diagnosis.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}