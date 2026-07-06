import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
        <h1>Casa</h1>
        <p className="muted">Inicia sesión para ver el calendario, la compra, los gastos y todo lo demás.</p>
        {error && <div className="auth-error">{error}</div>}
        <label className="muted">Email</label>
        <input className="inp" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label className="muted">Contraseña</label>
        <input className="inp" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        <p className="muted" style={{ marginTop: 14 }}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
