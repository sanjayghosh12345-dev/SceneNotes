// hooks/useProject.ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProjectRow, Profile, Tone } from '@/lib/types';
import { exampleFountain } from '@/lib/constants';

type SaveExtras = {
  contentHtml?: string;
  feedbacks?: any[];
  activeFeedbackId?: string | null;
  spentUsd?: number;
  lastUsd?: number;
};

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled');
  const [text, setText] = useState(exampleFountain.trim());
  const [contentHtml, setContentHtml] = useState('');
  const [profile, setProfile] = useState<Profile>('TV Writer');
  const [tone, setTone] = useState<Tone>('gentle');

  // extras restored into local state
  const [spentUsd, setSpentUsd] = useState(0);
  const [lastUsd, setLastUsd] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>('App loaded');

  const loadLatestRef = useRef(false);

  const loadLatest = useCallback(async () => {
    if (loadLatestRef.current) return;
    loadLatestRef.current = true;
    setDebugMessage('Loading project…');

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      // Not signed in → local backup
      if (!user) {
        const local = window.localStorage.getItem('sn_project');
        if (local) {
          const p = JSON.parse(local);
          setProjectId(p.id ?? null);
          setProjectName(p.name ?? 'Untitled');
          setText(p.content ?? exampleFountain.trim());
          const st = p.state || {};
          if (st.contentHtml !== undefined) setContentHtml(String(st.contentHtml));
          if (st.profile !== undefined) setProfile(st.profile);
          if (st.tone !== undefined) setTone(st.tone);
          if (st.spentUsd !== undefined) setSpentUsd(Number(st.spentUsd) || 0);
          if (st.lastUsd !== undefined) setLastUsd(Number(st.lastUsd) || 0);
          if (Array.isArray(st.feedbacks)) setFeedbacks(st.feedbacks);
          setActiveFeedbackId(st.activeFeedbackId ?? null);
          setDebugMessage('Loaded local backup');
        } else {
          setDebugMessage('No local backup found');
        }
        return;
      }

      // Signed in → fetch latest row
      const { data, error: fetchErr } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .returns<ProjectRow[]>();
      if (fetchErr) throw fetchErr;

      if (data && data.length) {
        const row = data[0];
        setProjectId(row.id);
        setProjectName(row.name ?? 'Untitled');
        setText(row.content ?? exampleFountain.trim());
        const st = row.state || {};
        if (st.profile !== undefined) setProfile(st.profile);
        if (st.tone !== undefined) setTone(st.tone);
        if (st.contentHtml !== undefined) setContentHtml(String(st.contentHtml ?? ''));
        if (st.spentUsd !== undefined) setSpentUsd(Number(st.spentUsd) || 0);
        if (st.lastUsd !== undefined) setLastUsd(Number(st.lastUsd) || 0);
        if (Array.isArray(st.feedbacks)) setFeedbacks(st.feedbacks);
        setActiveFeedbackId(st.activeFeedbackId ?? null);
        setDebugMessage(`Loaded from Supabase: ${row.name}`);
      } else {
        // No rows → create one
        const uid = (await supabase.auth.getUser()).data.user!.id;
        const { data: ins, error: insErr } = await supabase
          .from('projects')
          .insert({
            user_id: uid,
            name: 'Untitled',
            content: exampleFountain.trim(),
            state: { profile: 'TV Writer', tone: 'gentle', contentHtml: '' }
          })
          .select('*')
          .single<ProjectRow>();
        if (insErr) throw insErr;
        setProjectId(ins.id);
        setProjectName(ins.name ?? 'Untitled');
        setText(ins.content ?? exampleFountain.trim());
        setProfile('TV Writer');
        setTone('gentle');
        setContentHtml('');
        setFeedbacks([]);
        setActiveFeedbackId(null);
        setSpentUsd(0);
        setLastUsd(0);
        setDebugMessage('Created new project');
      }
    } catch (e: any) {
      console.error('loadLatest error', e);
      setError('Failed to load project');
    } finally {
      loadLatestRef.current = false;
    }
  }, []);

  // hydrate once on mount
  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  // auth change listener: reload on sign in/out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) await loadLatest();
      if (event === 'SIGNED_OUT') {
        setProjectId(null);
        setProjectName('Untitled');
        setText(exampleFountain.trim());
        setProfile('TV Writer');
        setTone('gentle');
        setSpentUsd(0);
        setLastUsd(0);
        setFeedbacks([]);
        setActiveFeedbackId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadLatest]);

  // Save now (includes extras like feedbacks/costs)
  const saveNow = useCallback(async (extras: SaveExtras = {}) => {
    setDebugMessage('Saving…');
    try {
      // Always save a local backup
      const localPayload = {
        id: projectId,
        name: projectName,
        content: text,
        state: {
          profile,
          tone,
          contentHtml,
          spentUsd,
          lastUsd,
          feedbacks,
          activeFeedbackId,
          ...extras
        }
      };
      window.localStorage.setItem('sn_project', JSON.stringify(localPayload));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDebugMessage('Saved locally (not signed in)');
        return;
      }

      const payload = {
        user_id: user.id,
        name: projectName,
        content: text,
        state: {
          profile,
          tone,
          contentHtml,
          spentUsd,
          lastUsd,
          feedbacks,
          activeFeedbackId,
          ...extras
        }
      };

      if (!projectId) {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select('*')
          .single<ProjectRow>();
        if (error) throw error;
        if (data) setProjectId(data.id);
      } else {
        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', projectId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
      setDebugMessage('Saved');
    } catch (e: any) {
      console.error('saveNow error', e);
      setError(e.message || 'Save failed');
      setDebugMessage('Save failed');
    }
  }, [projectId, projectName, text, profile, tone, contentHtml, spentUsd, lastUsd, feedbacks, activeFeedbackId]);

  // Throttled save helper
  const saveTimer = useRef<number | null>(null);
  const scheduleSave = useCallback((extras: SaveExtras = {}) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveNow(extras), 900);
  }, [saveNow]);

  return {
    // core project state
    projectId, projectName, setProjectName,
    text, setText,
    contentHtml, setContentHtml,
    profile, setProfile,
    tone, setTone,

    // extras
    spentUsd, setSpentUsd,
    lastUsd, setLastUsd,
    feedbacks, setFeedbacks,
    activeFeedbackId, setActiveFeedbackId,

    // lifecycle
    loadLatest,

    // errors/debug
    error, setError,
    debugMessage, setDebugMessage,

    // persistence
    saveNow, scheduleSave,
  };
}
