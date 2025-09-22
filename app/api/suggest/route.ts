import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const client = new OpenAI();
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

const Body = z.object({
  text: z.string().min(10),
  profile: z.enum(['TV Writer','Superhero','Horror-Thriller','Rom-Com']),
  tone: z.enum(['gentle','ruthless']).default('gentle'),
});

const system = `You are an inline screenplay editor. Output ONLY compact JSON:
{
  "suggestions": [
    {
      "id": "s1",
      "find": "<exact text to anchor>",
      "replace": "<replacement text>",
      "note": "<short reason>",
      "severity": "mild|moderate|severe",
      "nearLine": 12,
      "startOffset": 123,
      "endOffset": 156
    }
  ]
}
Rules:
- Use the numbered view of the scene (if provided) to determine accurate 1-based line numbers.
- If confident, include startOffset/endOffset (character offsets in the RAW scene text) for higher precision.
- Always include nearLine; find must exist verbatim in RAW scene text.
- Keep suggestions surgical (one line or short span). Keep screenplay formatting. No camera directions unless motivated.`;

export async function POST(req: NextRequest) {
  try {
    const { text, profile, tone } = Body.parse(await req.json());

    if (!process.env.OPENAI_API_KEY) {
      // tiny offline heuristic fallback
      const s = [];
      const idx = text.indexOf('You look like a man arguing with a ghost.');
      if (idx >= 0) {
        s.push({
          id: 's1', find: 'You look like a man arguing with a ghost.',
          replace: 'Looks like a man arguing with a ghost.',
          note: 'Tighter phrasing.',
          severity: 'mild', nearLine: text.substring(0, idx).split('\n').length
        });
      }
      return NextResponse.json({ suggestions: s });
    }

    const numbered = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l, i) => `[${String(i + 1).padStart(4, '0')}] ${l}`)
      .join('\n');
    const user = { profile, tone, scene: text, scene_numbered: numbered };
    const r = await client.responses.create({
      model: MODEL,
      input: `SYSTEM:\n${system}\n\nUSER:\n${JSON.stringify(user)}`
    });

    const txt = (r as any).output_text || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(txt); } catch { parsed = { suggestions: [] }; }
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    // sanitize
    const clean = suggestions
      .filter((x: any) => x && x.find)
      .map((x: any, i: number) => ({
        id: String(x.id ?? `s${i+1}`),
        find: String(x.find),
        replace: String(x.replace ?? x.find),
        note: String(x.note ?? ''),
        severity: (['mild','moderate','severe'].includes(x.severity) ? x.severity : 'mild') as 'mild'|'moderate'|'severe',
        nearLine: Number.isFinite(x.nearLine) ? Number(x.nearLine) : undefined,
        startOffset: Number.isFinite(x.startOffset) ? Number(x.startOffset) : undefined,
        endOffset: Number.isFinite(x.endOffset) ? Number(x.endOffset) : undefined,
      }));

    return NextResponse.json({ suggestions: clean });
  } catch (e: any) {
    const msg = e?.error?.message || e?.message || 'Server error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
