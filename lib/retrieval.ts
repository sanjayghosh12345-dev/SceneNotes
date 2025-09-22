// Toy retrieval. Replace with embeddings later.
import { PRINCIPLES } from './principles';

export function retrievePrinciples(scene: string) {
  const s = scene.toLowerCase();
  const hits = PRINCIPLES
    .map(p => ({ p, score: score(p.tags, s) }))
    .sort((a,b)=>b.score-a.score)
    .filter(x=>x.score>0);
  return hits.map(h=>({ id: h.p.id, title: h.p.title, lesson: h.p.lesson }));
}

function score(tags: string[], text: string) { return tags.reduce((acc,t)=> acc + (text.includes(t)?1:0), 0); }
