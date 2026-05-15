
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '40px',
        borderRadius: '24px',
        width: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🐼</div>
        <h1 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700' }}>Panda Market</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Sistema de Gestão Enterprise</p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@panda.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p style={{ marginTop: '30px', color: '#64748b', fontSize: '0.8rem' }}>
          &copy; 2026 Panda Market Enterprise. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
