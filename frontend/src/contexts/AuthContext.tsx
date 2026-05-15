
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api';

interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('@PandaMarket:token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@PandaMarket:token');
      const storedUser = localStorage.getItem('@PandaMarket:user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Optionally verify token with /auth/me
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await api.post('/auth/login', { email, senha });
    const { token: newToken, usuario } = response.data;

    localStorage.setItem('@PandaMarket:token', newToken);
    localStorage.setItem('@PandaMarket:user', JSON.stringify(usuario));
    
    setToken(newToken);
    setUser(usuario);
  };

  const logout = () => {
    localStorage.removeItem('@PandaMarket:token');
    localStorage.removeItem('@PandaMarket:user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
