import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!api.hasToken()) { setLoading(false); return; }
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setHousehold(data.household);
    } catch (e) {
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    api.setToken(data.token);
    setUser(data.user);
    setHousehold(data.household);
  };

  const register = async ({ email, password, name, inviteCode, homeName }) => {
    const data = await api.post('/auth/register', { email, password, name, inviteCode, homeName });
    api.setToken(data.token);
    setUser(data.user);
    setHousehold(data.household);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setHousehold(null);
  };

  const refreshHousehold = async () => {
    const data = await api.get('/household');
    setHousehold(data);
  };

  const toggleDarkMode = async () => {
    const data = await api.patch('/auth/me', { darkMode: !user.darkMode });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, household, loading, login, register, logout, refreshHousehold, toggleDarkMode, setHousehold }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
