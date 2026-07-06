import { NavLink, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ICONS } from './icons.jsx';

const SECTIONS = [
  { to: '/app', end: true, id: 'inicio', label: 'Inicio' },
  { to: '/app/calendario', id: 'calendario', label: 'Calendario' },
  { to: '/app/menu', id: 'menu', label: 'Menú semanal' },
  { to: '/app/compra', id: 'compra', label: 'La compra' },
  { to: '/app/gastos', id: 'gastos', label: 'Gastos' },
  { to: '/app/tareas', id: 'tareas', label: 'Tareas' },
  { to: '/app/notas', id: 'notas', label: 'Notas' },
  { to: '/app/perfil', id: 'perfil', label: 'Perfil de casa' },
];

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function AppLayout() {
  const { user, household } = useAuth();

  useEffect(() => {
    document.body.classList.toggle('dark', !!user?.darkMode);
  }, [user?.darkMode]);

  return (
    <div id="app">
      <div id="sidebar">
        <div className="brand"><h1>{household?.name || 'Nuestra casa'}</h1></div>
        <div className="household-row">
          <div className="avatar-stack">
            {(household?.members || []).slice(0, 4).map(m => (
              <div className="avatar" key={m._id} style={{ background: m.photo ? undefined : m.color }}>
                {m.photo ? <img src={m.photo} alt="" /> : initials(m.name)}
              </div>
            ))}
          </div>
          <div className="names">{(household?.members || []).map(m => m.name).join(' · ') || 'Añadir personas'}</div>
        </div>
        <div id="tabs">
          {SECTIONS.map(s => (
            <NavLink
              key={s.id}
              to={s.to}
              end={s.end}
              className={({ isActive }) => `tab tab-${s.id} ${isActive ? 'active' : ''}`}
            >
              <span className="ic">{ICONS[s.id]}</span><span>{s.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div id="main"><div id="main-inner"><Outlet /></div></div>
    </div>
  );
}
