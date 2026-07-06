import { useEffect, useState } from 'react';
import { api } from '../api';
import { SHOP_ICONS } from '../components/icons.jsx';

const SHOP_CATS = [
  ['Fruta y verdura', 'var(--sage)'],
  ['Carne y pescado', 'var(--clay)'],
  ['Despensa', 'var(--mustard)'],
  ['Lácteos', 'var(--blue)'],
  ['Limpieza', 'var(--plum)'],
  ['Higiene', 'var(--amber)'],
  ['Mascota', 'var(--shared)'],
  ['Otros', 'var(--sage-d)'],
];

export default function Compra() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [qty, setQty] = useState('');
  const [cat, setCat] = useState(SHOP_CATS[0][0]);

  const load = () => api.get('/shopping').then(setItems);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    await api.post('/shopping', { text: text.trim(), qty: qty.trim(), category: cat, done: false });
    setText('');
    setQty('');
    load();
  };
  const toggle = async (it) => { await api.patch(`/shopping/${it._id}`, { done: !it.done }); load(); };
  const del = async (id) => { await api.del(`/shopping/${id}`); load(); };
  const clearDone = async () => {
    await Promise.all(items.filter(i => i.done).map(i => api.del(`/shopping/${i._id}`)));
    load();
  };

  return (
    <>
      <div className="section-title">La compra</div>
      <div className="card">
        <div className="addbar">
          <input className="inp" placeholder="Añadir producto..." value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }} />
          <input className="inp" placeholder="Cantidad (ej. x2, 1kg)" style={{ maxWidth: 140 }} value={qty}
            onChange={e => setQty(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }} />
          <select className="inp" style={{ maxWidth: 160 }} value={cat} onChange={e => setCat(e.target.value)}>
            {SHOP_CATS.map(([c]) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={add}>Añadir</button>
        </div>
        {items.some(i => i.done) && <button className="btn-ghost" onClick={clearDone}>Quitar comprados</button>}
      </div>

      {items.length ? (
        <div className="shop-grid">
          {SHOP_CATS.map(([cat, color]) => {
            const catItems = items.filter(i => i.category === cat);
            if (!catItems.length) return null;
            const pending = catItems.filter(i => !i.done).length;
            return (
              <div className="shop-card" key={cat}>
                <div className="shop-card-head">
                  <div className="badge" style={{ background: color }}>{SHOP_ICONS[cat] || SHOP_ICONS.Otros}</div>
                  <div className="name">{cat}</div>
                  <div className="count">{pending}</div>
                </div>
                {catItems.map(it => (
                  <div className={`shop-item ${it.done ? 'done' : ''}`} key={it._id}>
                    <input type="checkbox" className="chk" checked={it.done} onChange={() => toggle(it)} />
                    <span className="txt">{it.text}{it.qty ? <span className="muted" style={{ marginLeft: 6 }}>{it.qty}</span> : ''}</span>
                    <button className="del" onClick={() => del(it._id)}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : <div className="card"><div className="empty">La lista está vacía.</div></div>}
    </>
  );
}
