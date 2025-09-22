// components/Topbar.tsx
'use client';
import type { Profile, Tone } from '@/lib/types';

type Props = {
  profile: Profile;
  tone: Tone;
  setProfile: (p: Profile) => void;
  setTone: (t: Tone) => void;
  onRunNotes: () => void;
  onRunRewrite: () => void;
  remainingUsd: number;
  resetSpend: () => void;

  // editor actions
  insertScene: (k?: 'INT.'|'EXT.'|'INT/EXT.') => void;
  insertAction: () => void;
  insertCharacter: () => void;
  insertDialogue: () => void;
  insertParen: () => void;
  insertTransition: (k?: 'CUT TO:'|'FADE OUT:'|'DISSOLVE TO:'|'SMASH CUT:') => void;
};

export default function Topbar({
  profile, tone, setProfile, setTone,
  onRunNotes, onRunRewrite, remainingUsd, resetSpend,
  insertScene, insertAction, insertCharacter, insertDialogue, insertParen, insertTransition
}: Props) {
  return (
    <div className="topbar">
      <div className="left">
        <button className="btn" onClick={()=>insertScene('INT.')}>Scene</button>
        <button className="btn" onClick={()=>insertAction()}>Action</button>
        <button className="btn" onClick={()=>insertCharacter()}>Characters</button>
        <button className="btn" onClick={()=>insertDialogue()}>Dialogue</button>
        <button className="btn" onClick={()=>insertParen()}>Paranthesis</button>
        <button className="btn" onClick={()=>insertTransition('CUT TO:')}>Transition</button>
      </div>
      <div className="right">
        <select className="select" value={profile} onChange={(e)=>setProfile(e.target.value as Profile)}>
          <option>TV Writer</option><option>Superhero</option><option>Horror-Thriller</option><option>Rom-Com</option>
        </select>
        <select className="select" value={tone} onChange={(e)=>setTone(e.target.value as Tone)}>
          <option value="gentle">Gentle</option><option value="ruthless">Ruthless</option>
        </select>
        <button className="btn" onClick={onRunNotes}>Get Notes</button>
        <button className="btn" onClick={onRunRewrite}>Rewrite</button>
        <span className={`badge ${remainingUsd>0?'ok':'warn'}`}>${remainingUsd.toFixed(2)} left</span>
        <button className="btn" onClick={resetSpend}>Reset</button>
      </div>
    </div>
  );
}
