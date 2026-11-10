import { resolveMacroGenres, trackMatchesMacroGenres } from '../src/utils/genreTaxonomy';
import { calculateBpmCompatibility } from '../src/algorithm/transitionScorer';
import { evaluateCamelotTransition } from '../src/algorithm/camelot';
import { generateIsoPrinciplePlaylist } from '../src/algorithm/curveGenerator';
import { Track } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('=== WAVEFLOW V3.0 MASTER SPECIFICATION VERIFICATION ===\n');

// 1. MACRO-GENRE TAXONOMY RESOLUTION
console.log('--- 1. Macro-Genre Taxonomy Tests ---');
const skaPunkGenres = resolveMacroGenres(['ska punk', 'third wave ska']);
assert(skaPunkGenres.includes('Ska'), 'ska punk resolves to Ska');
assert(skaPunkGenres.includes('Punk'), 'ska punk resolves to Punk');

const metalGenres = resolveMacroGenres(['melodic metalcore', 'power metal']);
assert(metalGenres.includes('Metal'), 'melodic metalcore resolves to Metal');
assert(!metalGenres.includes('Ska'), 'melodic metalcore does NOT resolve to Ska');

const edmGenres = resolveMacroGenres(['deep house', 'melodic techno']);
assert(edmGenres.includes('Electronic'), 'deep house resolves to Electronic');

const lofiGenres = resolveMacroGenres(['lo-fi beats', 'chillhop']);
assert(lofiGenres.includes('Lo-Fi'), 'lo-fi beats resolves to Lo-Fi');

// 2. STRICT GENRE HARD FILTER (ZERO BLEED)
console.log('\n--- 2. Strict Macro-Genre Hard Filter Tests ---');
const powerPaladinTrack: Partial<Track> = {
  id: 'pp-1',
  name: 'Kitsune',
  artist: 'Power Paladin',
  genres: ['power metal', 'heavy metal'],
  macro_genres: ['Metal'],
  bpm: 144,
  energy_score: 92,
  vocal_presence: 75,
  has_lyrics: true
};

const skaPecesTrack: Partial<Track> = {
  id: 'ska-1',
  name: 'El Gran Ska',
  artist: 'Los Fabulosos',
  genres: ['ska', 'latin rock'],
  macro_genres: ['Ska', 'Latin', 'Rock'],
  bpm: 138,
  energy_score: 80,
  vocal_presence: 60,
  has_lyrics: true
};

// Power Paladin must NOT match Ska
assert(
  !trackMatchesMacroGenres(powerPaladinTrack, ['Ska']),
  'Power Paladin (Power Metal) is strictly REJECTED when Ska is selected'
);

// Los Fabulosos MUST match Ska
assert(
  trackMatchesMacroGenres(skaPecesTrack, ['Ska']),
  'Los Fabulosos strictly matches Ska'
);

// 3. CAMELOT HARMONIC MATRIX TESTS
console.log('\n--- 3. Camelot Wheel Harmonic Cost Tests ---');
const exactKey = evaluateCamelotTransition('8A', '8A', 'plateau');
assert(exactKey.cost === 0.00, `Identical key 8A->8A cost is 0.00 (got ${exactKey.cost})`);

const relativeKey = evaluateCamelotTransition('8A', '8B', 'plateau');
assert(relativeKey.cost === 0.10, `Relative key 8A->8B cost is 0.10 (got ${relativeKey.cost})`);

const adjacentKey = evaluateCamelotTransition('8A', '9A', 'plateau');
assert(adjacentKey.cost === 0.15, `Adjacent key 8A->9A cost is 0.15 (got ${adjacentKey.cost})`);

const boostInClimax = evaluateCamelotTransition('8A', '3A', 'climax');
assert(boostInClimax.cost === 0.35, `Climax energy boost (+7 mod 12) cost is 0.35 in climax (got ${boostInClimax.cost})`);

const boostInWarmup = evaluateCamelotTransition('8A', '3A', 'warmup');
assert(boostInWarmup.cost === 0.90, `Climax energy boost (+7 mod 12) cost is 0.90 outside climax (got ${boostInWarmup.cost})`);

const wholeTone = evaluateCamelotTransition('8A', '10A', 'plateau');
assert(wholeTone.cost === 0.45, `Whole tone step (+2 mod 12) cost is 0.45 (got ${wholeTone.cost})`);

const clash = evaluateCamelotTransition('8A', '2A', 'plateau');
assert(clash.cost === 1.00, `Dissonant clash 8A->2A cost is 1.00 (got ${clash.cost})`);

// 4. METRIC TEMPO COMPATIBILITY TESTS
console.log('\n--- 4. Metric Tempo Divergence (ΔBPM_norm) Tests ---');
const syncBpm = calculateBpmCompatibility(120, 120);
assert(syncBpm.deltaBpmNorm === 0, `Locked BPM has deltaBpmNorm = 0 (got ${syncBpm.deltaBpmNorm})`);
assert(syncBpm.relation === 'tempo_lock', 'Relation is tempo_lock');

const doubleTimeBpm = calculateBpmCompatibility(70, 140, true);
assert(doubleTimeBpm.deltaBpmNorm === 0, `Half/double time 70->140 BPM has deltaBpmNorm = 0 (got ${doubleTimeBpm.deltaBpmNorm})`);
assert(doubleTimeBpm.relation === 'double_time', 'Relation is double_time');

const wideBpm = calculateBpmCompatibility(120, 144, true);
assert(wideBpm.deltaBpmNorm > 1.0, `120->144 BPM (20% divergence) exceeds 8% tolerance (deltaBpmNorm = ${wideBpm.deltaBpmNorm} > 1.0)`);
assert(wideBpm.relation === 'jump', 'Relation is jump');

// 5. STAGE 1 HARD GATES IN PLAYLIST GENERATION (ZERO BLEED)
console.log('\n--- 5. Deterministic Stage 1 Hard Gates in Playlist Generation ---');

const testTracks: Track[] = [
  {
    id: 't-instr-1',
    uri: 'spotify:track:1',
    name: 'Ambient Flow',
    artist: 'Brian Eno',
    album: 'Apollo',
    album_art: '',
    duration_ms: 180000,
    bpm: 120,
    camelot_key: '8A',
    pitch_class: 9,
    mode: 0,
    energy_score: 45,
    valence_score: 50,
    vocal_presence: 2,
    has_lyrics: false,
    genres: ['ambient', 'electronic'],
    macro_genres: ['Electronic']
  },
  {
    id: 't-instr-2',
    uri: 'spotify:track:2',
    name: 'Chill Sine',
    artist: 'Solar Fields',
    album: 'Movements',
    album_art: '',
    duration_ms: 200000,
    bpm: 122,
    camelot_key: '9A',
    pitch_class: 4,
    mode: 0,
    energy_score: 48,
    valence_score: 52,
    vocal_presence: 4,
    has_lyrics: false,
    genres: ['ambient', 'electronic'],
    macro_genres: ['Electronic']
  },
  {
    id: 't-vocal-1',
    uri: 'spotify:track:3',
    name: 'Vocal Anthem',
    artist: 'Adele',
    album: '30',
    album_art: '',
    duration_ms: 220000,
    bpm: 120,
    camelot_key: '8A',
    pitch_class: 9,
    mode: 0,
    energy_score: 46,
    valence_score: 48,
    vocal_presence: 85,
    has_lyrics: true,
    genres: ['pop'],
    macro_genres: ['Pop']
  },
  {
    id: 't-metal-1',
    uri: 'spotify:track:4',
    name: 'Dragon Fire',
    artist: 'Power Paladin',
    album: 'With the Magic of Windfyre Steel',
    album_art: '',
    duration_ms: 240000,
    bpm: 144,
    camelot_key: '9B',
    pitch_class: 7,
    mode: 1,
    energy_score: 95,
    valence_score: 70,
    vocal_presence: 70,
    has_lyrics: true,
    genres: ['power metal'],
    macro_genres: ['Metal']
  }
];

// Test 5A: Instrumental Hard Gate (vocal_presence <= 5 and has_lyrics === false)
const instrumentalPlaylist = generateIsoPrinciplePlaylist(
  testTracks,
  'deep_focus',
  {
    targetDurationMins: 10,
    vocals: 'instrumental',
    genreMode: 'surprise'
  }
);

assert(instrumentalPlaylist.curated_set.length > 0, 'Generated instrumental playlist');
const vocalBleed = instrumentalPlaylist.curated_set.filter(
  (t) => (t.vocal_presence ?? 50) > 5 || t.has_lyrics === true
);
assert(vocalBleed.length === 0, `Zero vocal tracks in instrumental mode (found ${vocalBleed.length} bleed)`);

// Test 5B: Strict Genre Hard Gate (Ska vs Power Metal)
const skaOnlyPlaylist = generateIsoPrinciplePlaylist(
  testTracks,
  'festival_explosive',
  {
    targetDurationMins: 10,
    selectedGenres: ['Electronic'],
    genreMode: 'strict'
  }
);

const metalBleed = skaOnlyPlaylist.curated_set.filter(
  (t) => t.macro_genres?.includes('Metal') || t.artist === 'Power Paladin'
);
assert(metalBleed.length === 0, `Zero Metal tracks in Strict Electronic mode (found ${metalBleed.length} bleed)`);

// 6. ARTIST REPEAT COOLDOWN PENALTY
console.log('\n--- 6. Artist Repeat Cooldown (P_artist) Tests ---');
import { evaluateTrackTransition, evaluateBidirectionalSwapCost } from '../src/algorithm/transitionScorer';

const trackA1: Track = { ...testTracks[0], id: 'a1', artist: 'Brian Eno' };
const trackA2: Track = { ...testTracks[1], id: 'a2', artist: 'Brian Eno' };
const trackB1: Track = { ...testTracks[1], id: 'b1', artist: 'Solar Fields' };

// Same consecutive artist receives P_artist penalty (+200 cost)
const repeatArtistEval = evaluateTrackTransition(trackA1, trackA2, {
  intentId: 'deep_focus',
  recentArtists: ['Brian Eno']
});
assert(repeatArtistEval.penalty >= 200, `Consecutive same artist penalty is >= 200 (got ${repeatArtistEval.penalty})`);
assert(repeatArtistEval.score === 0, `Consecutive same artist transition score drops to 0 (got ${repeatArtistEval.score})`);

// Different artist has no penalty
const diffArtistEval = evaluateTrackTransition(trackA1, trackB1, {
  intentId: 'deep_focus',
  recentArtists: ['Brian Eno']
});
assert(diffArtistEval.penalty === 0, `Different artist has 0 penalty (got ${diffArtistEval.penalty})`);
assert(diffArtistEval.score >= 80, `High quality transition score for harmonically compatible tracks (got ${diffArtistEval.score})`);

// 7. IN-LINE SWAP BIDIRECTIONAL RECALCULATION
console.log('\n--- 7. In-Line Swap Bidirectional Recalculation ---');
const swapResult = evaluateBidirectionalSwapCost(trackB1, trackA1, null, {
  intentId: 'deep_focus',
  phaseType: 'plateau'
});
assert(swapResult.combinedScore > 50, `Bidirectional swap cost calculates valid flow score (got ${swapResult.combinedScore})`);

console.log('\n🎉 ALL 19 MASTER SPECIFICATION ASSERTIONS VERIFIED SUCCESSFULLY!');

