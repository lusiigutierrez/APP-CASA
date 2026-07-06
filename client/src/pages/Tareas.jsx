import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, getPerson, peopleOptions, initials, taskIsDue, FREQ_LABELS } from '../utils.js';

export default function Tareas() {
  const { household } = useAuth();
  const members = household?.members || [];
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('shared');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState(7);

  const load = () => api.get('/tasks').then(setTasks);
  useEffect(() => { load(); }, []);

  const todayStr = fmtDate(new Date());
  const opts = peopleOptions(members);

  const add = async () => {
    if (!text.trim()) return;
    await api.post('/tasks', { text: text.trim(), assignee, recurring, frequencyDays: Number(frequency), done: false, lastDone: null });
    setText('');
    load();
  };
  const toggle = async (t) => {
    if (t.recurring) {
      const due = taskIsDue(t, todayStr);
      await api.patch(`/tasks/${t._id}`, { lastDone: due ? todayStr : null });
    } else {
      await api.patch(`/tasks/${t._id}`, { done: !t.done });
    }
    load();
  };
  const del = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta tarea?')) return;
    await api.del(`/tasks/${id}`);
    load();
  };

  const pending = tasks.filter(t => taskIsDue(t, todayStr));
  const done = tasks.filter(t => !taskIsDue(t, todayStr));

  const Item = ({ t }) => {
    const p = getPerson(members, t.assignee);
    const due = taskIsDue(t, todayStr);
    let sub = p.name;
    if (t.recurring) {
      const freq = FREQ_LABELS[t.frequencyDays] || `${t.frequencyDays} días`;
      if (due) sub += ` · cada ${freq}`;
      else {
        const next = new Date(t.lastDone + 'T00:00:00');
        next.setDate(next.getDate() + (t.frequencyDays || 7));
        sub += ` · próxima el ${String(next.getDate()).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    return (
      <div className={`chip-row ${!due ? 'done' : ''}`} style={{ borderLeftColor: p.color }}>
        <input type="checkbox" className="chk" checked={!due} onChange={() => toggle(t)} />
        <div className="chip-icon" style={{ background: p.color, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{initials(p.name)}</div>
        <div style={{ flex: 1 }}>
          <div className={`chip-title ${!due ? 'strike' : ''}`}>{t.text}</div>
          <div className="chip-sub">{sub}</div>
        </div>
        <button className="del" onClick={() => del(t._id)}>✕</button>
      </div>
    );
  };

  return (
    <>
      <div className="section-title">Tareas del hogar</div>
      <div className="card">
        <div className="addbar">
          <input className="inp" placeholder="Nueva tarea..." value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }} />
          <select className="inp" style={{ maxWidth: 120 }} value={assignee} onChange={e => setAssignee(e.target.value)}>
            {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="addbar" style={{ alignItems: 'center' }}>
          <label className="row muted" style={{ fontSize: 13, whiteSpace: 'nowrap', gap: 6 }}>
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Recurrente, cada
          </label>
          <select className="inp" style={{ maxWidth: 120 }} value={frequency} onChange={e => setFrequency(e.target.value)}>
            <option value="1">día</option>
            <option value="7">semana</option>
            <option value="14">quincena</option>
            <option value="30">mes</option>
          </select>
          <button className="btn" onClick={add}>Añadir</button>
        </div>
        {pending.length ? pending.map(t => <Item t={t} key={t._id} />) : <div className="empty">No hay tareas pendientes.</div>}
        {done.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 16, textTransform: 'uppercase', letterSpacing: '.3px' }}>Al día</h3>
            {done.map(t => <Item t={t} key={t._id} />)}
          </>
        )}
      </div>
    </>
  );
}
