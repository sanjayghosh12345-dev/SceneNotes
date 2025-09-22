'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AuthMini({ onSignedIn }: { onSignedIn?: () => void }) {
  console.log('🔄 AuthMini component rendered');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true); // Start with true since we're checking session

  useEffect(() => {
    console.log('🔄 AuthMini useEffect running');
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        } else {
          console.log('✅ Session retrieved:', session ? 'Found' : 'None', session?.user?.email);
          if (mounted) {
            setUser(session?.user ?? null);
            if (session?.user && onSignedIn) {
              console.log('🔄 Calling onSignedIn from initial session');
              onSignedIn();
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
      } finally {
        console.log('🔧 Setting loading to false');
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false); // Always set loading to false on auth state change
          
          if (session?.user && onSignedIn && event === 'SIGNED_IN') {
            console.log('🔄 Calling onSignedIn from auth state change');
            onSignedIn();
          }
        }
      }
    );

    // Get initial session
    getInitialSession();

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Auth loading timeout - forcing loading to false');
      if (mounted) {
        setLoading(false);
      }
    }, 3000); // 3 second timeout for initial session check

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  async function sendLink() {
    if (!email) return;
    
    setSent(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: { 
          emailRedirectTo: `${window.location.origin}` 
        } 
      });
      
      if (error) {
        console.error('Error sending magic link:', error);
        setSent(false);
      }
    } catch (error) {
      console.error('Error in sendLink:', error);
      setSent(false);
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  }

  if (loading) {
    console.log('🔄 AuthMini: Still loading...');
    return (
      <div className="mini-auth">
        <span>Loading...</span>
      </div>
    );
  }

  console.log('🔄 AuthMini: Not loading, showing form');

  if (user) {
    return (
      <div className="mini-auth">
        <span>Signed in as {user.email}</span>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="mini-auth">
      <input 
        className="input" 
        placeholder="you@email.com" 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendLink()}
      />
      <button 
        className="btn" 
        onClick={sendLink} 
        disabled={!email || sent}
      >
        {sent ? 'Check your email!' : 'Get link'}
      </button>
    </div>
  );
}
