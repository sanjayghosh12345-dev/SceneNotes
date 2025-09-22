// components/Sidebar.tsx
'use client';
import AuthMini from '@/components/AuthMini';
import { supabase } from '@/lib/supabase';

type Props = {
  projectName: string;
  setProjectName: (v: string) => void;
  onSave: () => void;
  onExportPDF: () => void;
  onSignedIn: () => Promise<void> | void;
  debugMessage?: string | null;
};

export default function Sidebar({ projectName, setProjectName, onSave, onExportPDF, onSignedIn, debugMessage }: Props) {
  return (
    <aside className="sidebar">
      <div className="title">Project</div>
      <div className="item active">
        <span>📄</span>
        <input
          className="input project-name"
          value={projectName}
          onChange={e=>setProjectName(e.target.value)}
          placeholder="Untitled"
        />
      </div>

      <div className="sec">Save & Export</div>
      <button className="btn" onClick={onSave} style={{width:'100%', marginBottom:'8px'}}>💾 Save Project</button>
      <div className="item" onClick={onExportPDF} style={{cursor:'pointer', marginBottom:'8px'}}>
        <span>🖨️</span><span>Save as PDF</span>
      </div>

      <div className="sec">Account</div>
      <AuthMini onSignedIn={onSignedIn} />

      <div className="sec">Debug</div>
      {debugMessage && (
        <div style={{fontSize:12, color:'#666', margin:'6px 12px', padding:'4px', background:'#f0f0f0', borderRadius:'4px'}}>
          {debugMessage}
        </div>
      )}

      <button className="btn" onClick={async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session:', session ? 'Found' : 'None', session?.user?.email, error);
        const { data: { user } } = await supabase.auth.getUser();
        console.log('User:', user ? 'Found' : 'None', user?.email);
        console.log('LocalStorage token:', localStorage.getItem('supabase.auth.token'));
      }}>Check Session</button>
    </aside>
  );
}
