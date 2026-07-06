import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, getPerson, peopleOptions, initials, MESES } from '../utils.js';

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export default function Calendario() {
  const { household } = useAuth();
  const members = household?.members || [];
  const [events, setEvents] = useState([]);
  const [calDate, setCalDate] = useState(new Date());
  const [modal, setModal] = useState(null); // { date, editingId } | null

  const loadEvents = () => api.get('/events').then(setEvents);
  useEffect(() => { loadEvents(); }, []);

  const y = calDate.getFullYear(), m = calDate.getMonth();
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const todayStr = fmtDate(new Date());

  let cells = [];
  for (let i = startDow - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, other: false, date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length, other: true });

  const monthStartStr = cells.find(c => !c.other).date;
  const monthEndStr = [...cells].reverse().find(c => !c.other).date;
  const barEvents = events.filter(e => {
    const end = e.endDate || e.date;
    const isBar = e.allDay || end > e.date;
    return isBar && end >= monthStartStr && e.date <= monthEndStr;
  }).sort((a, b) => a.date.localeCompare(b.date) || a._id.localeCompare(b._id));

  const monthEvents = events.filter(e => e.date.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="section-title">Calendario</div>
      <div className="card">
        <div className="cal-head">
          <h2 style={{ textTransform: 'capitalize' }}>{MESES[m]} {y}</h2>
          <div className="cal-nav">
            <button onClick={() => setCalDate(new Date(y, m - 1, 1))}>‹</button>
            <button onClick={() => setCalDate(new Date(y, m + 1, 1))}>›</button>
          </div>
        </div>
        <div className="cal-grid">
          {DIAS.map(d => <div className="cal-dow" key={d}>{d}</div>)}
          {cells.map((c, idx) => {
            if (c.other) return <div className="cal-day other" key={idx}><div className="num-row"><span className="num">{c.d}</span></div></div>;
            const isToday = c.date === todayStr;
            const bars = barEvents.map(e => {
              const end = e.endDate || e.date;
              if (c.date < e.date || c.date > end) return null;
              const isStart = c.date === e.date, isEnd = c.date === end;
              const p = getPerson(members, e.who, household);
              return <div key={e._id} className={`cal-bar ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`} style={{ background: p.color }}>{isStart ? e.title : ''}</div>;
            }).filter(Boolean);
            const dotEvents = events.filter(e => {
              const end = e.endDate || e.date;
              const isBar = e.allDay || end > e.date;
              return !isBar && e.date === c.date;
            });
            return (
              <div className={`cal-day ${isToday ? 'today' : ''}`} key={idx} onClick={() => setModal({ date: c.date, editingId: null })}>
                <div className="num-row"><span className="num">{c.d}</span></div>
                <div className="bars">{bars}</div>
                {dotEvents.length > 0 && (
                  <div className="dots">{dotEvents.slice(0, 4).map(e => <span key={e._id} className="dot" style={{ background: getPerson(members, e.who, household).color }}></span>)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-h">Eventos de {MESES[m]}</h3>
        {monthEvents.length ? monthEvents.map(e => {
          const p = getPerson(members, e.who, household);
          const end = e.endDate || e.date;
          const isMulti = end > e.date;
          const when = isMulti
            ? `${e.date.slice(8, 10)}/${e.date.slice(5, 7)} – ${end.slice(8, 10)}/${end.slice(5, 7)}`
            : `${e.date.slice(8, 10)}/${e.date.slice(5, 7)}${e.allDay ? ' · Todo el día' : (e.time ? ' · ' + e.time : '')}`;
          return (
            <div key={e._id} className="chip-row" style={{ borderLeftColor: p.color, cursor: 'pointer' }} onClick={() => setModal({ date: e.date, editingId: e._id })}>
              <div className="chip-icon" style={{ background: p.color, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="chip-title">{e.title}</div>
                <div className="chip-sub">{when} · {p.name}</div>
              </div>
              <button className="del" onClick={(ev) => { ev.stopPropagation(); api.del(`/events/${e._id}`).then(loadEvents); }}>✕</button>
            </div>
          );
        }) : <div className="empty">Mes tranquilo, sin eventos todavía.</div>}
      </div>

      {modal && (
        <DayModal
          modal={modal}
          events={events}
          members={members}
          household={household}
          onClose={() => setModal(null)}
          onSaved={loadEvents}
        />
      )}
    </>
  );
}

function DayModal({ modal, events, members, household, onClose, onSaved }) {
  const editing = modal.editingId ? events.find(e => e._id === modal.editingId) : null;
  const d = new Date(modal.date + 'T00:00:00');
  const dayEvents = events.filter(e => {
    const end = e.endDate || e.date;
    return modal.date >= e.date && modal.date <= end;
  }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const [title, setTitle] = useState(editing?.title || '');
  const [start, setStart] = useState(editing?.date || modal.date);
  const [end, setEnd] = useState((editing?.endDate || editing?.date) || modal.date);
  const [allDay, setAllDay] = useState(editing?.allDay || false);
  const [time, setTime] = useState(editing?.time || '');
  const [who, setWho] = useState(editing?.who || 'shared');
  const [editingId, setEditingId] = useState(modal.editingId || null);

  const opts = peopleOptions(members);

  const startEdit = (ev) => {
    setEditingId(ev._id);
    setTitle(ev.title);
    setStart(ev.date);
    setEnd(ev.endDate || ev.date);
    setAllDay(ev.allDay);
    setTime(ev.time || '');
    setWho(ev.who);
  };
  const resetForm = () => {
    setEditingId(null); setTitle(''); setStart(modal.date); setEnd(modal.date);
    setAllDay(false); setTime(''); setWho('shared');
  };

  const submit = async () => {
    if (!title.trim()) return;
    let finalEnd = end < start ? start : end;
    const payload = { title: title.trim(), date: start, endDate: finalEnd, allDay, time: allDay ? '' : time, who };
    if (editingId) {
      await api.patch(`/events/${editingId}`, payload);
    } else {
      await api.post('/events', payload);
    }
    resetForm();
    onSaved();
  };

  const remove = async (id) => {
    await api.del(`/events/${id}`);
    if (editingId === id) resetForm();
    onSaved();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="row between" style={{ marginBottom: 16 }}>
          <h3>{d.getDate()} de {MESES[d.getMonth()]} {d.getFullYear()}</h3>
          <button className="del" onClick={onClose}>✕</button>
        </div>

        {dayEvents.length ? dayEvents.map(e => {
          const p = getPerson(members, e.who, household);
          const eEnd = e.endDate || e.date;
          const isMulti = eEnd > e.date;
          const when = isMulti
            ? `${e.date.slice(8, 10)}/${e.date.slice(5, 7)} – ${eEnd.slice(8, 10)}/${eEnd.slice(5, 7)}`
            : (e.allDay ? 'Todo el día' : (e.time || 'Todo el día'));
          return (
            <div key={e._id} className="chip-row" style={{ borderLeftColor: p.color }}>
              <div className="chip-icon" style={{ background: p.color, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="chip-title">{e.title}</div>
                <div className="chip-sub">{when} · {p.name}</div>
              </div>
              <button className="del" onClick={() => startEdit(e)}>✎</button>
              <button className="del" onClick={() => remove(e._id)}>✕</button>
            </div>
          );
        }) : <div className="empty" style={{ marginBottom: 14 }}>No hay eventos este día.</div>}

        <h3 className="card-h" style={{ marginTop: 16 }}>{editingId ? 'Editar evento' : 'Añadir evento'}</h3>
        <div className="addbar">
          <input className="inp" style={{ flex: '1 1 100%' }} placeholder="Título del evento" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="addbar" style={{ alignItems: 'center' }}>
          <label className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>Desde</label>
          <input className="inp" type="date" style={{ maxWidth: 150 }} value={start} onChange={e => setStart(e.target.value)} />
          <label className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>Hasta</label>
          <input className="inp" type="date" style={{ maxWidth: 150 }} value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <div className="addbar" style={{ alignItems: 'center' }}>
          <label className="row muted" style={{ fontSize: 13, gap: 6 }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} /> Todo el día
          </label>
          {!allDay && <input className="inp" type="time" style={{ maxWidth: 120 }} value={time} onChange={e => setTime(e.target.value)} />}
        </div>
        <div className="addbar">
          <select className="inp" style={{ flex: 1 }} value={who} onChange={e => setWho(e.target.value)}>
            {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="row" style={{ gap: 9 }}>
          <button className="btn" style={{ flex: 1 }} onClick={submit}>{editingId ? 'Guardar cambios' : 'Añadir'}</button>
          {editingId && <button className="btn-ghost" onClick={resetForm}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}
