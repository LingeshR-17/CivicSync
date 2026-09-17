// 🎯 Single source of truth for department id -> {name, icon, color}.
// Mirrors the icon choices already used in DepartmentsScreen.js and the
// DB_DEPARTMENT_MAP in GrievancesScreen.js, so a citizen sees the same
// icon for "Sanitation" everywhere in the app instead of a plain text list.
export const DEPARTMENTS = [
  { id: 1, name: 'Sanitation', icon: 'trash-alt', color: '#4ade80' },
  { id: 2, name: 'Electricity', icon: 'lightbulb', color: '#fef08a' },
  { id: 3, name: 'Water Supply', icon: 'faucet', color: '#38bdf8' },
  { id: 4, name: 'Roads & Bridges', icon: 'road', color: '#fbbf24' },
  { id: 5, name: 'Public Health', icon: 'heartbeat', color: '#f43f5e' },
  { id: 6, name: 'Education', icon: 'graduation-cap', color: '#cbd5e1' },
  { id: 7, name: 'Transport', icon: 'bus', color: '#fb923c' },
  { id: 8, name: 'Sewage & Drains', icon: 'water', color: '#22d3ee' },
];

export function getDepartmentMeta(id) {
  return DEPARTMENTS.find((d) => d.id === id) || { name: 'General', icon: 'alert-circle', color: '#94a3b8' };
}
