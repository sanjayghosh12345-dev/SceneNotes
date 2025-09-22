// components/NotesDrawer.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import NotesList from './NotesList';
import type { FeedbackEntry } from '@/lib/types';

type Props = {
  loading: boolean;
  error: string | null;
  feedbacks: FeedbackEntry[];
  activeFeedbackId: string | null;
  onActivateFeedback: (id: string) => void;
  notes: string | null;
  rewrite: string | null;
  spentUsd: number;
  lastUsd: number;
  showNotesPins: boolean;
  setShowNotesPins: (v: boolean) => void;
};

export default function NotesDrawer({
  loading, error, feedbacks, activeFeedbackId, onActivateFeedback,
  notes, rewrite, spentUsd, lastUsd, showNotesPins, setShowNotesPins
}: Props) {
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState(380);
  const draggingRef = useRef(false);
  const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setWidth(w => clamp(window.innerWidth - e.clientX, 280, 640));
    };
    const onUp = () => { draggingRef.current = false; document.body.style.userSelect=''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      className="notesDrawer"
      style={{
        width,
        transform: open ? 'translateX(0)' : `translateX(${width - 44}px)`,
      }}
    >
      <div
        className="notesDrag"
        onMouseDown={() => { draggingRef.current = true; document.body.style.userSelect = 'none'; }}
        title="Drag to resize"
      />
      <button
        className="notesTab"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        title={open ? 'Hide notes' : 'Show notes'}
      >
        {open ? '›' : 'Notes ‹'}
      </button>

      <div className="notesContent">
        {loading && <div className="card">Thinking…</div>}
        {error && <div className="card"><h3>Error</h3><div className="badge warn">{error}</div></div>}

        <div className="card" style={{marginBottom:12}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>Feedback</h3>
            <label style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
              <input type="checkbox" checked={showNotesPins} onChange={(e)=>setShowNotesPins(e.target.checked)} />
              Show inline notes
            </label>
          </div>

          <div style={{marginTop:8}}>
            {feedbacks.length === 0 && <div style={{fontSize:12, color:'#666'}}>No feedback yet</div>}
            {feedbacks.map(f => (
              <div
                key={f.id}
                className={`item ${activeFeedbackId===f.id?'active':''}`}
                style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'}}
                onClick={()=> onActivateFeedback(f.id)}
              >
                <span>{f.title}</span>
                <span style={{fontSize:11, color:'#777'}}>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {notes && (
            <div className="card" style={{marginTop:12}}>
              <h4 style={{margin:'4px 0'}}>Selected Notes</h4>
              <NotesList text={notes} />
            </div>
          )}
        </div>

        {rewrite && <div className="card"><h3>Rewrite</h3><pre className="out">{rewrite}</pre></div>}

        {lastUsd>0 && (
          <div className="card" style={{marginTop:12}}>
            <h3>Cost</h3>
            <div style={{fontSize:13}}>Last: <b>${lastUsd.toFixed(6)}</b> · Spent: <b>${spentUsd.toFixed(4)}</b></div>
          </div>
        )}
      </div>

      <style>{`
        .notesDrawer{
          position: fixed;
          top: 64px;
          right: 0;
          bottom: 0;
          background: #0f1220;
          border-left: 1px solid rgba(255,255,255,0.08);
          box-shadow: -12px 0 24px rgba(0,0,0,0.25);
          display: flex;
          transition: transform 220ms ease;
          z-index: 30;
        }
        .notesContent{ flex: 1 1 auto; overflow: auto; padding: 12px; }
        .notesDrag{ width: 6px; cursor: col-resize; background: linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0)); }
        .notesDrag:hover{ background: rgba(255,255,255,0.1); }
        .notesTab{
          position: absolute; top: 10px; left: -88px; width: 88px; height: 36px;
          border-top-left-radius: 6px; border-bottom-left-radius: 6px;
          border: 1px solid rgba(255,255,255,0.12); border-right: none;
          background: #14172a; color: #fff; font-size: 12px; cursor: pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow: -6px 0 12px rgba(0,0,0,0.25);
        }
        .notesTab:hover{ background:#1a1f38; }
      `}</style>
    </div>
  );
}
