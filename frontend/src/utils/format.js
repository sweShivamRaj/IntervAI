export function difficultyLabel(value) {
  return { 1: 'Easy', 2: 'Medium', 3: 'Hard' }[value] || 'Medium';
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}
