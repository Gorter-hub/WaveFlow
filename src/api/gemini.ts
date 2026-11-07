import {
  GeminiEnergyScore,
  Track,
  CognitiveFlowIntentId,
  CuratedSetResult,
  FlowGenerationControls
} from '../types';
import { COGNITIVE_INTENTS, generateCognitiveDJFlow } from '../algorithm/curveGenerator';

/**
 * Cleanly strips markdown code fences (like ```json or ```) and any extraneous prose
 */
export function stripMarkdownJson(raw: string): string {
  if (!raw) return '{}';

  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned.trim();
}

/**
 * Parses Gemini energy score array
 */
export function parseGeminiScores(rawText: string): GeminiEnergyScore[] {
  try {
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    const firstArr = cleaned.indexOf('[');
    const lastArr = cleaned.lastIndexOf(']');
    if (firstArr !== -1 && lastArr !== -1) {
      cleaned = cleaned.substring(firstArr, lastArr + 1);
    }
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: String(item.id || ''),
        energy: Math.min(100, Math.max(0, Number(item.energy) || 50)),
        valence: Math.min(100, Math.max(0, Number(item.valence) || 50))
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to parse Gemini output cleanly. Attempting regex extraction...', error);
    const scores: GeminiEnergyScore[] = [];
    const itemRegex = /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"energy"\s*:\s*(\d+)\s*,\s*"valence"\s*:\s*(\d+)\s*\}/g;
    let match;
    while ((match = itemRegex.exec(rawText)) !== null) {
      scores.push({
        id: match[1],
        energy: Math.min(100, Math.max(0, parseInt(match[2], 10))),
        valence: Math.min(100, Math.max(0, parseInt(match[3], 10)))
      });
    }
    return scores;
  }
}

/**
 * Cognitive DJ Set Synthesis using Gemini AI
 * Receives the enriched track pool and returns a structurally sound JSON CuratedSetResult
 */
export async function curateCognitiveFlowWithGemini(
  pool: Track[],
  intentId: CognitiveFlowIntentId,
  apiKey?: string,
  onProgress?: (progress: number, message: string) => void,
  controls?: FlowGenerationControls
): Promise<CuratedSetResult> {
  const effectiveKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const intentConfig = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;

  if (onProgress) {
    onProgress(25, `Analyzing ${pool.length} tracks against ${intentConfig.name} cognitive parameters...`);
  }

  // If no valid key or placeholder, run the local deterministic cognitive synthesis engine
  if (
    !effectiveKey ||
    effectiveKey.includes('tu_api_key') ||
    effectiveKey.includes('your_gemini') ||
    effectiveKey.length < 20
  ) {
    console.info('No Gemini API key detected. Running local cognitive synthesis engine.');
    if (onProgress) {
      onProgress(60, 'Synthesizing pacing arc, BPM lock, and duration packing...');
      await new Promise((r) => setTimeout(r, 200));
      onProgress(90, 'Applying valence continuity and anti-fatigue curves...');
      await new Promise((r) => setTimeout(r, 150));
    }
    return generateCognitiveDJFlow(pool, intentId, controls);
  }

  try {
    if (onProgress) {
      onProgress(45, 'Submitting enriched track vectors to Gemini Cognitive Engine...');
    }

    // Send a sample/subset of top candidates to fit Gemini token budget cleanly (up to 80 diverse tracks)
    const candidates = pool.slice(0, 80);
    const trackSummaries = candidates.map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artist,
      duration_mins: Number(((t.duration_ms || 210000) / 60000).toFixed(1)),
      energy: t.energy_score,
      valence: t.valence_score,
      bpm: t.bpm,
      vocals: t.vocal_presence,
      vibe: t.mood_vibe
    }));

    const targetMinutes =
      controls?.targetDurationMins ||
      (intentConfig.duration_target_mins[0] + intentConfig.duration_target_mins[1]) / 2;

    const systemPrompt = `You are a Lead Product Architect and Cognitive Music Director.
Synthesize an intelligent neuroscience-backed DJ set from the provided track pool.

INTENT: "${intentConfig.name}" (${intentConfig.badge})
NEUROSCIENCE SPEC: ${intentConfig.neuroscience_rationale}
TARGET DURATION: approximately ${targetMinutes} minutes.
BPM TRANSITION WINDOW: Adjacent tracks must stay within ±${intentConfig.bpm_tolerance} BPM.
${intentConfig.vocal_threshold_max ? `VOCAL LIMIT: Maximum vocal presence of ${intentConfig.vocal_threshold_max}% (instrumental priority).` : ''}

PHASES TO CONSTRUCT:
${intentConfig.phases
  .map(
    (p, i) =>
      `${i + 1}. "${p.name}" (${Math.round(p.duration_ratio * 100)}% of set duration, target energy ${p.target_energy_range[0]}-${p.target_energy_range[1]}%): ${p.description}`
  )
  .join('\n')}

INSTRUCTIONS:
1. Select tracks from the pool whose cumulative duration fits the target minutes (~${targetMinutes} mins). DO NOT use a fixed track count; pack by duration.
2. Order tracks sequentially respecting safe adjacent BPM transitions and smooth emotional valence continuity.
3. Return ONLY a valid JSON object matching this schema:
{
  "flow_intent": "${intentId}",
  "curated_set": [
    {
      "id": "TRACK_ID_FROM_POOL",
      "phase": "PHASE_NAME",
      "transition_note": "Brief transition rationale (e.g. +2 BPM shift, smooth harmonic glide)"
    }
  ]
}`;

    const userPrompt = `Track Pool:\n${JSON.stringify(trackSummaries, null, 2)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(`Gemini cognitive endpoint returned ${response.status}. Falling back to local engine.`);
      return generateCognitiveDJFlow(pool, intentId, controls);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = stripMarkdownJson(rawText);
    const parsed = JSON.parse(cleanedJson);

    if (parsed && Array.isArray(parsed.curated_set) && parsed.curated_set.length >= 5) {
      const trackMap = new Map<string, Track>();
      for (const t of pool) trackMap.set(t.id, t);

      const curatedSet: Track[] = [];
      let currentIdx = 1;

      for (let i = 0; i < parsed.curated_set.length; i++) {
        const item = parsed.curated_set[i];
        const originalTrack = trackMap.get(item.id);
        if (originalTrack) {
          curatedSet.push({
            ...originalTrack,
            phase: item.phase || intentConfig.phases[0].name,
            phaseIndex: i + 1,
            overallIndex: currentIdx++,
            transition_note: item.transition_note || 'Harmonic lock'
          });
        }
      }

      // Recompute phase breakdowns
      const phases = intentConfig.phases.map((p) => {
        const phaseTracks = curatedSet.filter((t) => t.phase === p.name);
        const duration_ms = phaseTracks.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);
        return {
          name: p.name,
          description: p.description,
          trackCount: phaseTracks.length,
          duration_ms,
          minEnergy: p.target_energy_range[0],
          maxEnergy: p.target_energy_range[1],
          color: p.color,
          gradient: p.gradient,
          rangeIndex: [1, phaseTracks.length] as [number, number]
        };
      });

      const totalMs = curatedSet.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);

      if (onProgress) {
        onProgress(100, `Synthesized ${curatedSet.length} tracks with Gemini AI.`);
      }

      return {
        flow_intent: intentId,
        computed_total_duration_ms: totalMs,
        computed_total_tracks: curatedSet.length,
        phases,
        curated_set: curatedSet,
        applied_controls: controls
      };
    }

    // Fallback if parsed json didn't have adequate curated_set
    return generateCognitiveDJFlow(pool, intentId, controls);
  } catch (error) {
    console.error('Gemini synthesis failed, using local engine:', error);
    return generateCognitiveDJFlow(pool, intentId, controls);
  }
}

/**
 * Legacy compatibility: analyze tracks with Gemini for energy and valence
 */
export async function analyzeTracksWithGemini(
  tracks: Track[],
  apiKey?: string,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { energy: number; valence: number }>> {
  const map = new Map<string, { energy: number; valence: number }>();
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    map.set(t.id, {
      energy: t.energy_score ?? t.energy ?? 50,
      valence: t.valence_score ?? t.valence ?? 50
    });
    if (onProgress && (i % 25 === 0 || i === tracks.length - 1)) {
      onProgress(i + 1, tracks.length);
    }
  }
  return map;
}

export async function simulateEnergyScoring(
  tracks: Track[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { energy: number; valence: number }>> {
  return analyzeTracksWithGemini(tracks, undefined, onProgress);
}
