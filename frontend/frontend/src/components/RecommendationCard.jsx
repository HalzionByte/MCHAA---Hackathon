export default function RecommendationCard({ recommendation }) {
  const priorityLabels = {
    1: "🔴 Urgent",
    2: "🟠 High",
    3: "🟡 Medium"
  };

  const priorityClass = recommendation.priority === 1 ? 'severity-high' :
                        recommendation.priority === 2 ? 'severity-medium' : 'severity-low';

  return (
    <div className="glass p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-6">Recommended Action</h3>
      
      <p className="text-uppercase text-sm font-medium mb-3">
        {recommendation.action.replace(/_/g, ' ').toUpperCase()}
      </p>
      
      <p className="text-muted mb-4">{recommendation.description}</p>
      
      <div className="flex items-center gap-3">
        <span className={priorityClass} font-medium>
          {priorityLabels[recommendation.priority]}
        </span>
        <span className="text-muted">Zone: {recommendation.target_zone}</span>
      </div>
    </div>
  );
}