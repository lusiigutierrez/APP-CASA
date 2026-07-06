import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, getPerson, peopleOptions } from '../utils.js';

const CATS = ['Comida', 'Casa', 'Ocio', 'Transporte', 'Otros'];
const EXP_ICON = {
  Comida: ['C', 'var(--sage)'], Casa: ['H', 'var(--mustard)'], Ocio: ['O', 'var(--plum)'],
  Transporte: ['T', 'var(--blue)'], Otros: ['·', 'var(--shared)'],
};

export default function Gastos() {
  const { household, refreshHousehold } = useAuth();
  const members = household?.members || [];
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ desc: '', amount: '', category: 'Comida', person: 'shared', date: fmtDate(new Date()) });

  const load = () => api.get('/expenses').then(setExpenses);
  useEffect(() => { load(); }, []);

  const budgets = household?.budgets || {};

  const add = async () => {
    if (!form.desc.trim() || !form.amount) return;
    await api.post('/expenses', { ...form, desc: form.desc.trim(), amount: Number(form.amount) });
    setForm(f => ({ ...f, desc: '', amount: '' }));
    load();
  };
  const del = async (id) => { await api.del(`/expenses/${id}`); load(); };
  const setBudget = async (cat, val) => {
    const newBudgets = { ...budgets, [cat]: Number(val) || 0 };
    await api.put('/household/budgets', { budgets: newBudgets });
    refreshHousehold();
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

  return (
    <>
      <div className="section-title">Gastos</div>
      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-h">Añadir gasto</h3>
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
          <button className="btn" onClick={add}>Añadir gasto</button>
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
        <h3 className="card-h">Historial</h3>
        {sorted.length ? sorted.map(e => {
          const icon = EXP_ICON[e.category] || ['·', 'var(--shared)'];
          const p = getPerson(members, e.person);
          return (
            <div key={e._id} className="chip-row" style={{ borderLeftColor: icon[1] }}>
              <div className="chip-icon" style={{ background: icon[1], fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{icon[0]}</div>
              <div style={{ flex: 1 }}>
                <div className="chip-title">{e.desc}</div>
                <div className="chip-sub">{e.date.slice(8, 10)}/{e.date.slice(5, 7)} · {e.category} · {p.name}</div>
              </div>
              <span className="mono" style={{ fontWeight: 700 }}>{Number(e.amount).toFixed(2)} €</span>
              <button className="del" onClick={() => del(e._id)}>✕</button>
            </div>
          );
        }) : <div className="empty">Todavía no hay gastos registrados.</div>}
      </div>
    </>
  );
}
