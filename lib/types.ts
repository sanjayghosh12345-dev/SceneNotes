// lib/types.ts
export type Profile = 'TV Writer'|'Superhero'|'Horror-Thriller'|'Rom-Com';
export type Tone = 'gentle'|'ruthless';
export type Action = 'notes'|'rewrite';

export type FeedbackEntry = {
  id: string;
  title: string;     // "Feedback #N"
  createdAt: string; // ISO
  notesText: string;
  // Suggestion type comes from ScreenplayEditor; keep it 'any' here to avoid circular deps.
  suggestions: any[];
};

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  content: string;
  updated_at: string;
  state?: {
    profile?: Profile;
    tone?: Tone;
    spentUsd?: number;
    lastUsd?: number;
    contentHtml?: string;
    feedbacks?: FeedbackEntry[];
    activeFeedbackId?: string | null;
  };
};
