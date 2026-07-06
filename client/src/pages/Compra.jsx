import { useEffect, useState } from 'react';
import { api } from '../api';

const SHOP_CATS = [
  ['Fruta y verdura', 'F', 'var(--sage)'],
  ['Carne y pescado', 'C', 'var(--clay)'],
  ['Despensa', 'D', 'var(--mustard)'],
  ['Lácteos', 'L', 'var(--blue)'],
  ['Limpieza', 'Li', 'var(--plum)'],
  ['Higiene', 'H', 'var(--amber)'],
  ['Mascota', 'M', 'var(--shared)'],
  ['Otros', 'O', 'var(--sage-d)'],
];

export default function Compra() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [cat, setCat] = useState(SHOP_CATS[0][0]);

  const load = () => api.get('/shopping').then(setItems);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    await api.post('/shopping', { text: text.trim(), category: cat, done: false });
    setText('');
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
          <select className="inp" style={{ maxWidth: 160 }} value={cat} onChange={e => setCat(e.target.value)}>
            {SHOP_CATS.map(([c]) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={add}>Añadir</button>
        </div>
        {items.some(i => i.done) && <button className="btn-ghost" onClick={clearDone}>Quitar comprados</button>}
      </div>

      {items.length ? (
        <div className="shop-grid">
          {SHOP_CATS.map(([cat, letter, color]) => {
            const catItems = items.filter(i => i.category === cat);
            if (!catItems.length) return null;
            const pending = catItems.filter(i => !i.done).length;
            return (
              <div className="shop-card" key={cat}>
                <div className="shop-card-head">
                  <div className="badge" style={{ background: color }}>{letter}</div>
                  <div className="name">{cat}</div>
                  <div className="count">{pending}</div>
                </div>
                {catItems.map(it => (
                  <div className={`shop-item ${it.done ? 'done' : ''}`} key={it._id}>
                    <input type="checkbox" className="chk" checked={it.done} onChange={() => toggle(it)} />
                    <span className="txt">{it.text}</span>
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
