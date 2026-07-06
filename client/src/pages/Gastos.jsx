import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, getPerson, peopleOptions, MESES } from '../utils.js';
import { EXP_ICONS } from '../components/icons.jsx';

const CATS = ['Comida', 'Casa', 'Ocio', 'Transporte', 'Otros'];
const EXP_COLOR = {
  Comida: 'var(--sage)', Casa: 'var(--mustard)', Ocio: 'var(--plum)',
  Transporte: 'var(--blue)', Otros: 'var(--shared)',
};

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-');
  const name = MESES[Number(m) - 1];
  return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + y;
}

export default function Gastos() {
  const { household, refreshHousehold } = useAuth();
  const members = household?.members || [];
  const [expenses, setExpenses] = useState([]);
  const emptyForm = { desc: '', amount: '', category: 'Comida', person: 'shared', date: fmtDate(new Date()) };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [recurring, setRecurring] = useState([]);
  const emptyRecurForm = { desc: '', amount: '', category: 'Comida', person: 'shared', dayOfMonth: '1' };
  const [recurForm, setRecurForm] = useState(emptyRecurForm);

  const load = () => api.get('/expenses').then(setExpenses);
  const loadRecurring = () => api.get('/expenses/recurring').then(setRecurring);
  useEffect(() => { load(); loadRecurring(); }, []);

  const budgets = household?.budgets || {};

  const submit = async () => {
    if (!form.desc.trim() || !form.amount) return;
    const payload = { ...form, desc: form.desc.trim(), amount: Number(form.amount) };
    if (editingId) {
      await api.patch(`/expenses/${editingId}`, payload);
      setEditingId(null);
      setForm(emptyForm);
    } else {
      await api.post('/expenses', payload);
      setForm(f => ({ ...f, desc: '', amount: '' }));
    }
    load();
  };
  const startEdit = (e) => {
    setEditingId(e._id);
    setForm({ desc: e.desc, amount: String(e.amount), category: e.category, person: e.person, date: e.date });
  };
  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };
  const del = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este gasto?')) return;
    if (editingId === id) cancelEdit();
    await api.del(`/expenses/${id}`);
    load();
  };
  const setBudget = async (cat, val) => {
    const newBudgets = { ...budgets, [cat]: Number(val) || 0 };
    await api.put('/household/budgets', { budgets: newBudgets });
    refreshHousehold();
  };

  const addRecurring = async () => {
    if (!recurForm.desc.trim() || !recurForm.amount) return;
    await api.post('/expenses/recurring', { ...recurForm, desc: recurForm.desc.trim(), amount: Number(recurForm.amount), dayOfMonth: Number(recurForm.dayOfMonth) || 1 });
    setRecurForm(emptyRecurForm);
    loadRecurring();
    load();
  };
  const delRecurring = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este gasto recurrente? Los gastos ya generados no se borrarán.')) return;
    await api.del(`/expenses/recurring/${id}`);
    loadRecurring();
  };

  const todayStr = fmtDate(new Date());
  const monthStr = todayStr.slice(0, 7);
  const monthExpenses = expenses.filter(e => e.date.slice(0, 7) === monthStr);
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCat = {};
  monthExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount); });
  const maxCat = Math.max(1, ...Object.values(byCat));
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const opts = peopleOptions(members);

  const monthGroups = [];
  sorted.forEach(e => {
    const key = e.date.slice(0, 7);
    let group = monthGroups.find(g => g.key === key);
    if (!group) { group = { key, items: [] }; monthGroups.push(group); }
    group.items.push(e);
  });

  return (
    <>
      <div className="section-title">Gastos</div>
      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-h">{editingId ? 'Editar gasto' : 'Añadir gasto'}</h3>
          <div className="addbar">
            <input className="inp" placeholder="Concepto" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
            <input className="inp" type="number" step="0.01" placeholder="€" style={{ maxWidth: 90 }} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="addbar">
            <select className="inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="inp" value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}>
              {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input className="inp" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="row" style={{ gap: 9 }}>
            <button className="btn" style={{ flex: 1 }} onClick={submit}>{editingId ? 'Guardar cambios' : 'Añadir gasto'}</button>
            {editingId && <button className="btn-ghost" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </div>
        <div className="card">
          <h3 className="card-h">Este mes: <span className="mono" style={{ color: 'var(--mustard-d)' }}>{total.toFixed(2)} €</span></h3>
          {CATS.map(cat => {
            const val = byCat[cat] || 0;
            const budget = budgets[cat] || 0;
            if (!val && !budget) return null;
            const pct = budget > 0 ? Math.min(100, (val / budget * 100)) : (val / maxCat * 100);
            const over = budget > 0 && val > budget;
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div className="row between" style={{ fontSize: 12.5 }}>
                  <span>{cat}</span>
                  <span className="mono" style={over ? { color: 'var(--clay-d)', fontWeight: 700 } : undefined}>
                    {val.toFixed(2)} € {budget > 0 ? '/ ' + budget.toFixed(0) + ' €' : ''}
                  </span>
                </div>
                <div style={{ background: 'var(--line)', borderRadius: 6, height: 8, overflow: 'hidden', margin: '4px 0 6px' }}>
                  <div style={{ width: pct.toFixed(0) + '%', background: over ? 'var(--clay-d)' : 'var(--mustard-d)', height: '100%' }}></div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <label className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>Límite mensual</label>
                  <input className="inp" type="number" style={{ maxWidth: 80, padding: '5px 8px', fontSize: 12 }}
                    defaultValue={budget || ''} placeholder="—" onBlur={e => setBudget(cat, e.target.value)} />
                </div>
              </div>
            );
          })}
          {!Object.keys(byCat).length && !Object.values(budgets).some(Boolean) && <div className="empty">Sin gastos este mes</div>}
        </div>
      </div>

      <div className="card">
        <h3 className="card-h">Gastos recurrentes</h3>
        <div className="muted" style={{ margin: '-6px 0 12px', fontSize: 12.5 }}>Se añaden solos cada mes (alquiler, suscripciones...).</div>
        {recurring.length ? recurring.map(r => {
          const icon = EXP_ICONS[r.category] || EXP_ICONS.Otros;
          const color = EXP_COLOR[r.category] || 'var(--shared)';
          const p = getPerson(members, r.person);
          return (
            <div key={r._id} className="chip-row" style={{ borderLeftColor: color }}>
              <div className="chip-icon" style={{ background: color, color: 'var(--ink)' }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div className="chip-title">{r.desc}</div>
                <div className="chip-sub">Cada mes el día {r.dayOfMonth} · {r.category} · {p.name}</div>
              </div>
              <span className="mono" style={{ fontWeight: 700 }}>{Number(r.amount).toFixed(2)} €</span>
              <button className="del" onClick={() => delRecurring(r._id)}>✕</button>
            </div>
          );
        }) : <div className="empty" style={{ marginBottom: 14 }}>No tienes gastos recurrentes.</div>}
        <div className="addbar" style={{ marginTop: recurring.length ? 14 : 0 }}>
          <input className="inp" placeholder="Concepto (ej. Alquiler)" value={recurForm.desc} onChange={e => setRecurForm(f => ({ ...f, desc: e.target.value }))} />
          <input className="inp" type="number" step="0.01" placeholder="€" style={{ maxWidth: 90 }} value={recurForm.amount} onChange={e => setRecurForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
        <div className="addbar">
          <select className="inp" value={recurForm.category} onChange={e => setRecurForm(f => ({ ...f, category: e.target.value }))}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="inp" value={recurForm.person} onChange={e => setRecurForm(f => ({ ...f, person: e.target.value }))}>
            {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select className="inp" style={{ maxWidth: 150 }} value={recurForm.dayOfMonth} onChange={e => setRecurForm(f => ({ ...f, dayOfMonth: e.target.value }))}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Día {d}</option>)}
          </select>
        </div>
        <button className="btn" onClick={addRecurring}>Añadir gasto recurrente</button>
      </div>

      <div className="card">
        <h3 className="card-h">Historial</h3>
        {monthGroups.length ? monthGroups.map(group => {
          const monthTotal = group.items.reduce((s, e) => s + Number(e.amount), 0);
          return (
            <div key={group.key} style={{ marginBottom: 18 }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="eyebrow" style={{ marginBottom: 0 }}>{monthLabel(group.key)}</div>
                <span className="mono muted">{monthTotal.toFixed(2)} €</span>
              </div>
              {group.items.map(e => {
                const icon = EXP_ICONS[e.category] || EXP_ICONS.Otros;
                const color = EXP_COLOR[e.category] || 'var(--shared)';
                const p = getPerson(members, e.person);
                return (
                  <div key={e._id} className="chip-row" style={{ borderLeftColor: color, cursor: 'pointer' }} onClick={() => startEdit(e)}>
                    <div className="chip-icon" style={{ background: color, color: 'var(--ink)' }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="chip-title">{e.desc}</div>
                      <div className="chip-sub">{e.recurringSource ? '↻ ' : ''}{e.date.slice(8, 10)}/{e.date.slice(5, 7)} · {e.category} · {p.name}</div>
                    </div>
                    <span className="mono" style={{ fontWeight: 700 }}>{Number(e.amount).toFixed(2)} €</span>
                    <button className="del" onClick={(ev) => { ev.stopPropagation(); del(e._id); }}>✕</button>
                  </div>
                );
              })}
            </div>
          );
        }) : <div className="empty">Todavía no hay gastos registrados.</div>}
      </div>
    </>
  );
}
