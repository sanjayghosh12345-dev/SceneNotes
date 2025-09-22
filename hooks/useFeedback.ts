// hooks/useFeedback.ts
'use client';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { FeedbackEntry } from '@/lib/types';
import type { Suggestion } from '@/components/ScreenplayEditor';

type Params = {
  getText: () => string;
  profile: string;
  tone: string;
  onCost?: (usd: number) => void;
  onScheduleSave?: (extras: Partial<{ feedbacks: FeedbackEntry[]; activeFeedbackId: string | null }>) => void;
  // Controlled mode (optional): pass external state and setters
  feedbacks?: FeedbackEntry[];
  setFeedbacks?: Dispatch<SetStateAction<FeedbackEntry[]>>;
  activeFeedbackId?: string | null;
  setActiveFeedbackId?: Dispatch<SetStateAction<string | null>>;
};

export function useFeedback({ getText, profile, tone, onCost, onScheduleSave, feedbacks: extFeedbacks, setFeedbacks: extSetFeedbacks, activeFeedbackId: extActiveId, setActiveFeedbackId: extSetActiveId }: Params) {
  const [intFeedbacks, setIntFeedbacks] = useState<FeedbackEntry[]>([]);
  const [intActiveId, setIntActiveId] = useState<string | null>(null);
  const feedbacks = extFeedbacks ?? intFeedbacks;
  const setFeedbacks = (extSetFeedbacks ?? setIntFeedbacks) as Dispatch<SetStateAction<FeedbackEntry[]>>;
  const activeFeedbackId = extActiveId ?? intActiveId;
  const setActiveFeedbackId = (extSetActiveId ?? setIntActiveId) as Dispatch<SetStateAction<string | null>>;
  const [notes, setNotes] = useState<string | null>(null);
  const [rewrite, setRewrite] = useState<string | null>(null);
  const [suggs, setSuggs] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function cleanNotesText(s: string) {
    if (!s) return '';
    let t = String(s).trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    return t;
  }

  const requestSuggestions = useCallback(async (fullText: string) => {
    try {
      const res = await fetch('/api/suggest', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: fullText, profile, tone })
      });
      const data = await res.json();
      if (res.ok) setSuggs((data.suggestions || []) as Suggestion[]);
    } catch {}
  }, [profile, tone]);

  const activateFeedback = useCallback(async (fbId: string) => {
    setActiveFeedbackId(fbId);
    const fb = feedbacks.find(f => f.id === fbId);
    if (!fb) return;
    setNotes(fb.notesText);
    let list = fb.suggestions || [];
    const needAnchors = list.length === 0 || list.every((s: any) => !Number.isFinite(s?.startOffset) && s?.nearLine == null);
    if (needAnchors) {
      await requestSuggestions(getText());
    } else {
      setSuggs(list as Suggestion[]);
    }
  }, [feedbacks, getText, requestSuggestions]);

  const accept = (id: string) => setSuggs(prev => prev.filter(s => s.id !== id));

  const runNotes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const text = getText();
      const res = await fetch('/api/notes', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text, action:'notes', tone, profile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const newFb: FeedbackEntry = {
        id: crypto.randomUUID(),
        title: `Feedback #${(feedbacks?.length ?? 0) + 1}`,
        createdAt: new Date().toISOString(),
        notesText: cleanNotesText(String(data.notes ?? '')),
        suggestions: (data.suggestions as Suggestion[] | undefined) || [],
      };
      const next = [...feedbacks, newFb];
      setFeedbacks(next);
      setActiveFeedbackId(newFb.id);
      setNotes(newFb.notesText);
      setSuggs(newFb.suggestions);

      onScheduleSave?.({ feedbacks: next, activeFeedbackId: newFb.id });

      const usd = Number(data?.cost?.usd ?? 0);
      if (onCost && Number.isFinite(usd)) onCost(usd);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [feedbacks, getText, onCost, onScheduleSave, profile, tone]);

  const runRewrite = useCallback( async () => {
    setLoading(true); setError(null);
    try {
      const text = getText();
      const res = await fetch('/api/notes', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text, action:'rewrite', tone, profile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setRewrite(String(data.rewrite ?? ''));
      setNotes(null);

      const usd = Number(data?.cost?.usd ?? 0);
      if (onCost && Number.isFinite(usd)) onCost(usd);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [getText, onCost, profile, tone]);

  return {
    // state
    feedbacks, activeFeedbackId, notes, rewrite, suggs,
    loading, error,

    // actions
    requestSuggestions, activateFeedback, accept,
    runNotes, runRewrite,

    // helpers for saving
    setFeedbacks, setActiveFeedbackId, setNotes, setRewrite,
  };
}
