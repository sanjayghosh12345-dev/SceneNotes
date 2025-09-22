// app/page.tsx
'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import NotesDrawer from '@/components/NotesDrawer';
import AuthDebug from '@/components/AuthDebug';
import { useProject } from '@/hooks/useProject';
import { useBudget } from '@/hooks/useBudget';
import { useFeedback } from '@/hooks/useFeedback';
import type { Profile, Tone } from '@/lib/types';

const ScreenplayEditor = dynamic(() => import('@/components/ScreenplayEditor'), { ssr: false });

export default function Page() {
  // Project / persistence
  const {
    projectId, projectName, setProjectName,
    text, setText,
    contentHtml, setContentHtml,
    profile, setProfile,
    tone, setTone,
    feedbacks, setFeedbacks,
    activeFeedbackId, setActiveFeedbackId,
    loadLatest, error, debugMessage,
    saveNow, scheduleSave,
    spentUsd, setSpentUsd,
    lastUsd, setLastUsd,
  } = useProject();

  // Budget
  const { remaining, addCost, resetSpend } = useBudget({ spentUsd, setSpentUsd, lastUsd, setLastUsd });

  // Feedback / notes (controlled mode: feedback state comes from useProject)
  const {
    notes, rewrite, suggs,
    loading, error: notesError,
    requestSuggestions, activateFeedback, accept,
    runNotes, runRewrite,
  } = useFeedback({
    getText: () => text,
    profile, tone,
    onCost: addCost,
    onScheduleSave: (extras) => scheduleSave({
      ...extras,
      spentUsd,
      lastUsd,
      contentHtml,
    }),
    feedbacks, setFeedbacks,
    activeFeedbackId, setActiveFeedbackId,
  });

  // Inline pins toggle (UI-only)
  const [showNotesPins, setShowNotesPins] = useState(true);

  // Editor API
  const editorAPI = useRef<{
    insertScene: (k?: 'INT.'|'EXT.'|'INT/EXT.') => void;
    insertCharacter: () => void;
    insertParen: () => void;
    insertDialogue: () => void;
    insertTransition: (k?: 'CUT TO:'|'FADE OUT:'|'DISSOLVE TO:'|'SMASH CUT:') => void;
    insertAction: () => void;
  } | null>(null);

  const onSaveProject = () =>
    saveNow({ feedbacks, activeFeedbackId, contentHtml, spentUsd, lastUsd });

  const exportPDF = () => window.print();

  return (
    <div className="app">
      <Sidebar
        projectName={projectName}
        setProjectName={setProjectName}
        onSave={onSaveProject}
        onExportPDF={exportPDF}
        onSignedIn={loadLatest}
        debugMessage={debugMessage}
      />

      <div className="workspace">
        <Topbar
          profile={profile as Profile}
          tone={tone as Tone}
          setProfile={(p)=>setProfile(p)}
          setTone={(t)=>setTone(t)}
          onRunNotes={runNotes}
          onRunRewrite={runRewrite}
          remainingUsd={remaining}
          resetSpend={resetSpend}
          insertScene={(k)=>editorAPI.current?.insertScene(k)}
          insertAction={()=>editorAPI.current?.insertAction()}
          insertCharacter={()=>editorAPI.current?.insertCharacter()}
          insertDialogue={()=>editorAPI.current?.insertDialogue()}
          insertParen={()=>editorAPI.current?.insertParen()}
          insertTransition={(k)=>editorAPI.current?.insertTransition(k)}
        />

        <div className="main">
          <div className="editorWrap">
            <ScreenplayEditor
              value={text}
              html={contentHtml}
              onChange={({ text: t, html }) => { setText(t); setContentHtml(html); }}
              suggestions={suggs}
              onAccept={(id)=>accept(id)}
              onRequestSuggestions={(full)=>requestSuggestions(full)}
              onReady={(api)=>{ editorAPI.current = api; }}
              showNotes={showNotesPins}
            />
          </div>
        </div>
      </div>

      <NotesDrawer
        loading={loading}
        error={error || notesError}
        feedbacks={feedbacks}
        activeFeedbackId={activeFeedbackId}
        onActivateFeedback={activateFeedback}
        notes={notes}
        rewrite={rewrite}
        spentUsd={spentUsd}
        lastUsd={lastUsd}
        showNotesPins={showNotesPins}
        setShowNotesPins={setShowNotesPins}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          .sidebar, .topbar, .notesDrawer { display:none !important; }
          .editorWrap { padding:0 !important; }
          body, html, .app, .workspace, .main { background:#fff !important; }
        }
        .workspace { padding-right: 24px; }
      `}</style>

      <AuthDebug />
    </div>
  );
}
