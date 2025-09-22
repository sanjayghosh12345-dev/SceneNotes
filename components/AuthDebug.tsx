// components/AuthDebug.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthDebug() {
  const [email, setEmail] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<'Active'|'None'>('None');
  const [storage, setStorage] = useState<'Present'|'Empty'>('Empty');

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(user?.email ?? null);
      setSessionState(session ? 'Active' : 'None');
      setStorage(window.localStorage.getItem('supabase.auth.token') ? 'Present' : 'Empty');
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
      setSessionState(s ? 'Active' : 'None');
      setStorage(window.localStorage.getItem('supabase.auth.token') ? 'Present' : 'Empty');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div style={{fontSize:12, opacity:.7, margin:'6px 12px'}}>
      <div>Auth: {email ?? 'signed out'}</div>
      <div>Session: {sessionState}</div>
      <div>Storage: {storage}</div>
    </div>
  );
}
