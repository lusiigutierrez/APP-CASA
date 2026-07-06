import { useEffect, useState } from 'react';
import { api } from '../api';
import { DAY_KEYS } from '../utils.js';

const UNITS = ['uds', 'kg', 'g', 'l', 'ml', 'paquetes'];

export default function MenuSemanal() {
  const [menu, setMenu] = useState({});
  const [inventory, setInventory] = useState([]);
  const [invForm, setInvForm] = useState({ name: '', qty: '', unit: 'uds' });
  const [useForm, setUseForm] = useState({ day: 'lun', meal: 'comida', itemId: '', qty: 1 });
  const [customOpen, setCustomOpen] = useState({}); // { 'lun-comida': true }

  const loadMenu = () => api.get('/menu').then(setMenu);
  const loadInventory = () => api.get('/inventory').then(setInventory);
  useEffect(() => { loadMenu(); loadInventory(); }, []);

  useEffect(() => {
    if (inventory.length && !useForm.itemId) {
      setUseForm(f => ({ ...f, itemId: inventory[0]._id }));
    }
  }, [inventory]); // eslint-disable-line

  const setMealValue = async (day, meal, val) => {
    const newMenu = { ...menu, [day]: { ...(menu[day] || {}), [meal]: val } };
    setMenu(newMenu);
    await api.put('/menu', { data: newMenu });
  };

  const handleSelect = (day, meal, val) => {
    const key = `${day}-${meal}`;
    if (val === '__other__') {
      setCustomOpen(o => ({ ...o, [key]: true }));
    } else {
      setCustomOpen(o => ({ ...o, [key]: false }));
      setMealValue(day, meal, val);
    }
  };

  const addInventoryItem = async () => {
    if (!invForm.name.trim()) return;
    await api.post('/inventory', { name: invForm.name.trim(), qty: Number(invForm.qty) || 0, unit: invForm.unit });
    setInvForm({ name: '', qty: '', unit: 'uds' });
    loadInventory();
  };
  const adjustInventory = async (it, delta) => {
    const qty = Math.max(0, Math.round((it.qty + delta) * 10) / 10);
    await api.patch(`/inventory/${it._id}`, { qty });
    loadInventory();
  };
  const delInventoryItem = async (id) => { await api.del(`/inventory/${id}`); loadInventory(); };

  const useInInventory = async () => {
    const item = inventory.find(i => i._id === useForm.itemId);
    const qty = Number(useForm.qty) || 0;
    if (!item || qty <= 0) return;
    const newQty = Math.max(0, Math.round((item.qty - qty) * 10) / 10);
    await api.patch(`/inventory/${item._id}`, { qty: newQty });
    const existing = (menu[useForm.day] && menu[useForm.day][useForm.meal]) || '';
    const newText = existing ? existing + ', ' + item.name : item.name;
    await setMealValue(useForm.day, useForm.meal, newText);
    loadInventory();
  };

  function MealCell({ k, l, meal }) {
    const val = (menu[k] && menu[k][meal]) || '';
    const isInvMatch = inventory.some(it => it.name === val);
    const isCustom = customOpen[`${k}-${meal}`] || (!!val && !isInvMatch);
    return (
      <div className="menu-cell" data-day-label={l}>
        <select className="inp menu-select" value={isCustom ? '__other__' : val} onChange={e => handleSelect(k, meal, e.target.value)}>
          <option value="">—</option>
          {inventory.map(it => <option key={it._id} value={it.name}>{it.name} ({it.qty} {it.unit})</option>)}
          <option value="__other__">Otro…</option>
        </select>
        {isCustom && (
          <input className="inp menu-custom" type="text" style={{ marginTop: 5 }}
            placeholder={`Escribe qué vais a ${meal === 'comida' ? 'comer' : 'cenar'}`}
            defaultValue={isInvMatch ? '' : val}
            onBlur={e => setMealValue(k, meal, e.target.value)} />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="section-title">Menú semanal</div>
      <div className="muted" style={{ margin: '-14px 0 16px' }}>Elige un producto del inventario o selecciona "Otro…" para escribir algo distinto.</div>
      <div className="card">
        <div className="menu-grid">
          <div className="h"></div>
          {DAY_KEYS.map(([k, l]) => <div className="h" key={k}>{l}</div>)}
          <div className="lbl">Comida</div>
          {DAY_KEYS.map(([k, l]) => <MealCell k={k} l={l} meal="comida" key={k + 'c'} />)}
          <div className="lbl">Cena</div>
          {DAY_KEYS.map(([k, l]) => <MealCell k={k} l={l} meal="cena" key={k + 'd'} />)}
        </div>
      </div>

      <div className="section-title" style={{ fontSize: 22, marginTop: 8 }}>Inventario de comida</div>
      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-h">Lo que tenéis en casa</h3>
          {inventory.length ? inventory.map(it => (
            <div className={`inv-row ${it.qty <= 0 ? 'empty-stock' : ''}`} key={it._id}>
              <span className="txt">{it.name}</span>
              <div className="row" style={{ gap: 6 }}>
                <button className="inv-btn" onClick={() => adjustInventory(it, -1)}>−</button>
                <span className="mono" style={{ minWidth: 56, textAlign: 'center', fontWeight: 700, color: it.qty <= 1 ? 'var(--clay-d)' : undefined }}>{it.qty} {it.unit}</span>
                <button className="inv-btn" onClick={() => adjustInventory(it, 1)}>+</button>
                <button className="del" onClick={() => delInventoryItem(it._id)}>✕</button>
              </div>
            </div>
          )) : <div className="empty">Todavía no has añadido nada al inventario.</div>}
          <div className="addbar" style={{ marginTop: 14 }}>
            <input className="inp" placeholder="Producto (ej. Arroz)" value={invForm.name}
              onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') addInventoryItem(); }} />
            <input className="inp" type="number" step="0.1" placeholder="Cantidad" style={{ maxWidth: 100 }}
              value={invForm.qty} onChange={e => setInvForm(f => ({ ...f, qty: e.target.value }))} />
            <select className="inp" style={{ maxWidth: 110 }} value={invForm.unit} onChange={e => setInvForm(f => ({ ...f, unit: e.target.value }))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button className="btn" style={{ marginTop: 9 }} onClick={addInventoryItem}>Añadir al inventario</button>
        </div>
        <div className="card">
          <h3 className="card-h">Usar en el menú</h3>
          <div className="muted" style={{ marginBottom: 12 }}>Elige un producto del inventario para un día y comida: se descontará del stock y se añadirá a esa casilla del menú.</div>
          {inventory.length ? (
            <>
              <div className="addbar">
                <select className="inp" style={{ flex: 1 }} value={useForm.day} onChange={e => setUseForm(f => ({ ...f, day: e.target.value }))}>
                  {DAY_KEYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <select className="inp" style={{ maxWidth: 110 }} value={useForm.meal} onChange={e => setUseForm(f => ({ ...f, meal: e.target.value }))}>
                  <option value="comida">Comida</option><option value="cena">Cena</option>
                </select>
              </div>
              <div className="addbar">
                <select className="inp" style={{ flex: 1 }} value={useForm.itemId} onChange={e => setUseForm(f => ({ ...f, itemId: e.target.value }))}>
                  {inventory.map(it => <option key={it._id} value={it._id}>{it.name} ({it.qty} {it.unit})</option>)}
                </select>
                <input className="inp" type="number" step="0.1" style={{ maxWidth: 90 }} value={useForm.qty} onChange={e => setUseForm(f => ({ ...f, qty: e.target.value }))} />
              </div>
              <button className="btn" onClick={useInInventory}>Usar en el menú</button>
            </>
          ) : <div className="empty">Añade productos al inventario para poder usarlos aquí.</div>}
        </div>
      </div>
    </>
  );
}
