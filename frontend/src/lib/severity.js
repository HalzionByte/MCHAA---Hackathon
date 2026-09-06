export function getSeverityClass(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'severity-high';
  if (value > thresholdMedium) return 'severity-medium';
  return 'severity-low';
}

const severityLabels = {
  en: { critical: 'Critical', moderate: 'Moderate', low: 'Low' },
  ur: { critical: 'تنقیدی', moderate: 'درمیانہ', low: 'کم' },
};

export function getSeverityColor(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'var(--crimson)';
  if (value > thresholdMedium) return 'var(--amber)';
  return 'var(--emerald)';
}

export function getSeverityLabel(value, lang = 'en', thresholdHigh = 0.7, thresholdMedium = 0.3) {
  const labels = severityLabels[lang] || severityLabels.en;
  if (value > thresholdHigh) return labels.critical;
  if (value > thresholdMedium) return labels.moderate;
  return labels.low;
}

export function getSeverityBg(value, thresholdHigh = 0.7, thresholdMedium = 0.3) {
  if (value > thresholdHigh) return 'rgba(239,68,68,0.15)';
  if (value > thresholdMedium) return 'rgba(245,158,11,0.15)';
  return 'rgba(16,185,129,0.15)';
}

const priorityLabels = {
  en: { urgent: 'Urgent', high: 'High', medium: 'Medium' },
  ur: { urgent: 'فوری', high: 'اعلیٰ', medium: 'درمیانہ' },
};

export function getPriorityClass(priority) {
  const classes = { 1: 'badge-urgent', 2: 'badge-high', 3: 'badge-medium' };
  return classes[priority] || 'badge-medium';
}

export function getPriorityLabel(priority, lang = 'en') {
  const labels = priorityLabels[lang] || priorityLabels.en;
  const map = { 1: labels.urgent, 2: labels.high, 3: labels.medium };
  return map[priority] || labels.medium;
}
