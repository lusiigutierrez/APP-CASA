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

export const RECURRING_LABELS = { weekly: 'semana', monthly: 'mes', yearly: 'año' };

// Aritmética en fecha local (sin pasar por toISOString) para no arrastrar
// desfases de huso horario al encadenar ocurrencias.
function parseLocalDate(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d);
}
function formatLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Ocurrencia número `n` (0 = la fecha ancla) de una regla recurrente, calculada
// siempre a partir del ancla original (nunca encadenando desde la anterior,
// para no arrastrar el desfase de los meses/años con menos días).
function occurrenceAt(anchorStr, recurring, n) {
  const anchor = parseLocalDate(anchorStr);
  if (recurring === 'weekly') {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7 * n);
    return formatLocalDate(d);
  }
  if (recurring === 'monthly') {
    const total = anchor.getMonth() + n;
    const year = anchor.getFullYear() + Math.floor(total / 12);
    const month = ((total % 12) + 12) % 12;
    const day = Math.min(anchor.getDate(), daysInMonth(year, month));
    return formatLocalDate(new Date(year, month, day));
  }
  if (recurring === 'yearly') {
    const year = anchor.getFullYear() + n;
    const day = Math.min(anchor.getDate(), daysInMonth(year, anchor.getMonth()));
    return formatLocalDate(new Date(year, anchor.getMonth(), day));
  }
  return anchorStr;
}

// Expande eventos recurrentes en sus ocurrencias reales dentro de [rangeStart, rangeEnd] ('YYYY-MM-DD').
// Los eventos no recurrentes se devuelven tal cual. Cada ocurrencia conserva el _id original del evento
// (editar/borrar una ocurrencia afecta a toda la regla), pero cambia su `date`/`endDate`.
export function expandRecurring(events, rangeStart, rangeEnd) {
  const result = [];
  (events || []).forEach(e => {
    if (!e.recurring || e.recurring === 'none') { result.push(e); return; }
    let n = 0;
    let occ = occurrenceAt(e.date, e.recurring, n);
    let guard = 0;
    while (occ < rangeStart && guard < 5000) { n++; occ = occurrenceAt(e.date, e.recurring, n); guard++; }
    while (occ <= rangeEnd && guard < 6000) {
      result.push({ ...e, date: occ, endDate: occ });
      n++;
      occ = occurrenceAt(e.date, e.recurring, n);
      guard++;
    }
  });
  return result;
}
