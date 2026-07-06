import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { resizePhotoToDataURL } from '../utils.js';

const MEMBER_COLORS = ['#B7D0EC', '#F4C9BC', '#BFE0D0', '#F6DFA6', '#DCC6EA', '#A9DED2', '#EFC7D6', '#C6CDE8'];

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function PhotoAvatar({ photo, color, label, size = 40, onPick, onRemove }) {
  return (
    <div className="photo-avatar" style={{ width: size, height: size }}>
      <label className="photo-avatar-circle" style={{ background: color }}>
        {photo ? <img src={photo} alt="" /> : <span style={{ fontSize: size * 0.36 }}>{label}</span>}
        <input type="file" accept="image/*" hidden onChange={e => { if (e.target.files[0]) onPick(e.target.files[0]); e.target.value = ''; }} />
      </label>
      {photo && onRemove && <button type="button" className="photo-avatar-remove" onClick={onRemove}>✕</button>}
    </div>
  );
}

export default function Perfil() {
  const { user, household, refreshHousehold, toggleDarkMode, logout } = useAuth();
  const navigate = useNavigate();
  const [newMemberName, setNewMemberName] = useState('');
  const [copied, setCopied] = useState(false);
  const [accounts, setAccounts] = useState({ ownerId: null, users: [] });

  const loadAccounts = () => api.get('/household/users').then(setAccounts);
  useEffect(() => { loadAccounts(); }, []);
  const isOwner = accounts.ownerId === user?.id;
  const kickUser = async (id, name) => {
    if (!window.confirm(`¿Seguro que quieres expulsar a ${name} de la casa? Perderá el acceso inmediatamente.`)) return;
    try {
      await api.del(`/household/users/${id}`);
      loadAccounts();
    } catch (e) {
      window.alert(e.message);
    }
  };

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
  const removeMember = async (id, name) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${name || 'esta persona'} de la casa?`)) return;
    await api.del(`/household/members/${id}`);
    refreshHousehold();
  };
  const setMemberPhoto = async (id, file) => {
    const photo = await resizePhotoToDataURL(file);
    await api.patch(`/household/members/${id}`, { photo });
    refreshHousehold();
  };
  const removeMemberPhoto = async (id) => { await api.patch(`/household/members/${id}`, { photo: '' }); refreshHousehold(); };
  const setHousePhoto = async (file) => {
    const photo = await resizePhotoToDataURL(file);
    await api.patch('/household/photo', { photo });
    refreshHousehold();
  };
  const removeHousePhoto = async () => { await api.patch('/household/photo', { photo: '' }); refreshHousehold(); };

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
        <div className="row" style={{ gap: 14, marginBottom: 14 }}>
          <PhotoAvatar photo={household?.photo} color="var(--shared)" label="🏠" size={56}
            onPick={setHousePhoto} onRemove={removeHousePhoto} />
          <div className="muted" style={{ fontSize: 12.5 }}>Esta foto se usa en los eventos del calendario que incluyen a todos.</div>
        </div>
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
        <h3 className="card-h">Usuarios con acceso</h3>
        <div className="muted" style={{ marginBottom: 12 }}>
          {isOwner ? 'Como creador/a de la casa, puedes expulsar a quien ya no quieras que tenga acceso.' : 'Solo quien creó la casa puede expulsar usuarios.'}
        </div>
        {accounts.users.map(u => (
          <div className="member-card" key={u.id}>
            <div className="avatar" style={{ background: 'var(--shared)', marginLeft: 0 }}>{initials(u.name)}</div>
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 6 }}>
                <b style={{ color: 'var(--ink)', fontSize: 13.5 }}>{u.name}</b>
                {u.id === accounts.ownerId && <span className="pill" style={{ background: 'var(--mustard)' }}>Creador/a</span>}
                {u.id === user?.id && <span className="muted" style={{ fontSize: 12 }}>(tú)</span>}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
            </div>
            {isOwner && u.id !== user?.id && (
              <button className="btn-ghost" style={{ color: 'var(--clay-d)', fontSize: 12.5, padding: '7px 12px' }} onClick={() => kickUser(u.id, u.name)}>
                Expulsar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-h">Quién vive aquí</h3>
        {(household?.members || []).map(m => (
          <div key={m._id}>
            <div className="member-card">
              <PhotoAvatar photo={m.photo} color={m.color} label={initials(m.name)}
                onPick={file => setMemberPhoto(m._id, file)} onRemove={() => removeMemberPhoto(m._id)} />
              <input className="inp" style={{ flex: 1 }} defaultValue={m.name} onBlur={e => renameMember(m._id, e.target.value)} />
              <button className="del" onClick={() => removeMember(m._id, m.name)}>✕</button>
            </div>
            <div className="color-row" style={{ margin: '4px 0 12px 52px' }}>
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
