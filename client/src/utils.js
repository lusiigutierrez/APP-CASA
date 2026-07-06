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

export function getPerson(members, id, household) {
  if (id === 'shared') return { id: 'shared', name: 'Todos', color: 'var(--shared)', photo: household?.photo || '' };
  const m = (members || []).find(m => m._id === id);
  return m ? { id: m._id, name: m.name, color: m.color, photo: m.photo || '' } : { id, name: '(eliminado)', color: '#ddd', photo: '' };
}

export function resizePhotoToDataURL(file, maxDim = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function peopleOptions(members) {
  return [...(members || []).map(m => ({ id: m._id, name: m.name, color: m.color })), { id: 'shared', name: 'Todos', color: 'var(--shared)' }];
}

export function taskIsDue(t, todayStr) {
  if (!t.recurring) return !t.done;
  return !t.lastDone || daysBetween(t.lastDone, todayStr) >= (t.frequencyDays || 7);
}

export const FREQ_LABELS = { 1: 'día', 7: 'semana', 14: 'quincena', 30: 'mes' };
