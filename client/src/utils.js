export const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DAY_KEYS = [['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo']];

export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

export function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function getPerson(members, id) {
  if (id === 'shared') return { id: 'shared', name: 'Todos', color: 'var(--shared)' };
  const m = (members || []).find(m => m._id === id);
  return m ? { id: m._id, name: m.name, color: m.color } : { id, name: '(eliminado)', color: '#ddd' };
}

export function peopleOptions(members) {
  return [...(members || []).map(m => ({ id: m._id, name: m.name, color: m.color })), { id: 'shared', name: 'Todos', color: 'var(--shared)' }];
}

export function taskIsDue(t, todayStr) {
  if (!t.recurring) return !t.done;
  return !t.lastDone || daysBetween(t.lastDone, todayStr) >= (t.frequencyDays || 7);
}

export const FREQ_LABELS = { 1: 'día', 7: 'semana', 14: 'quincena', 30: 'mes' };
