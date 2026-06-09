import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';


export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode]   = useState('');
  const [needMfa, setNeedMfa]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { email, password };
      if (needMfa) payload.mfaCode = mfaCode;

      const res = await api.post('/auth/login', payload);

      sessionStorage.setItem('vito_token', res.data.token);

      navigate('/dashboard');

      if (res.data.unknownLocation) {
        console.warn('Logowanie z nowej lokalizacji');
      }

    } catch (err) {
      const status = err.response?.status;
      if (status === 202) {
        setNeedMfa(true);
        setError('Wprowadź kod z aplikacji uwierzytelniającej (MFA).');
      } else if (status === 423) {
        setError(err.response.data?.error || 'Konto tymczasowo zablokowane. Spróbuj później.');
      } else if (status === 403) {
        setError('Twoje hasło wygasło. Skontaktuj się z administratorem.');
      } else {
        setError('Nieprawidłowy e-mail lub hasło.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🏥</div>
        <h2 style={styles.title}>Vito Clinic</h2>
        <p style={styles.subtitle}>Bezpieczny System Dokumentacji Medycznej</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form} autoComplete="on">
          <label style={styles.label}>Adres e-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            maxLength={254}
            autoComplete="email"
            style={styles.input}
            placeholder="jan@przychodnia.pl"
          />

          <label style={styles.label}>Hasło</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            maxLength={128}
            autoComplete="current-password"
            style={styles.input}
            placeholder="••••••••"
          />

          {needMfa && (
            <>
              <label style={styles.label}>Kod MFA (6 cyfr)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                style={styles.input}
                placeholder="123456"
                autoFocus
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div style={styles.rodoNote}>
          <strong>Informacja RODO:</strong> Twoje dane osobowe i medyczne są szyfrowane
          algorytmem AES-256-GCM. Administratorem danych jest Vito Clinic.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:     { minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' },
  card:     { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: '420px' },
  logo:     { textAlign: 'center', fontSize: '48px', marginBottom: '8px' },
  title:    { textAlign: 'center', margin: '0 0 4px', fontSize: '24px', color: '#1a2b4a' },
  subtitle: { textAlign: 'center', color: '#6b7280', fontSize: '13px', margin: '0 0 24px' },
  form:     { display: 'flex', flexDirection: 'column', gap: '8px' },
  label:    { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input:    { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  button:   { marginTop: '8px', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600' },
  error:    { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  rodoNote: { marginTop: '24px', padding: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '11px', color: '#0369a1', lineHeight: '1.5' },
};
