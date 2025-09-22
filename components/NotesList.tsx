// components/NotesList.tsx
'use client';
export default function NotesList({ text }: { text: string }){
  const items = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^[-*]\s*/, ''));
  if(items.length === 0){ return <pre className="out">{text}</pre>; }
  return (
    <ul style={{ paddingLeft: 16, margin: 0 }}>
      {items.map((it, i) => (<li key={i} style={{ marginBottom: 6 }}>{it}</li>))}
    </ul>
  );
}
