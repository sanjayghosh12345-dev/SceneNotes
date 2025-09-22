// components/ScreenplayEditor.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Paragraph from '@tiptap/extension-paragraph';

export type Suggestion = {
  id: string;
  find: string;
  replace: string;
  note: string;
  severity: 'mild' | 'moderate' | 'severe';
  nearLine?: number;
  startOffset?: number;
  endOffset?: number;
};

type EditorAPI = {
  insertScene: (kind?: 'INT.' | 'EXT.' | 'INT/EXT.') => void;
  insertCharacter: () => void;
  insertParen: () => void;
  insertDialogue: () => void;
  insertTransition: (kind?: 'CUT TO:' | 'FADE OUT:' | 'DISSOLVE TO:' | 'SMASH CUT:') => void;
  insertAction: () => void;
};

type Props = {
  value: string;
  html?: string;
  onChange: (v: { text: string; html: string }) => void;
  suggestions: Suggestion[];
  onAccept: (id: string) => void;
  onRequestSuggestions?: (fullText: string) => void;
  onReady?: (api: EditorAPI) => void;
  showNotes?: boolean;
};

/* ------------ Page geometry + role styles ------------ */
const CourierStyles = (
  <style>{`
  :root{
    --page-w: 8.5in; --page-h: 11in;
    --margin-l: 1.5in; --margin-r: 1.0in; --margin-t: 1.0in; --margin-b: 1.0in;
    --char-left: 2.5in;
    --dialogue-left: 2.5in; --dialogue-right: 5.5in;
    --paren-left: 3.0in; --paren-right: 5.5in;
    --trans-left: 6.0in;
  }
  .paper{
    width: var(--page-w); min-height: var(--page-h);
    padding: var(--margin-t) var(--margin-r) var(--margin-b) var(--margin-l);
    background:#fff; color:#111827; border-radius:6px; box-shadow:0 18px 40px rgba(0,0,0,.35);
    position:relative;
  }
  .tiptap{ outline:none; font-family:"Courier Prime","Courier New",monospace; font-size:12pt; line-height:1.5; }
  .tiptap p{ margin:0 0 0.125in; white-space:pre-wrap; }

  /* Roles via data-role (preferred) OR legacy class names */
  .tiptap p[data-role="scene"], .tiptap .scene { text-transform:uppercase; font-weight:700; letter-spacing:.02em; }
  .tiptap p[data-role="char"], .tiptap .char{
    text-transform:uppercase; font-weight:700; letter-spacing:.02em;
    margin-left: calc(var(--char-left) - var(--margin-l));
    width: calc(var(--dialogue-right) - var(--dialogue-left));
    text-align:center;
  }
  .tiptap p[data-role="dialogue"], .tiptap .dialogue{
    margin-left: calc(var(--dialogue-left) - var(--margin-l));
    width: calc(var(--dialogue-right) - var(--dialogue-left));
  }
  .tiptap p[data-role="paren"], .tiptap .paren{
    margin-left: calc(var(--paren-left) - var(--margin-l));
    width: calc(var(--paren-right) - var(--paren-left));
  }
  .tiptap p[data-role="trans"], .tiptap .trans{
    text-transform:uppercase; text-align:right; font-weight:700;
    margin-left: calc(var(--trans-left) - var(--margin-l));
    width: calc(var(--page-w) - var(--trans-left) - var(--margin-r));
  }
  .tiptap p[data-role="action"], .tiptap .action{ }

  .sugg-pop{ position:absolute; z-index:50; background:#0f172a; color:#e5e7eb; border:1px solid #1f2937; border-radius:8px; padding:8px; width:280px; }
  .sugg-actions{ margin-top:8px; display:flex; gap:8px; }
  .btn-sm{ height:28px; padding:0 10px; border-radius:6px; border:1px solid #1f2937; background:#0b1326; color:#e5e7eb; cursor:pointer; }
  .btn-sm.primary{ background:#1d4ed8; border-color:#1d4ed8; color:#fff; }

  .note-pin{ width:24px; height:24px; border-radius:12px; background:#0b1326; color:#e5e7eb;
    display:flex; align-items:center; justify-content:center; border:1px solid #1f2937; cursor:pointer; z-index: 5; }

  @page{ size:8.5in 11in; margin: 1in 1in 1in 1.5in; }
  @media print{ .paper{ box-shadow:none; border-radius:0; } }
`}</style>
);

/* ------------ Paragraph extension with data-role ------------ */
const FountainParagraph = Paragraph.extend({
  name: 'paragraph',
  addAttributes() {
    return {
      role: {
        default: null as null | 'scene' | 'char' | 'dialogue' | 'paren' | 'trans' | 'action',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-role'),
        renderHTML: attrs => (attrs.role ? { 'data-role': attrs.role } : {}),
      },
    };
  },
});

export default function ScreenplayEditor({
  value, html, onChange, suggestions, onAccept, onRequestSuggestions, onReady, showNotes
}: Props) {
  const paperRef = useRef<HTMLDivElement | null>(null);
  const editor = useEditor({
    extensions: [
      // replace StarterKit's paragraph with our role-aware paragraph
      StarterKit.configure({ codeBlock: false, paragraph: false }),
      FountainParagraph,
      Placeholder.configure({ placeholder: 'Type your scene… Fountain style.' }),
      Highlight,
    ],
    content: html ?? valueToHtml(value),
    onUpdate({ editor }) {
      onChange({ text: editor.getText(), html: editor.getHTML() });
      autoFormat(editor);                 // will not overwrite explicit roles
      debouncedAsk.current?.(editor.getText());
    },
    ...( { immediatelyRender: false } as any ), // SSR guard
  });

  // Sync editor content when value/html prop changes (e.g., from Supabase restore)
  useEffect(() => {
    if (!editor) return;
    if (html != null && html !== '') {
      const currentHtml = editor.getHTML();
      if (currentHtml === html) return;
      console.log('🔄 Syncing editor HTML:', { current: currentHtml.length, new: html.length });
      editor.commands.setContent(html);
      return;
    }
    const current = editor.getText();
    if (current === value) return;
    console.log('🔄 Syncing editor content from text:', { current: current.length, new: value.length });
    editor.commands.setContent(valueToHtml(value));
  }, [editor, value, html]);

  /* ------------ Debounce suggestions ------------ */
  const debouncedAsk = useRef<((t: string) => void) | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    debouncedAsk.current = (txt: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => onRequestSuggestions?.(txt), 900);
    };
    return () => { if (timer) clearTimeout(timer); debouncedAsk.current = null; };
  }, [onRequestSuggestions]);

  /* ------------ Helpers to format current paragraph ------------ */
  function paraRange() {
    if (!editor) return null;
    const $from = (editor.state.selection as any).$from;
    return { start: $from.start($from.depth), end: $from.end($from.depth) };
  }
  function setRole(role: 'scene'|'char'|'dialogue'|'paren'|'trans'|'action') {
    editor?.chain().focus().updateAttributes('paragraph', { role }).run();
  }
  function replacePara(mutator: (t: string) => string) {
    if (!editor) return;
    const r = paraRange(); if (!r) return;
    const { start, end } = r;
    const original = editor.state.doc.textBetween(start, end);
    const next = mutator(original);
    editor.chain().focus().setTextSelection({ from: start, to: end }).insertContent(next).run();
    editor.commands.setTextSelection({ from: start, to: start + next.length });
  }
  function lineHasText() {
    if (!editor) return false;
    const r = paraRange(); if (!r) return false;
    return editor.state.doc.textBetween(r.start, r.end).trim().length > 0;
  }

  /* ------------ Expose toolbar API ------------ */
  useEffect(() => {
    if (!editor || !onReady) return;

    const api: EditorAPI = {
      insertScene: (kind = 'INT.') => {
        if (lineHasText()) {
          setRole('scene');
          replacePara(t => t.toUpperCase());
          return;
        }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent(`${kind} LOCATION - NIGHT\n\n`).run();
        editor.commands.setTextSelection({ from: pos + kind.length + 1, to: pos + kind.length + 1 + 'LOCATION'.length });
        setRole('scene');
      },
      insertCharacter: () => {
        if (lineHasText()) {
          setRole('char');
          replacePara(t => t.toUpperCase());
          return;
        }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent('CHARACTER NAME\n').run();
        editor.commands.setTextSelection({ from: pos, to: pos + 'CHARACTER NAME'.length });
        setRole('char');
      },
      insertParen: () => {
        if (lineHasText()) {
          setRole('paren');
          replacePara(t => {
           const raw = t.trim().replace(/^\(([\s\S]*)\)$/, '$1');
            return `(${raw})`;
          });
          return;
        }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent('(beats)\n').run();
        editor.commands.setTextSelection({ from: pos + 1, to: pos + 6 });
        setRole('paren');
      },
      insertDialogue: () => {
        if (lineHasText()) { setRole('dialogue'); return; }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent('Dialogue line...\n').run();
        editor.commands.setTextSelection({ from: pos, to: pos + 'Dialogue line...'.length });
        setRole('dialogue');
      },
      insertTransition: (kind = 'CUT TO:') => {
        if (lineHasText()) {
          setRole('trans');
          replacePara(t => {
            const u = t.toUpperCase().replace(/\s+$/, '');
            return u.endsWith(':') ? u : `${u}:`;
          });
          return;
        }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent(`${kind}\n`).run();
        editor.commands.setTextSelection({ from: pos, to: pos + kind.length });
        setRole('trans');
      },
      insertAction: () => {
        if (lineHasText()) { setRole('action'); return; }
        const pos = editor.state.selection.from;
        editor.chain().focus().insertContent('Action line...\n').run();
        editor.commands.setTextSelection({ from: pos, to: pos + 'Action line...'.length });
        setRole('action');
      },
    };

    onReady(api);
  }, [editor, onReady]);

  /* ------------ Suggestion highlighting ------------ */
  useEffect(() => {
    if (!editor) return;
    editor.commands.unsetHighlight();
    const full = editor.getText();
    suggestions.forEach(s => {
      const idx = locate(full, s);
      if (idx < 0) return;
      editor.commands.setTextSelection({ from: idx + 1, to: idx + s.find.length + 1 });
      editor.commands.setHighlight({ color: '#fff5b1' });
    });
    editor.commands.blur();
  }, [editor, suggestions]);

  /* ------------ Inline note bubbles (anchors) ------------ */
  const [anchors, setAnchors] = useState<{ id: string; top: number }[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Map a plain-text offset (in editor.getText()) to a ProseMirror document position
  function plainOffsetToDocPos(off: number): number | null {
    if (!editor) return null;
    const doc: any = editor.state.doc;
    const size = doc.content.size;
    const tlen = (p: number) => doc.textBetween(0, Math.max(0, Math.min(size, p)), '\n', '\n').length;
    let lo = 1, hi = size, ans = 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const len = tlen(mid);
      if (len < off) { lo = mid + 1; }
      else { ans = mid; hi = mid - 1; }
    }
    return ans;
  }
  useEffect(() => {
    if (!editor || !paperRef.current) return;
    const refresh = () => {
      const full = editor.getText();
      const rect = paperRef.current!.getBoundingClientRect();
      const paras = paperRef.current!.querySelectorAll('.tiptap p');
      const next: { id: string; top: number }[] = [];
      suggestions.forEach(s => {
        // Prefer mapping by startOffset to paragraph index for reliable vertical placement
        if (Number.isFinite(s.startOffset)) {
          const off = Number(s.startOffset);
          const posOff = plainOffsetToDocPos(off);
          if (posOff != null) {
            try {
              const coords = (editor.view as any).coordsAtPos(posOff);
              const top = Math.max(0, coords.top - rect.top);
              next.push({ id: s.id, top });
              return;
            } catch {}
          }
        }
        // Fallback: compute by locating text position
        const idx = locate(full, s);
        if (idx < 0) return;
        const pos = plainOffsetToDocPos(idx) ?? 1;
        try {
          const coords = (editor.view as any).coordsAtPos(pos);
          const top = Math.max(0, coords.top - rect.top);
          next.push({ id: s.id, top });
        } catch {}
      });
      setAnchors(next);
    };
    refresh();
    const onScroll = () => refresh();
    const onResize = () => refresh();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onResize); };
  }, [editor, suggestions, value, html]);

  // Recompute anchors after the editor mounts content changes (layout shifts)
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      // trigger effect above by nudging dependency through state setter
      setAnchors(prev => [...prev]);
    }, 0);
    return () => clearTimeout(t);
  }, [editor?.state?.doc]);

  /* ------------ Popup ------------ */
  const [popup, setPopup] = useState<{ s: Suggestion; rect: DOMRect } | null>(null);
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { setPopup(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const pos = editor.state.selection.from - 1;
      const full = editor.getText();
      const hit = suggestions.find(s => {
        const i = locate(full, s);
        return i >= 0 && pos >= i && pos <= i + s.find.length;
      });
      setPopup(hit ? { s: hit, rect } : null);
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [editor, suggestions]);

  function acceptSuggestion(s: Suggestion) {
    if (!editor) return;
    const full = editor.getText();
    const idx = locate(full, s);
    if (idx < 0) return;
    editor.commands.setTextSelection({ from: idx + 1, to: idx + s.find.length + 1 });
    editor.commands.insertContent(s.replace);
    onAccept(s.id);
    setPopup(null);
  }

  return (
    <div style={{ position: 'relative' }}>
      {CourierStyles}
      <div className="paper" ref={paperRef}>
        {editor ? <EditorContent editor={editor} className="tiptap" /> : null}
        {showNotes && anchors.map(a => {
          const s = suggestions.find(x => x.id === a.id);
          if (!s) return null;
          return (
            <div
              key={a.id}
              className="note-pin"
              title={s.note}
              style={{ position:'absolute', right: -28, top: a.top - 8 }}
              onMouseEnter={() => setHoverId(s.id)}
              onMouseLeave={() => setHoverId(cur => cur === s.id ? null : cur)}
              onClick={() => {
                // Highlight the range in the editor and notify right panel
                const full = editor.getText();
                const idx = locate(full, s);
                if (idx >= 0) {
                  const from = plainOffsetToDocPos(idx) ?? 1;
                  const to = plainOffsetToDocPos(idx + s.find.length) ?? (from + s.find.length);
                  editor.commands.setTextSelection({ from, to });
                }
                setHoverId(s.id);
                try { window.dispatchEvent(new CustomEvent('sn:focus-suggestion', { detail: { id: s.id } } as any)); } catch {}
              }}
            >
              💬
            </div>
          );
        })}
        {showNotes && hoverId && (() => {
          const s = suggestions.find(x => x.id === hoverId);
          const a = anchors.find(x => x.id === hoverId);
          if (!s || !a) return null;
          return (
            <div
              className="sugg-pop"
              style={{ position:'absolute', right: 8, top: a.top + 12 }}
              onMouseEnter={() => setHoverId(s.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <div><b>{labelSeverity(s.severity)}</b> · {s.note || 'Suggestion'}</div>
              <div style={{fontSize:12, opacity:.9, marginTop:6}}>
                <div><b>Find:</b> {s.find}</div>
                {s.replace && s.replace !== s.find && (<div><b>Replace:</b> {s.replace}</div>)}
                {Number.isFinite(s.nearLine) && (<div><b>Line:</b> {s.nearLine}</div>)}
              </div>
              <div className="sugg-actions">
                <button className="btn-sm primary" onClick={() => acceptSuggestion(s)}>Accept</button>
                <button className="btn-sm" onClick={() => onAccept(s.id)}>Dismiss</button>
              </div>
            </div>
          );
        })()}
      </div>

      {popup && (
        <div
          className="sugg-pop"
          style={{ top: popup.rect.bottom + 8 + window.scrollY, left: popup.rect.left + window.scrollX }}
        >
          <div><b>{labelSeverity(popup.s.severity)}</b> · {popup.s.note}</div>
          <div className="sugg-actions">
            <button className="btn-sm primary" onClick={() => acceptSuggestion(popup.s)}>Accept</button>
            <button className="btn-sm" onClick={() => onAccept(popup.s.id)}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------ helpers ------------ */
function valueToHtml(fountain: string) {
  const lines = fountain.replace(/\r\n/g, '\n').split('\n');
  return lines.map(l => `<p class="${classForLine(l)}">${escapeHtml(l)}</p>`).join('');
}

// Don't override explicit roles (data-role) set by toolbar.
function autoFormat(editor: any) {
  editor.view.state.doc.descendants((node: any, pos: number) => {
    if (node.type.name !== 'paragraph') return;
    if (node.attrs?.role) return; // respect manual role
    const text = node.textContent || '';
    const cls = classForLine(text);
    const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
    if (dom) dom.className = cls || '';
  });
}

function classForLine(l: string) {
  const t = l.trim();
  if (/^(INT\.|EXT\.|EST\.|INT\/EXT\.)/i.test(t)) return 'scene';
  if (/^[A-Z0-9 ()'.-]{2,}$/.test(t) && !t.endsWith(':') && t.split(' ').length <= 6) return 'char';
  if (/^\(.*\)$/.test(t)) return 'paren';
  if (/^(CUT TO:|FADE (IN|OUT):|DISSOLVE TO:|SMASH CUT:)/i.test(t)) return 'trans';
  if (t.length > 0 && (t.startsWith('  ') || t.startsWith('\t'))) return 'dialogue';
  if (t.length > 0) return 'action';
  return '';
}

function labelSeverity(s: Suggestion['severity']) {
  return s === 'severe' ? 'Severe' : s === 'moderate' ? 'Moderate' : 'Mild';
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));
}

function locate(full: string, s: Suggestion): number {
  if (Number.isFinite(s.startOffset)) {
    const o = Number(s.startOffset);
    if (o >= 0 && o <= full.length) {
      // Validate offset points at the expected text; otherwise fallback
      const seg = full.slice(o, o + s.find.length);
      if (seg && s.find && seg === s.find) return o;
    }
  }
  if (s.nearLine != null) {
    const lines = full.split('\n');
    const start = Math.max(0, s.nearLine - 3);
    const end = Math.min(lines.length, s.nearLine + 3);
    const windowText = lines.slice(start, end).join('\n');
    const local = windowText.indexOf(s.find);
    if (local >= 0) {
      const prefixLen = lines.slice(0, start).join('\n').length + (start > 0 ? 1 : 0);
      return prefixLen + local;
    }
  }
  return full.indexOf(s.find);
}
