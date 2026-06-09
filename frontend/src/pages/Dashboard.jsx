import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

// ─── ikony SVG (inline, zero zależności) ──────────────────────────────────────
const Icon = {
  patients:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  plus:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  notes:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  cancel:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  edit:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chevron:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  close:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABEL = { SCHEDULED: 'Zaplanowana', COMPLETED: 'Zakończona', CANCELLED: 'Odwołana' };
const STATUS_COLOR = { SCHEDULED: '#2563eb', COMPLETED: '#16a34a', CANCELLED: '#9ca3af' };

function Badge({ status }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '12px',
      fontWeight: 600, color: 'white', background: STATUS_COLOR[status] ?? '#6b7280',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const colors = {
    error:   { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  }[type] ?? { bg: '#f9fafb', border: '#d1d5db', text: '#374151' };
  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
      padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: '0 2px' }}><Icon.close /></button>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 0', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a2b4a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', padding: '4px' }}><Icon.close /></button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Input / Textarea helpers ─────────────────────────────────────────────────
const inputStyle = { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '7px',
  fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' };
const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' };

function Field({ label, children }) {
  return <div style={{ marginBottom: '14px' }}><label style={labelStyle}>{label}</label>{children}</div>;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px',
      borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
          fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
          color: active === t.id ? '#2563eb' : '#6b7280',
          borderBottom: active === t.id ? '2px solid #2563eb' : '2px solid transparent',
          marginBottom: '-2px', transition: 'all 0.15s',
        }}>
          {t.icon && <t.icon />}{t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
function Btn({ onClick, variant = 'primary', size = 'md', disabled, children, type = 'button' }) {
  const colors = {
    primary: { bg: '#2563eb', color: 'white' },
    danger:  { bg: '#dc2626', color: 'white' },
    ghost:   { bg: '#f3f4f6', color: '#374151' },
    success: { bg: '#16a34a', color: 'white' },
  }[variant];
  const pad = size === 'sm' ? '5px 12px' : '9px 18px';
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: pad, background: disabled ? '#9ca3af' : colors.bg, color: colors.color,
      border: 'none', borderRadius: '7px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.15s',
    }}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ: PACJENCI
// ═══════════════════════════════════════════════════════════════════════════════
function PatientsTab({ role }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch { setAlert({ type: 'error', msg: 'Nie udało się pobrać listy pacjentów.' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.pesel}`.toLowerCase().includes(search.toLowerCase())
  );

  const canWrite = ['ADMIN', 'NURSE', 'DOCTOR'].includes(role);

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj po nazwisku lub PESEL…"
          style={{ ...inputStyle, maxWidth: '280px' }} />
        {canWrite && (
          <Btn onClick={() => setShowAddModal(true)}><Icon.plus /> Dodaj pacjenta</Btn>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>Ładowanie…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
          {search ? 'Brak wyników.' : 'Brak pacjentów w bazie.'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Imię i nazwisko', 'PESEL', 'Telefon', ...(canWrite ? ['Akcje'] : [])].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px',
                    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '13px 14px', fontWeight: 600, color: '#1a2b4a' }}>
                    {p.firstName} {p.lastName}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px',
                      fontFamily: 'monospace', fontSize: '13px' }}>{p.pesel}</span>
                  </td>
                  <td style={{ padding: '13px 14px', color: '#6b7280' }}>{p.phoneNumber || '—'}</td>
                  {canWrite && (
                    <td style={{ padding: '13px 14px' }}>
                      <Btn size="sm" variant="ghost" onClick={() => setEditPatient(p)}>
                        <Icon.edit /> Edytuj
                      </Btn>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <PatientFormModal
          title="Dodaj pacjenta"
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetch(); setAlert({ type: 'success', msg: 'Pacjent dodany.' }); }}
          role={role}
        />
      )}
      {editPatient && (
        <PatientFormModal
          title={`Edytuj: ${editPatient.firstName} ${editPatient.lastName}`}
          patient={editPatient}
          onClose={() => setEditPatient(null)}
          onSaved={() => { setEditPatient(null); fetch(); setAlert({ type: 'success', msg: 'Dane zaktualizowane.' }); }}
          role={role}
        />
      )}
    </div>
  );
}

function PatientFormModal({ title, patient, onClose, onSaved, role }) {
  const editing = !!patient;
  const [form, setForm] = useState({
    userId: patient?.userId ?? '',
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    pesel: patient?.pesel ?? '',
    phoneNumber: patient?.phoneNumber ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!/^\d{11}$/.test(form.pesel)) { setError('PESEL musi mieć dokładnie 11 cyfr.'); return; }
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Imię i nazwisko są wymagane.'); return; }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        pesel: form.pesel.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
      };
      if (role !== 'PATIENT' && form.userId) payload.userId = Number(form.userId);

      if (editing) {
        await api.put(`/patients/${patient.id}`, payload);
      } else {
        await api.post('/patients', payload);
      }
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || d?.message || JSON.stringify(d?.errors) || 'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={title} onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {!editing && (
        <Field label="User ID pacjenta (opcjonalne)">
          <input style={inputStyle} type="number" value={form.userId}
            onChange={e => set('userId', e.target.value)} placeholder="np. 5" />
        </Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Imię *">
          <input style={inputStyle} type="text" maxLength={64} value={form.firstName}
            onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label="Nazwisko *">
          <input style={inputStyle} type="text" maxLength={64} value={form.lastName}
            onChange={e => set('lastName', e.target.value)} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="PESEL *">
          <input style={inputStyle} type="text" maxLength={11} value={form.pesel}
            onChange={e => set('pesel', e.target.value.replace(/\D/g, ''))}
            placeholder="90010112345" disabled={editing} />
        </Field>
        <Field label="Telefon">
          <input style={inputStyle} type="tel" maxLength={20} value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)} placeholder="+48 123 456 789" />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>
          <Icon.check /> {saving ? 'Zapisywanie…' : (editing ? 'Zapisz zmiany' : 'Dodaj pacjenta')}
        </Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ: WIZYTY
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentsTab({ role }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notesModal, setNotesModal] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch { setAlert({ type: 'error', msg: 'Nie udało się pobrać wizyt.' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCancel = async (id) => {
    if (!window.confirm('Czy na pewno chcesz odwołać tę wizytę?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setAlert({ type: 'success', msg: 'Wizyta odwołana.' });
      fetch();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Nie udało się odwołać wizyty.' });
    }
  };

  const canWrite = ['ADMIN', 'NURSE', 'DOCTOR'].includes(role);
  const canAddNotes = ['ADMIN', 'NURSE'].includes(role);

  const filtered = filter === 'ALL' ? appointments
    : appointments.filter(a => a.status === filter);

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '5px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              borderColor: filter === s ? '#2563eb' : '#d1d5db',
              background: filter === s ? '#2563eb' : 'white',
              color: filter === s ? 'white' : '#6b7280',
            }}>
              {s === 'ALL' ? 'Wszystkie' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {canWrite && (
          <Btn onClick={() => setShowAddModal(true)}><Icon.plus /> Umów wizytę</Btn>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>Ładowanie…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>Brak wizyt.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(a => (
            <AppointmentCard key={a.id} appt={a} role={role}
              canWrite={canWrite} canAddNotes={canAddNotes}
              onCancel={() => handleCancel(a.id)}
              onNotes={() => setNotesModal(a)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AppointmentFormModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetch(); setAlert({ type: 'success', msg: 'Wizyta zaplanowana.' }); }}
        />
      )}
      {notesModal && (
        <NurseNotesModal
          appointment={notesModal}
          onClose={() => setNotesModal(null)}
          onSaved={() => { setNotesModal(null); fetch(); setAlert({ type: 'success', msg: 'Notatki zapisane.' }); }}
        />
      )}
    </div>
  );
}

function AppointmentCard({ appt, canWrite, canAddNotes, onCancel, onNotes }) {
  const date = new Date(appt.appointmentDate);
  const isPast = date < new Date();

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px',
      padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      borderLeft: `4px solid ${STATUS_COLOR[appt.status]}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Badge status={appt.status} />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>#{appt.id}</span>
        </div>
        <div style={{ fontWeight: 700, color: '#1a2b4a', marginBottom: '4px' }}>
          {appt.patientName}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          dr {appt.doctorName} · {date.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>
      {(canWrite || canAddNotes) && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {canAddNotes && appt.status !== 'CANCELLED' && (
            <Btn size="sm" variant="ghost" onClick={onNotes}>
              <Icon.notes /> Notatki
            </Btn>
          )}
          {canWrite && appt.status === 'SCHEDULED' && !isPast && (
            <Btn size="sm" variant="danger" onClick={onCancel}>
              <Icon.cancel /> Odwołaj
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentFormModal({ onClose, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]); 
  const [form, setForm] = useState({ patientId: '', doctorId: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/appointments')])
      .then(([pRes, aRes]) => {
        setPatients(pRes.data);
        const dMap = {};
        aRes.data.forEach(a => { if (a.doctorId) dMap[a.doctorId] = a.doctorName; });
        setDoctors(Object.entries(dMap).map(([id, name]) => ({ id: Number(id), name })));
      })
      .catch(() => setError('Nie udało się załadować danych.'))
      .finally(() => setLoadingData(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.patientId || !form.doctorId) { setError('Wybierz pacjenta i lekarza.'); return; }
    if (!form.date || !form.time) { setError('Podaj datę i godzinę wizyty.'); return; }

    const appointmentDate = new Date(`${form.date}T${form.time}`).toISOString();
    if (new Date(appointmentDate) <= new Date()) { setError('Data wizyty musi być w przyszłości.'); return; }

    setSaving(true);
    try {
      await api.post('/appointments', {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        appointmentDate,
      });
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || d?.message || JSON.stringify(d?.errors) || 'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Modal title="Umów wizytę" onClose={onClose}>
      {error && <Alert type="error" msg={error} />}
      {loadingData ? <p style={{ color: '#6b7280' }}>Ładowanie danych…</p> : (
        <>
          <Field label="Pacjent *">
            <select style={inputStyle} value={form.patientId} onChange={e => set('patientId', e.target.value)}>
              <option value="">— wybierz pacjenta —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.pesel})</option>
              ))}
            </select>
          </Field>
          <Field label="Lekarz (ID) *">
            {doctors.length > 0 ? (
              <select style={inputStyle} value={form.doctorId} onChange={e => set('doctorId', e.target.value)}>
                <option value="">— wybierz lekarza —</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            ) : (
              <input style={inputStyle} type="number" value={form.doctorId}
                onChange={e => set('doctorId', e.target.value)}
                placeholder="Wpisz ID lekarza (np. 1)" />
            )}
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Data *">
              <input style={inputStyle} type="date" min={minDate} value={form.date}
                onChange={e => set('date', e.target.value)} />
            </Field>
            <Field label="Godzina *">
              <input style={inputStyle} type="time" value={form.time}
                onChange={e => set('time', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>
              <Icon.check /> {saving ? 'Zapisywanie…' : 'Umów wizytę'}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

function NurseNotesModal({ appointment, onClose, onSaved }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!notes.trim()) { setError('Wpisz treść notatek.'); return; }
    if (notes.length > 2000) { setError('Notatki nie mogą przekraczać 2000 znaków.'); return; }
    setSaving(true);
    try {
      await api.patch(`/appointments/${appointment.id}/nurse-notes`, { notes });
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || d?.message || 'Błąd zapisu notatek.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Notatki pielęgniarki — wizyta #${appointment.id}`} onClose={onClose}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
        Pacjent: <strong>{appointment.patientName}</strong> · dr {appointment.doctorName}
      </p>
      {error && <Alert type="error" msg={error} />}
      <Field label="Notatki *">
        <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Obserwacje, pomiar ciśnienia, temperatura…"
          maxLength={2000} />
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{notes.length}/2000</span>
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn variant="success" onClick={handleSubmit} disabled={saving}>
          <Icon.check /> {saving ? 'Zapisywanie…' : 'Zapisz notatki'}
        </Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GŁÓWNY DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState('patients');
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('vito_token');
    const decoded = jwtDecode(token);
    setRole(decoded.role);
    if (decoded.role === 'PATIENT') setActiveTab('appointments');
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('vito_token');
    navigate('/login');
  };

  const isPrivileged = ['DOCTOR', 'NURSE', 'ADMIN'].includes(role);

  const tabs = [
    ...(isPrivileged ? [{ id: 'patients', label: 'Pacjenci', icon: Icon.patients }] : []),
    { id: 'appointments', label: 'Wizyty', icon: Icon.calendar },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#1e3a5f', padding: '0 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', height: '56px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>
          🏥 Vito Clinic
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#334d6e', color: '#93c5fd', padding: '4px 12px',
            borderRadius: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
            {role}
          </span>
          <button onClick={handleLogout} style={{ padding: '6px 14px', background: '#dc2626',
            color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600 }}>
            Wyloguj
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 16px' }}>
        {/* Widok pacjenta (PATIENT) — brak zakładki Pacjenci */}
        {role === 'PATIENT' && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
            padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: '#1d4ed8' }}>
            🔒 Twoje dane są szyfrowane AES-256-GCM · Przetwarzamy je zgodnie z RODO (UE 2016/679)
          </div>
        )}

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'patients' && isPrivileged && <PatientsTab role={role} />}
        {activeTab === 'appointments' && <AppointmentsTab role={role} />}
      </div>
    </div>
  );
}
