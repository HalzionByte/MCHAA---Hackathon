export default function RecommendationCard({ recommendation }) {
  const priorityLabels = { 1: 'Urgent', 2: 'High', 3: 'Medium' };
  const priorityClasses = { 1: 'badge-urgent', 2: 'badge-high', 3: 'badge-medium' };

  return (
    <div className="glass p-5">
      <h3 className="card-title">Recommended Action</h3>
      <p className="text-sm font-medium text-uppercase tracking-wide mb-2">
        {recommendation.action.replace(/_/g, ' ')}
      </p>
      <p className="text-muted mb-4">{recommendation.description}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${priorityClasses[recommendation.priority]}`}>
          {priorityLabels[recommendation.priority]}
        </span>
        <span className="badge badge-healthy">Zone: {recommendation.target_zone}</span>
      </div>
    </div>
  );
}