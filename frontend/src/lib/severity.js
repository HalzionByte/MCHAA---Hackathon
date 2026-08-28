export function getSeverityClass(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'severity-high';
  if (value > thresholdMedium) return 'severity-medium';
  return 'severity-low';
}

export function getSeverityColor(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'var(--crimson)';
  if (value > thresholdMedium) return 'var(--amber)';
  return 'var(--emerald)';
}

export function getSeverityLabel(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'Critical';
  if (value > thresholdMedium) return 'Moderate';
  return 'Low';
}

export function getSeverityBg(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'rgba(239,68,68,0.15)';
  if (value > thresholdMedium) return 'rgba(245,158,11,0.15)';
  return 'rgba(16,185,129,0.15)';
}

export function getPriorityClass(priority) {
  const classes = { 1: 'badge-urgent', 2: 'badge-high', 3: 'badge-medium' };
  return classes[priority] || 'badge-medium';
}

export function getPriorityLabel(priority) {
  const labels = { 1: 'Urgent', 2: 'High', 3: 'Medium' };
  return labels[priority] || 'Medium';
}