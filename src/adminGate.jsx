// src/adminGate.js — Login as Admin (modal password)
import React, { useState, useEffect } from 'react';

export function AdminGate({ onAdminStatus }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');

  useEffect(() => {
    checkStatus();
    const openLogin = () => setShowModal(true);
    window.addEventListener('open-admin-login', openLogin);
    return () => window.removeEventListener('open-admin-login', openLogin);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/admin/admin.php?action=check');
      const data = await res.json();
      setIsAdmin(data.admin);
      onAdminStatus && onAdminStatus(data.admin);
    } catch { /* ignore */ }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch('/admin/admin.php?action=login', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setIsAdmin(true);
        setShowModal(false);
        setMsgType('');
        setMessage('');
        onAdminStatus && onAdminStatus(true);
      } else {
        setMsgType('error');
        setMessage(data.message || 'Password salah');
      }
    } catch {
      setMsgType('error');
      setMessage('Gagal login');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/admin/admin.php?action=logout');
    } catch { /* ignore */ }
    setIsAdmin(false);
    onAdminStatus && onAdminStatus(false);
  };

  return (
    <div style={{ position: 'fixed', top: '12px', right: '12px', zIndex: 9999 }}>
      {isAdmin ? (
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 14px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          🚪 Admin Mode
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '6px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          Login as Admin
        </button>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999
          }}
        >
          <form
            onSubmit={handleLogin}
            style={{
              padding: '20px',
              background: '#0c162c',
              border: '1px solid #38bdf8',
              borderRadius: '10px',
              width: '280px',
              maxWidth: '90vw'
            }}
          >
            <h3 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
              Login Admin
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Masukkan password admin:
            </p>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: message ? '8px' : '14px',
                background: '#08101f',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            {message && (
              <p
                style={{
                  fontSize: '12px',
                  color: msgType === 'error' ? '#fb7185' : '#4ade80',
                  margin: '6px 0 12px'
                }}
              >
                {message}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowModal(false); setPassword(''); setMessage(''); setMsgType(''); }}
                style={{
                  background: '#475569',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Masuk
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
