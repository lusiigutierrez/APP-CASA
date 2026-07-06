import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, daysBetween, getPerson, taskIsDue, DIAS_FULL, MESES, DAY_KEYS } from '../utils.js';

const Spark = ({ color }) => (
  <svg className="stat-spark" width="56" height="22" viewBox="0 0 56 22">
    <path d="M1 16 Q7 4 13 14 T25 10 T37 16 T49 4" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Inicio() {
  const { household } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [events, shopping, expenses, tasks, menu, notes] = await Promise.all([
        api.get('/events'), api.get('/shopping'), api.get('/expenses'),
        api.get('/tasks'), api.get('/menu'), api.get('/notes'),
      ]);
      setData({ events, shopping, expenses, tasks, menu, notes });
    })();
  }, []);

  if (!data) return <div className="muted">Cargando…</div>;

  const members = household?.members || [];
  const today = new Date();
  const todayStr = fmtDate(today);
  const upcoming = [...data.events].filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const pendingShopping = data.shopping.filter(i => !i.done);
  const monthStr = todayStr.slice(0, 7);
  const monthExpenses = data.expenses.filter(e => e.date.slice(0, 7) === monthStr);
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const pendingTasks = data.tasks.filter(t => taskIsDue(t, todayStr));
  const dowIndex = (today.getDay() + 6) % 7;
  const dowKey = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'][dowIndex];
  const todayMenu = data.menu[dowKey] || {};
  const latestNotes = [...data.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);

  return (
    <>
      <div className="dash-hero">
        <div className="row">
          <div className="avatar avatar-hero" style={{ background: members[0]?.color || 'var(--shared)' }}>
            {members[0] ? members[0].name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="eyebrow">{DIAS_FULL[dowIndex]}, {today.getDate()} de {MESES[today.getMonth()]}</div>
            <h1>{household?.name || 'Nuestra casa'}</h1>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,var(--mustard),var(--clay))' }} onClick={() => navigate('/app/gastos')}>
          <Spark color="var(--mustard-d)" />
          <div className="stat-val">{total.toFixed(0)} €</div><div className="stat-label">gastado este mes</div>
          <span className="stat-chev">›</span>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,var(--sage),var(--blue))' }} onClick={() => navigate('/app/compra')}>
          <Spark color="var(--sage-d)" />
          <div className="stat-val">{pendingShopping.length}</div><div className="stat-label">por comprar</div>
          <span className="stat-chev">›</span>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,var(--clay),var(--plum))' }} onClick={() => navigate('/app/tareas')}>
          <Spark color="var(--clay-d)" />
          <div className="stat-val">{pendingTasks.length}</div><div className="stat-label">tareas pendientes</div>
          <span className="stat-chev">›</span>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg,var(--blue),var(--plum))' }} onClick={() => navigate('/app/calendario')}>
          <Spark color="var(--blue-d)" />
          <div className="stat-val">{upcoming.length}</div><div className="stat-label">eventos próximos</div>
          <span className="stat-chev">›</span>
        </div>
      </div>

      {(pendingTasks.length === 0 && pendingShopping.length === 0) && (
        <div className="card" style={{ fontWeight: 700, color: 'var(--ink-soft)', fontSize: 13.5 }}>
          Todo al día: no hay tareas ni compra pendiente.
        </div>
      )}

      <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/app/calendario')}>
        <h3 className="card-h">Próximos eventos</h3>
        {upcoming.length > 0 && (
          <div className="muted" style={{ margin: '-6px 0 12px', fontSize: 12.5 }}>
            {(() => {
              const days = daysBetween(todayStr, upcoming[0].date);
              if (days === 0) return `Hoy: ${upcoming[0].title}`;
              if (days === 1) return `Mañana: ${upcoming[0].title}`;
              return `Faltan ${days} días para "${upcoming[0].title}"`;
            })()}
          </div>
        )}
        {upcoming.length ? upcoming.map(e => {
          const end = e.endDate || e.date;
          const isMulti = end > e.date;
          const sub = isMulti ? `hasta ${end.slice(8, 10)}/${end.slice(5, 7)}` : (e.allDay ? 'Todo el día' : (e.time || ''));
          return (
            <div className="ev-row" key={e._id}>
              <div className="ev-date"><span className="d">{e.date.slice(8, 10)}</span><span>{MESES[Number(e.date.slice(5, 7)) - 1].slice(0, 3)}</span></div>
              <span className="txt">{e.title}{sub ? ' · ' + sub : ''}</span>
              <span className="dot" style={{ background: getPerson(members, e.who).color }}></span>
            </div>
          );
        }) : <div className="empty">No hay eventos próximos</div>}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-h">Menú de hoy</h3>
          <div className="muted" style={{ marginBottom: 4 }}>Comida: <b style={{ color: 'var(--ink)' }}>{todayMenu.comida || '—'}</b></div>
          <div className="muted">Cena: <b style={{ color: 'var(--ink)' }}>{todayMenu.cena || '—'}</b></div>
        </div>
        <div className="card">
          <h3 className="card-h">Notas recientes</h3>
          {latestNotes.length ? latestNotes.map(n => (
            <div className="muted" key={n._id} style={{ marginBottom: 6 }}>"{(n.text || '').slice(0, 60) || '(vacía)'}"</div>
          )) : <div className="empty">Sin notas todavía</div>}
        </div>
      </div>
    </>
  );
}
