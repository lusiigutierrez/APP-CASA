import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('new'); // 'new' | 'join'
  const [form, setForm] = useState({ name: '', email: '', password: '', homeName: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        homeName: mode === 'new' ? form.homeName : undefined,
        inviteCode: mode === 'join' ? form.inviteCode : undefined,
      });
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Crear cuenta</h1>
        <div className="row" style={{ gap: 8, marginBottom: 14 }}>
          <button type="button" className={mode === 'new' ? 'btn' : 'btn-ghost'} onClick={() => setMode('new')}>Crear una casa nueva</button>
          <button type="button" className={mode === 'join' ? 'btn' : 'btn-ghost'} onClick={() => setMode('join')}>Unirme con un código</button>
        </div>
        {error && <div className="auth-error">{error}</div>}

        <label className="muted">Tu nombre</label>
        <input className="inp" required value={form.name} onChange={update('name')} />

        <label className="muted">Email</label>
        <input className="inp" type="email" required value={form.email} onChange={update('email')} />

        <label className="muted">Contraseña</label>
        <input className="inp" type="password" required minLength={6} value={form.password} onChange={update('password')} />

        {mode === 'new' ? (
          <>
            <label className="muted">Nombre de la casa (opcional)</label>
            <input className="inp" placeholder="Nuestra casa" value={form.homeName} onChange={update('homeName')} />
          </>
        ) : (
          <>
            <label className="muted">Código de invitación</label>
            <input className="inp" placeholder="Ej. A1B2C3" required value={form.inviteCode} onChange={update('inviteCode')} />
          </>
        )}

        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 10 }}>
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="muted" style={{ marginTop: 14 }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
