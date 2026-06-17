import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

const Icon = {
  patients: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  staff:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  plus:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  notes:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  cancel:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  edit:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  close:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  search:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  link:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

const STATUS_LABEL = { SCHEDULED:'Zaplanowana', COMPLETED:'Zakończona', CANCELLED:'Odwołana' };
const STATUS_COLOR = { SCHEDULED:'#2563eb', COMPLETED:'#16a34a', CANCELLED:'#9ca3af' };
const T = { navy:'#1e3a5f', blue:'#2563eb', blueLt:'#eff6ff', green:'#16a34a', red:'#dc2626', g50:'#f9fafb', g100:'#f3f4f6', g200:'#e5e7eb', g400:'#9ca3af', g500:'#6b7280', g700:'#374151', g900:'#111827' };
const IS = { padding:'9px 12px', border:`1px solid ${T.g200}`, borderRadius:7, fontSize:14, width:'100%', boxSizing:'border-box', background:'white', color:T.g900, outline:'none' };

// ── atoms ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  return <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'white', background:STATUS_COLOR[status]??T.g400 }}>{STATUS_LABEL[status]??status}</span>;
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const c = ({error:['#fef2f2','#fca5a5','#b91c1c'],success:['#f0fdf4','#86efac','#166534'],info:['#eff6ff','#93c5fd','#1d4ed8']})[type]??['#f9fafb','#d1d5db','#374151'];
  return (
    <div style={{ background:c[0], border:`1px solid ${c[1]}`, color:c[2], padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:c[2], padding:'0 2px', flexShrink:0 }}><Icon.close/></button>}
    </div>
  );
}

function Btn({ onClick, variant='primary', size='md', disabled, children, type='button' }) {
  const v = ({primary:[T.blue,'white'], danger:[T.red,'white'], ghost:[T.g100,T.g700], success:[T.green,'white']})[variant];
  return <button type={type} onClick={onClick} disabled={disabled} style={{ padding:size==='sm'?'5px 11px':'9px 18px', background:disabled?T.g400:v[0], color:v[1], border:'none', borderRadius:7, fontWeight:600, cursor:disabled?'not-allowed':'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:5 }}>{children}</button>;
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:13, fontWeight:600, color:T.g700, display:'block', marginBottom:4 }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize:11, color:T.g400 }}>{hint}</span>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', borderRadius:12, width:'100%', maxWidth:540, boxShadow:'0 16px 48px rgba(0,0,0,0.22)', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px 0', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:T.navy }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.g500 }}><Icon.close/></button>
        </div>
        <div style={{ padding:'0 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:2, borderBottom:`2px solid ${T.g200}`, marginBottom:22 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:6, color:active===t.id?T.blue:T.g500, borderBottom:`2px solid ${active===t.id?T.blue:'transparent'}`, marginBottom:-2 }}>
          {t.icon && <t.icon/>}{t.label}
        </button>
      ))}
    </div>
  );
}

// ── SearchSelect: autocomplete dropdown ───────────────────────────────────────
function SearchSelect({ items, value, onChange, placeholder, getLabel, getSelectedLabel, emptyMsg }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.id === value);
  const filtered = q.trim() ? items.filter(i => getLabel(i).toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div style={{ position:'relative' }}>
      {selected && !open ? (
        <div onClick={() => { setOpen(true); setQ(''); }}
          style={{ ...IS, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
          <span style={{ fontWeight:600, color:T.navy }}>{(getSelectedLabel??getLabel)(selected)}</span>
          <span style={{ fontSize:11, color:T.g400 }}>zmień ▾</span>
        </div>
      ) : (
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.g400, pointerEvents:'none' }}><Icon.search/></span>
          <input style={{ ...IS, paddingLeft:32 }} autoFocus={open} value={q}
            onChange={e => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)} placeholder={placeholder} />
        </div>
      )}
      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:9 }} onClick={() => { setOpen(false); setQ(''); }}/>
          <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:'white', border:`1px solid ${T.g200}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:220, overflowY:'auto', marginTop:2 }}>
            {filtered.length === 0
              ? <div style={{ padding:'12px 14px', color:T.g400, fontSize:13 }}>{emptyMsg??'Brak wyników'}</div>
              : filtered.map(i => (
                <div key={i.id} onClick={() => { onChange(i.id); setOpen(false); setQ(''); }}
                  style={{ padding:'10px 14px', cursor:'pointer', fontSize:14, background:i.id===value?T.blueLt:'white', color:i.id===value?T.blue:T.g900, fontWeight:i.id===value?600:400, borderBottom:`1px solid ${T.g100}` }}
                  onMouseEnter={e => e.currentTarget.style.background = i.id===value?T.blueLt:T.g50}
                  onMouseLeave={e => e.currentTarget.style.background = i.id===value?T.blueLt:'white'}>
                  {getLabel(i)}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PACJENCI
// ══════════════════════════════════════════════════════════════════════════════
function PatientsTab({ role }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [editTarget, setEdit]   = useState(null);
  const [linkTarget, setLink]   = useState(null);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setPatients((await api.get('/patients')).data); }
    catch (e) { setAlert({ type:'error', msg: e.response?.data?.error || 'Nie udało się pobrać listy pacjentów.' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.pesel}`.toLowerCase().includes(search.toLowerCase())
  );
  const canWrite = ['ADMIN','NURSE','DOCTOR'].includes(role);

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:300 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.g400 }}><Icon.search/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj po nazwisku lub PESEL…" style={{ ...IS, paddingLeft:32 }}/>
        </div>
        {canWrite && <Btn onClick={() => setShowAdd(true)}><Icon.plus/> Dodaj pacjenta</Btn>}
      </div>

      {loading ? <p style={{ color:T.g500, textAlign:'center', padding:'40px 0' }}>Ładowanie…</p>
      : filtered.length === 0 ? <p style={{ color:T.g500, textAlign:'center', padding:'40px 0' }}>{search?'Brak wyników.':'Brak pacjentów w bazie.'}</p>
      : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:T.g50 }}>
                {['Imię i nazwisko','PESEL','Telefon','Konto', canWrite?'':''].map((h,i) => (
                  <th key={i} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${T.g200}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom:`1px solid ${T.g100}` }}>
                  <td style={{ padding:'13px 14px', fontWeight:600, color:T.navy }}>{p.firstName} {p.lastName}</td>
                  <td style={{ padding:'13px 14px' }}><span style={{ background:T.g100, padding:'2px 8px', borderRadius:4, fontFamily:'monospace', fontSize:13 }}>{p.pesel}</span></td>
                  <td style={{ padding:'13px 14px', color:T.g500 }}>{p.phoneNumber||'—'}</td>
                  <td style={{ padding:'13px 14px' }}>
                    {p.userId
                      ? <span style={{ fontSize:12, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><Icon.link/> ID {p.userId}</span>
                      : <span style={{ fontSize:12, color:'#9ca3af' }}>brak konta</span>}
                  </td>
                  {canWrite && <td style={{ padding:'13px 14px', textAlign:'right' }}>
                    <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                      {role==='ADMIN' && !p.userId && <Btn size="sm" variant="success" onClick={() => setLink(p)}><Icon.link/> Powiąż</Btn>}
                      <Btn size="sm" variant="ghost" onClick={() => setEdit(p)}><Icon.edit/> Edytuj</Btn>
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <PatientFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); setAlert({ type:'success', msg:'Pacjent dodany.' }); }}/>}
      {editTarget && <PatientFormModal patient={editTarget} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); setAlert({ type:'success', msg:'Dane zaktualizowane.' }); }}/>}
      {linkTarget && <LinkAccountModal patient={linkTarget} onClose={() => setLink(null)} onSaved={(uid) => { setLink(null); load(); setAlert({ type:'success', msg:`Konto (ID: ${uid}) powiązane z profilem.` }); }}/>}
    </div>
  );
}

function PatientFormModal({ patient, onClose, onSaved }) {
  const editing = !!patient;
  const [form, setForm] = useState({ firstName:patient?.firstName??'', lastName:patient?.lastName??'', pesel:patient?.pesel?.replace(/\*/g,'')||'', phoneNumber:patient?.phoneNumber??'', userId:patient?.userId??'' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    setError('');
    if (!form.firstName.trim()) return setError('Imię jest wymagane.');
    if (!form.lastName.trim())  return setError('Nazwisko jest wymagane.');
    if (!editing && !/^\d{11}$/.test(form.pesel)) return setError('PESEL musi mieć dokładnie 11 cyfr.');
    setSaving(true);
    try {
      const payload = { firstName:form.firstName.trim(), lastName:form.lastName.trim(), pesel:form.pesel, phoneNumber:form.phoneNumber.trim()||null, ...(form.userId?{userId:Number(form.userId)}:{}) };
      editing ? await api.put(`/patients/${patient.id}`, payload) : await api.post('/patients', payload);
      onSaved();
    } catch(e) {
      const d = e.response?.data;
      setError(d?.error||d?.message||JSON.stringify(d?.errors)||'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing?`Edytuj: ${patient.firstName} ${patient.lastName}`:'Dodaj pacjenta'} onClose={onClose}>
      {error && <Alert type="error" msg={error}/>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Imię" required><input style={IS} value={form.firstName} onChange={e => set('firstName',e.target.value)} maxLength={64} placeholder="Jan"/></Field>
        <Field label="Nazwisko" required><input style={IS} value={form.lastName} onChange={e => set('lastName',e.target.value)} maxLength={64} placeholder="Kowalski"/></Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="PESEL" required={!editing} hint={editing?'PESEL nie może być zmieniony':undefined}>
          <input style={{ ...IS, ...(editing?{background:T.g100,color:T.g400,cursor:'not-allowed'}:{}) }} disabled={editing}
            value={form.pesel} onChange={e => set('pesel',e.target.value.replace(/\D/g,''))} maxLength={11} placeholder="90010112345"/>
        </Field>
        <Field label="Telefon"><input style={IS} value={form.phoneNumber} onChange={e => set('phoneNumber',e.target.value)} maxLength={20} placeholder="+48 123 456 789"/></Field>
      </div>
      {!editing && (
        <Field label="ID konta użytkownika" hint="Opcjonalne — możesz powiązać konto później">
          <input style={IS} type="number" value={form.userId} onChange={e => set('userId',e.target.value)} placeholder="np. 5"/>
        </Field>
      )}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn onClick={submit} disabled={saving}><Icon.check/> {saving?'Zapisywanie…':editing?'Zapisz zmiany':'Dodaj pacjenta'}</Btn>
      </div>
    </Modal>
  );
}


// ── LinkAccountModal ──────────────────────────────────────────────────────────
function LinkAccountModal({ patient, onClose, onSaved }) {
  const [userId, setUserId] = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    if (!userId || isNaN(Number(userId))) return setError('Podaj prawidłowe ID użytkownika.');
    setSaving(true);
    try {
      await api.patch(`/patients/${patient.id}/link-account`, { userId: Number(userId) });
      onSaved(Number(userId));
    } catch(e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Błąd powiązania konta.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Powiąż konto — ${patient.firstName} ${patient.lastName}`} onClose={onClose}>
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#1d4ed8' }}>
        ℹ Podaj <strong>User ID</strong> z auth-service aby pacjent mógł logować się i widzieć swoje wizyty.
        Sprawdź ID przez: <code style={{ background:'#dbeafe', padding:'1px 5px', borderRadius:3 }}>docker exec clinic-postgres psql -U postgres -d auth_db -c "SELECT id, email FROM users;"</code>
      </div>
      {error && <Alert type="error" msg={error}/>}
      <Field label="User ID (z tabeli users w auth-service)" required>
        <input style={IS} type="number" value={userId} onChange={e => setUserId(e.target.value)}
          placeholder="np. 3" autoFocus/>
      </Field>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn variant="success" onClick={submit} disabled={saving}>
          <Icon.link/> {saving ? 'Zapisywanie…' : 'Powiąż konto'}
        </Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WIZYTY
// ══════════════════════════════════════════════════════════════════════════════
function AppointmentsTab({ role }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [notesTarget, setNotes] = useState(null);
  const [sf, setSf]           = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try { setAppointments((await api.get('/appointments')).data); }
    catch(e) { setAlert({ type:'error', msg:e.response?.data?.error||'Nie udało się pobrać wizyt.' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doCancel = async id => {
    if (!confirm('Odwołać tę wizytę?')) return;
    try { await api.patch(`/appointments/${id}/cancel`); setAlert({type:'success',msg:'Wizyta odwołana.'}); load(); }
    catch(e) { setAlert({type:'error',msg:e.response?.data?.error||'Błąd odwoływania.'}); }
  };

  const canWrite    = ['ADMIN','NURSE','DOCTOR'].includes(role);
  const canAddNotes = ['ADMIN','NURSE'].includes(role);
  const counts = appointments.reduce((a,v) => { a[v.status]=(a[v.status]??0)+1; return a; }, {});
  const visible = sf==='ALL' ? appointments : appointments.filter(a => a.status===sf);

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['ALL','Wszystkie'],['SCHEDULED','Zaplanowane'],['COMPLETED','Zakończone'],['CANCELLED','Odwołane']].map(([s,l]) => (
            <button key={s} onClick={() => setSf(s)} style={{ padding:'5px 13px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', borderColor:sf===s?T.blue:T.g200, background:sf===s?T.blue:'white', color:sf===s?'white':T.g500 }}>
              {l}{s!=='ALL'&&counts[s]?` (${counts[s]})`:s==='ALL'?` (${appointments.length})`:''}
            </button>
          ))}
        </div>
        {canWrite && <Btn onClick={() => setShowAdd(true)}><Icon.plus/> Umów wizytę</Btn>}
      </div>

      {loading ? <p style={{ color:T.g500, textAlign:'center', padding:'40px 0' }}>Ładowanie…</p>
      : visible.length===0 ? <p style={{ color:T.g500, textAlign:'center', padding:'40px 0' }}>Brak wizyt w tej kategorii.</p>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {visible.map(a => {
            const date = new Date(a.appointmentDate);
            const isPast = date < new Date();
            return (
              <div key={a.id} style={{ background:'white', border:`1px solid ${T.g200}`, borderRadius:10, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap', borderLeft:`4px solid ${STATUS_COLOR[a.status]}` }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <Badge status={a.status}/>
                    <span style={{ fontSize:12, color:T.g400 }}>#{a.id}</span>
                  </div>
                  <div style={{ fontWeight:700, color:T.navy, marginBottom:3 }}>{a.patientName}</div>
                  <div style={{ fontSize:13, color:T.g500 }}>dr {a.doctorName} · {date.toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'})}</div>
                  {a.nurseNotes && (
                    <div style={{ fontSize:12, color:T.g700, marginTop:5, padding:'4px 8px', background:T.g100, borderRadius:5, borderLeft:`3px solid ${T.blue}` }}>
                      <span style={{ fontWeight:600, color:T.g500 }}>Notatki: </span>{a.nurseNotes.length > 80 ? a.nurseNotes.slice(0,80)+'…' : a.nurseNotes}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {canAddNotes && a.status!=='CANCELLED' && <Btn size="sm" variant="ghost" onClick={() => setNotes(a)}><Icon.notes/> Notatki</Btn>}
                  {canWrite && a.status==='SCHEDULED' && !isPast && <Btn size="sm" variant="danger" onClick={() => doCancel(a.id)}><Icon.cancel/> Odwołaj</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AppointmentFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); setAlert({type:'success',msg:'Wizyta zaplanowana.'}); }}/>}
      {notesTarget && <NurseNotesModal appointment={notesTarget} onClose={() => setNotes(null)} onSaved={() => { setNotes(null); load(); setAlert({type:'success',msg:'Notatki zapisane.'}); }}/>}
    </div>
  );
}

function AppointmentFormModal({ onClose, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [patientId, setPid] = useState(null);
  const [doctorId,  setDid] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/staff')])
      .then(([p, s]) => { setPatients(p.data); setDoctors(s.data); })
      .catch(e => setError(e.response?.data?.error||'Nie udało się załadować listy pacjentów i lekarzy.'))
      .finally(() => setLoading(false));
  }, []);

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const minDate  = tomorrow.toISOString().split('T')[0];

  const submit = async () => {
    setError('');
    if (!patientId) return setError('Wybierz pacjenta.');
    if (!doctorId)  return setError('Wybierz lekarza.');
    if (!date||!time) return setError('Podaj datę i godzinę.');
    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    if (new Date(appointmentDate)<=new Date()) return setError('Data musi być w przyszłości.');
    setSaving(true);
    try {
      await api.post('/appointments', { patientId, doctorId, appointmentDate });
      onSaved();
    } catch(e) {
      const d = e.response?.data;
      setError(d?.error||d?.message||JSON.stringify(d?.errors)||'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Umów wizytę" onClose={onClose}>
      {error && <Alert type="error" msg={error}/>}
      {loading ? <p style={{ color:T.g500, textAlign:'center', padding:'20px 0' }}>Ładowanie…</p> : (
        <>
          <Field label="Pacjent" required>
            <SearchSelect items={patients} value={patientId} onChange={setPid}
              placeholder="Wpisz imię lub nazwisko…"
              getLabel={p => `${p.firstName} ${p.lastName}`}
              emptyMsg="Brak pacjentów — najpierw dodaj pacjenta w zakładce Pacjenci"/>
          </Field>
          <Field label="Lekarz" required>
            <SearchSelect items={doctors} value={doctorId} onChange={setDid}
              placeholder="Wpisz nick lub nazwisko…"
              getLabel={d => `@${d.username??'?'} — ${d.firstName} ${d.lastName}${d.specialization?` (${d.specialization})`:''}`}
              getSelectedLabel={d => `@${d.username??'?'} — ${d.firstName} ${d.lastName}`}
              emptyMsg="Brak lekarzy — administrator musi dodać personel w zakładce Personel"/>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Data" required><input style={IS} type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)}/></Field>
            <Field label="Godzina" required><input style={IS} type="time" value={time} onChange={e => setTime(e.target.value)}/></Field>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
            <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
            <Btn onClick={submit} disabled={saving}><Icon.check/> {saving?'Zapisywanie…':'Umów wizytę'}</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

function NurseNotesModal({ appointment, onClose, onSaved }) {
  const [notes, setNotes] = useState(appointment.nurseNotes || '');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!appointment.nurseNotes;
  const submit = async () => {
    setError('');
    if (!notes.trim()) return setError('Notatki nie mogą być puste.');
    if (notes.length>2000) return setError('Maksymalnie 2000 znaków.');
    setSaving(true);
    try { await api.patch(`/appointments/${appointment.id}/nurse-notes`, { notes }); onSaved(); }
    catch(e) { setError(e.response?.data?.error||'Błąd zapisu notatek.'); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`${isEdit ? 'Edytuj notatki' : 'Dodaj notatki'} — wizyta #${appointment.id}`} onClose={onClose}>
      <p style={{ fontSize:13, color:T.g500, marginBottom:14 }}>Pacjent: <strong style={{ color:T.navy }}>{appointment.patientName}</strong> · dr {appointment.doctorName}</p>
      {isEdit && <Alert type="info" msg="Edytujesz istniejące notatki. Zapisanie zastąpi poprzednią treść."/>}
      {error && <Alert type="error" msg={error}/>}
      <Field label="Treść notatek" required hint={`${notes.length}/2000 znaków`}>
        <textarea style={{ ...IS, minHeight:120, resize:'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} placeholder="Pomiar ciśnienia, temperatura, obserwacje…"/>
      </Field>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn variant="success" onClick={submit} disabled={saving}><Icon.check/> {saving?'Zapisywanie…':'Zapisz notatki'}</Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSONEL (tylko ADMIN)
// ══════════════════════════════════════════════════════════════════════════════
function StaffTab() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStaff((await api.get('/staff')).data); }
    catch(e) { setAlert({type:'error', msg:e.response?.data?.error||'Nie udało się pobrać listy personelu.'}); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)}/>}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn onClick={() => setShowAdd(true)}><Icon.plus/> Dodaj personel</Btn>
      </div>
      {loading ? <p style={{ color:T.g500, textAlign:'center', padding:'40px 0' }}>Ładowanie…</p>
      : staff.length===0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:T.g500 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🩺</div>
          <p style={{ margin:0 }}>Brak personelu. Dodaj pierwszego lekarza lub pielęgniarkę.</p>
          <p style={{ margin:'8px 0 0', fontSize:13, color:T.g400 }}>Bez dodanego personelu nie można umawiać wizyt.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {staff.map(s => (
            <div key={s.id} style={{ background:'white', border:`1px solid ${T.g200}`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:T.blueLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🩺</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:T.navy }}>{s.firstName} {s.lastName}</div>
                <div style={{ fontSize:13, color:T.g500, display:'flex', gap:10, flexWrap:'wrap', marginTop:2 }}>
                  {s.username && <span style={{ color:T.blue, fontWeight:600 }}>@{s.username}</span>}
                  {s.specialization && <span>{s.specialization}</span>}
                  {s.licenseNumber && <span style={{ color:T.g400 }}>nr lic. {s.licenseNumber}</span>}
                </div>
              </div>
              <span style={{ fontSize:11, color:T.g400, flexShrink:0 }}>ID {s.id}</span>
            </div>
          ))}
        </div>
      )}
      {showAdd && <StaffFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); setAlert({type:'success',msg:'Pracownik dodany.'}); }}/>}
    </div>
  );
}

function StaffFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ userId:'', username:'', firstName:'', lastName:'', specialization:'', licenseNumber:'' });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    setError('');
    if (!form.userId)          return setError('ID użytkownika jest wymagane.');
    if (!form.username.trim()) return setError('Nick (@username) jest wymagany.');
    if (!form.firstName.trim())return setError('Imię jest wymagane.');
    if (!form.lastName.trim()) return setError('Nazwisko jest wymagane.');
    setSaving(true);
    try {
      await api.post('/staff', { userId:Number(form.userId), username:form.username.trim(), firstName:form.firstName.trim(), lastName:form.lastName.trim(), specialization:form.specialization.trim()||null, licenseNumber:form.licenseNumber.trim()||null });
      onSaved();
    } catch(e) {
      const d = e.response?.data;
      setError(d?.error||d?.message||JSON.stringify(d?.errors)||'Błąd zapisu.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Dodaj personel medyczny" onClose={onClose}>
      {error && <Alert type="error" msg={error}/>}
      <div style={{ background:T.blueLt, border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#1d4ed8' }}>
        ℹ Użytkownik musi mieć konto w systemie. Podaj jego User ID z auth-service (tabela <code>users</code>).
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="User ID" required hint="ID z bazy auth-service"><input style={IS} type="number" value={form.userId} onChange={e => set('userId',e.target.value)} placeholder="np. 3"/></Field>
        <Field label="Nick (@username)" required><input style={IS} value={form.username} onChange={e => set('username',e.target.value)} maxLength={64} placeholder="dr.nowak"/></Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Imię" required><input style={IS} value={form.firstName} onChange={e => set('firstName',e.target.value)} maxLength={64}/></Field>
        <Field label="Nazwisko" required><input style={IS} value={form.lastName} onChange={e => set('lastName',e.target.value)} maxLength={64}/></Field>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Specjalizacja"><input style={IS} value={form.specialization} onChange={e => set('specialization',e.target.value)} maxLength={128} placeholder="Kardiologia"/></Field>
        <Field label="Nr licencji (PWZ)"><input style={IS} value={form.licenseNumber} onChange={e => set('licenseNumber',e.target.value)} maxLength={64} placeholder="PWZ-12345"/></Field>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
        <Btn variant="ghost" onClick={onClose}>Anuluj</Btn>
        <Btn onClick={submit} disabled={saving}><Icon.check/> {saving?'Zapisywanie…':'Dodaj pracownika'}</Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [role, setRole]         = useState('');
  const [activeTab, setActiveTab] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('vito_token');
    const { role } = jwtDecode(token);
    setRole(role);
    setActiveTab(role==='PATIENT'?'appointments':'patients');
  }, []);

  const logout = () => { sessionStorage.removeItem('vito_token'); navigate('/login'); };
  const isPrivileged = ['DOCTOR','NURSE','ADMIN'].includes(role);
  const isAdmin      = role==='ADMIN';

  const tabs = [
    ...(isPrivileged ? [{ id:'patients',     label:'Pacjenci',  icon:Icon.patients }] : []),
    {                   id:'appointments',   label:'Wizyty',    icon:Icon.calendar },
    ...(isAdmin       ? [{ id:'staff',       label:'Personel',  icon:Icon.staff    }] : []),
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.g100, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <nav style={{ background:T.navy, padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center', height:56, boxShadow:'0 2px 10px rgba(0,0,0,0.18)', position:'sticky', top:0, zIndex:50 }}>
        <span style={{ color:'white', fontWeight:800, fontSize:17 }}>🏥 Vito Clinic</span>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ background:'#334d6e', color:'#93c5fd', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:'0.08em' }}>{role}</span>
          <button onClick={logout} style={{ padding:'6px 14px', background:T.red, color:'white', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>Wyloguj</button>
        </div>
      </nav>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 16px' }}>
        {activeTab && <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab}/>}
        {activeTab==='patients'     && isPrivileged && <PatientsTab role={role}/>}
        {activeTab==='appointments' &&                <AppointmentsTab role={role}/>}
        {activeTab==='staff'        && isAdmin       && <StaffTab/>}
      </div>
    </div>
  );
}
