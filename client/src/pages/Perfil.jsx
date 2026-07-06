import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const MEMBER_COLORS = ['#B7D0EC', '#F4C9BC', '#BFE0D0', '#F6DFA6', '#DCC6EA', '#A9DED2', '#EFC7D6', '#C6CDE8'];

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Perfil() {
  const { user, household, refreshHousehold, toggleDarkMode, logout } = useAuth();
  const navigate = useNavigate();
  const [newMemberName, setNewMemberName] = useState('');
  const [copied, setCopied] = useState(false);

  const setHomeName = async (name) => { await api.patch('/household/name', { name }); refreshHousehold(); };
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    const color = MEMBER_COLORS[(household?.members.length || 0) % MEMBER_COLORS.length];
    await api.post('/household/members', { name: newMemberName.trim(), color });
    setNewMemberName('');
    refreshHousehold();
  };
  const renameMember = async (id, name) => { await api.patch(`/household/members/${id}`, { name }); refreshHousehold(); };
  const recolorMember = async (id, color) => { await api.patch(`/household/members/${id}`, { color }); refreshHousehold(); };
  const removeMember = async (id) => { await api.del(`/household/members/${id}`); refreshHousehold(); };

  const copyInvite = () => {
    navigator.clipboard.writeText(household?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <div className="section-title">Perfil de la casa</div>

      <div className="card">
        <h3 className="card-h">Nombre de la casa</h3>
        <input className="inp" style={{ width: '100%', maxWidth: 320 }} defaultValue={household?.name}
          onBlur={e => setHomeName(e.target.value)} />
      </div>

      <div className="card">
        <h3 className="card-h">Código de invitación</h3>
        <div className="muted" style={{ marginBottom: 12 }}>Compártelo con quien viva contigo para que se una a esta misma casa al registrarse.</div>
        <div className="row" style={{ gap: 10 }}>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>{household?.inviteCode}</span>
          <button className="btn-ghost" onClick={copyInvite}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-h">Quién vive aquí</h3>
        {(household?.members || []).map(m => (
          <div key={m._id}>
            <div className="member-card">
              <div className="avatar" style={{ background: m.color, marginLeft: 0 }}>{initials(m.name)}</div>
              <input className="inp" style={{ flex: 1 }} defaultValue={m.name} onBlur={e => renameMember(m._id, e.target.value)} />
              <button className="del" onClick={() => removeMember(m._id)}>✕</button>
            </div>
            <div className="color-row" style={{ margin: '-4px 0 12px 46px' }}>
              {MEMBER_COLORS.map(c => (
                <div key={c} className="color-dot" style={{ background: c, boxShadow: m.color === c ? `0 0 0 2px ${c}` : undefined }}
                  onClick={() => recolorMember(m._id, c)} />
              ))}
            </div>
          </div>
        ))}
        <div className="addbar" style={{ marginTop: 6 }}>
          <input className="inp" placeholder="Nombre de la persona..." value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addMember(); }} />
          <button className="btn" onClick={addMember}>Añadir persona</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-h">Apariencia</h3>
        <div className="muted" style={{ marginBottom: 12 }}>Esta preferencia es personal: no afecta a lo que ve el resto de la casa.</div>
        <button className="btn-ghost" onClick={toggleDarkMode}>{user?.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</button>
      </div>

      <div className="card">
        <h3 className="card-h">Tu cuenta</h3>
        <div className="muted" style={{ marginBottom: 12 }}>Sesión iniciada como <b style={{ color: 'var(--ink)' }}>{user?.email}</b></div>
        <button className="btn-ghost" onClick={doLogout}>Cerrar sesión</button>
      </div>
    </>
  );
}
