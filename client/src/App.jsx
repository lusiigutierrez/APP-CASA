import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AppLayout from './components/AppLayout.jsx';
import Inicio from './pages/Inicio.jsx';
import Calendario from './pages/Calendario.jsx';
import Compra from './pages/Compra.jsx';
import Gastos from './pages/Gastos.jsx';
import Tareas from './pages/Tareas.jsx';
import MenuSemanal from './pages/MenuSemanal.jsx';
import Notas from './pages/Notas.jsx';
import Perfil from './pages/Perfil.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app" replace /> : <Register />} />

      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Inicio />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="compra" element={<Compra />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="tareas" element={<Tareas />} />
        <Route path="menu" element={<MenuSemanal />} />
        <Route path="notas" element={<Notas />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}
