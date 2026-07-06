import { useEffect, useState } from 'react';
import { api } from '../api';

const NOTE_COLORS = ['#F6DFA6', '#BFE0D0', '#F4C9BC', '#B7D0EC', '#DCC6EA'];

export default function Notas() {
  const [notes, setNotes] = useState([]);

  const load = () => api.get('/notes').then(setNotes);
  useEffect(() => { load(); }, []);

  const addNote = async () => {
    const color = NOTE_COLORS[notes.length % NOTE_COLORS.length];
    await api.post('/notes', { text: '', color });
    load();
  };
  const updateNote = async (id, text) => { await api.patch(`/notes/${id}`, { text }); };
  const delNote = async (id) => { await api.del(`/notes/${id}`); load(); };

  const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <div className="section-title row between">
        <span>Notas rápidas</span>
        <button className="btn" onClick={addNote}>+ Nueva nota</button>
      </div>
      <div className="notes-grid">
        {sorted.length ? sorted.map(n => (
          <div className="note" style={{ background: n.color }} key={n._id}>
            <button className="del" onClick={() => delNote(n._id)}>✕</button>
            <textarea placeholder="Escribe algo..." defaultValue={n.text} onBlur={e => updateNote(n._id, e.target.value)} />
          </div>
        )) : <div className="empty">No hay notas todavía.</div>}
      </div>
    </>
  );
}
