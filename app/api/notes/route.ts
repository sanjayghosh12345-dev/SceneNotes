/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { retrievePrinciples } from '@/lib/retrieval';
import { notesSystemPrompt, rewriteSystemPrompt } from '@/lib/prompts';

export const runtime = 'nodejs';

const client = new OpenAI(); // reads OPENAI_API_KEY
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

// Pricing defaults (USD per 1M tokens). Override via env if needed.
const PRICE_IN = Number(process.env.OPENAI_PRICE_IN_PER_MTOKENS ?? '0.15');
const PRICE_OUT = Number(process.env.OPENAI_PRICE_OUT_PER_MTOKENS ?? '0.60');

const Body = z.object({
  text: z.string().min(10),
  action: z.enum(['notes', 'rewrite']),
  tone: z.enum(['gentle', 'ruthless']).default('gentle'),
});

function offlineNotes(scene: string, tone: 'gentle' | 'ruthless') {
  const sev = tone === 'ruthless' ? 'High' : 'Med';
  return retrievePrinciples(scene)
    .slice(0, 5)
    .map((p) => `- [${sev}] ${p.title} → ${p.lesson}`)
    .join('\n') + '\n(Offline mode: add OPENAI_API_KEY to .env.local and restart.)';
}

function costUsd(inputT: number, outputT: number) {
  return (inputT * PRICE_IN + outputT * PRICE_OUT) / 1_000_000;
}

export async function POST(req: NextRequest) {
  try {
    const { text, action, tone } = Body.parse(await req.json());

    if (!process.env.OPENAI_API_KEY) {
      if (action === 'notes') {
        return NextResponse.json({
          notes: offlineNotes(text, tone),
          usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
          cost: { usd: 0 },
        });
      }
      return NextResponse.json(
        { error: 'OPENAI_API_KEY missing. Put it in .env.local and restart.' },
        { status: 400 }
      );
    }

    const principles = retrievePrinciples(text).slice(0, 3);
    const system = action === 'notes' ? notesSystemPrompt : rewriteSystemPrompt;

    // Provide both raw and a numbered view to help the model anchor lines deterministically
    const numbered = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l, i) => `[${String(i + 1).padStart(4, '0')}] ${l}`)
      .join('\n');

    const input = `SYSTEM:\n${system}\n\nUSER:\n${JSON.stringify({
      tone,
      principles,
      scene: text,
      scene_numbered: numbered
    })}`;

    const r = await client.responses.create({
      model: MODEL,
      input,
      max_output_tokens: action === 'notes' ? 320 : 500, // keep cost predictable
    });

    // Try to read token usage from the API; fall back to zeros if missing.
    const usage = (r as any).usage ?? {};
    const input_tokens: number = usage.input_tokens ?? 0;
    const output_tokens: number = usage.output_tokens ?? 0;
    const total_tokens: number =
      usage.total_tokens ?? input_tokens + output_tokens;

    const usd = costUsd(input_tokens, output_tokens);

    const raw = (r as any).output_text ?? '';
    if (action !== 'notes') {
      return NextResponse.json({ rewrite: raw, usage: { input_tokens, output_tokens, total_tokens }, cost: { usd } });
    }

    // Try parse JSON with notes + suggestions; tolerate fenced code blocks
    const unfenced = raw.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '');
    let parsed: any = null;
    try { parsed = JSON.parse(unfenced); } catch {}

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ notes: unfenced || raw, usage: { input_tokens, output_tokens, total_tokens }, cost: { usd } });
    }

    // Extract only human-readable feedback lines from notes
    let notes: string;
    if (typeof parsed.notes === 'string') {
      notes = parsed.notes;
    } else if (Array.isArray(parsed.notes)) {
      notes = parsed.notes
        .map((x: any) => String(x))
        .filter((s: string) => /[A-Za-z]/.test(s))
        .join('\n');
    } else if (parsed && typeof parsed === 'object' && parsed.notes && typeof parsed.notes === 'object') {
      // Sometimes models wrap as { notes: { items: [...] } }
      const items = Array.isArray((parsed.notes as any).items) ? (parsed.notes as any).items : [];
      notes = items.map((x: any) => String(x)).filter((s: string) => /[A-Za-z]/.test(s)).join('\n');
      if (!notes) notes = unfenced || raw;
    } else {
      notes = unfenced || raw;
    }
    const arr = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const suggestions = arr
      .map((x: any, i: number) => ({
        id: String(x?.id ?? `s${i + 1}`),
        find: String(x?.find ?? ''),
        replace: String(x?.replace ?? ''),
        note: String(x?.note ?? ''),
        severity: (['mild','moderate','severe'].includes(x?.severity) ? x.severity : 'mild') as 'mild'|'moderate'|'severe',
        nearLine: Number.isFinite(x?.nearLine) ? Number(x.nearLine) : undefined,
        startOffset: Number.isFinite(x?.startOffset) ? Number(x.startOffset) : undefined,
        endOffset: Number.isFinite(x?.endOffset) ? Number(x.endOffset) : undefined,
      }))
      .filter((s: any) => s.find);

    return NextResponse.json({ notes, suggestions, usage: { input_tokens, output_tokens, total_tokens }, cost: { usd } });
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? 400;
    const msg = e?.error?.message || e?.message || 'Unknown server error';
    return NextResponse.json({ error: `${status}: ${msg}` }, { status });
  }
}
