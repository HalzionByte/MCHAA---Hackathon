import { getPriorityClass, getPriorityLabel } from '../lib/severity';

export default function RecommendationCard({ recommendation }) {
  return (
    <div className="glass p-5">
      <h3 className="card-title">Recommended Action</h3>
      <p className="text-sm font-medium text-uppercase tracking-wide mb-2">
        {recommendation.action.replace(/_/g, ' ')}
      </p>
      <p className="text-muted mb-4">{recommendation.description}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${getPriorityClass(recommendation.priority)}`}>
          {getPriorityLabel(recommendation.priority)}
        </span>
        <span className="badge badge-healthy">Zone: {recommendation.target_zone}</span>
      </div>
    </div>
  );
}