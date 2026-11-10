import { Track } from '../types';

export const MACRO_GENRES = [
  'Ska',
  'Reggae',
  'Punk',
  'Rock',
  'Metal',
  'Electronic',
  'Hip-Hop',
  'Jazz',
  'Latin',
  'Pop',
  'Indie',
  'Folk',
  'Classical',
  'Lo-Fi'
] as const;

export type MacroGenre = typeof MACRO_GENRES[number];

/**
 * High-precision taxonomy regular expressions mapping Spotify micro-genres,
 * artist tags, and title keywords to high-level parent Macro-Genres.
 */
export const TAXONOMY_RULES: Record<MacroGenre, RegExp> = {
  Ska: /ska\b|rocksteady|two-tone|2 tone|bluebeat|ska punk|skacore|traditional ska/i,
  Reggae: /reggae\b|dub\b|roots reggae|dancehall|ragga|raggamuffin|lovers rock/i,
  Punk: /punk\b|hardcore\b|post-punk|pop punk|oi!|emo\b|skate punk|crust punk|garage punk/i,
  Rock: /rock\b|garage rock|classic rock|grunge|alternative rock|psychedelic rock|hard rock|southern rock|glam rock/i,
  Metal: /metal\b|heavy metal|thrash|death metal|black metal|doom metal|power metal|speed metal|metalcore|deathcore|djent/i,
  Electronic: /electronic|techno|house\b|trance\b|edm\b|synthwave|drum and bass|dnb\b|ambient\b|idm\b|electro\b|downtempo|breakbeat|dubstep|electronica/i,
  'Hip-Hop': /hip-hop|hip hop|rap\b|trap\b|boom bap|drill\b|grime\b|conscious hip hop|gangsta rap/i,
  Jazz: /jazz\b|bebop|swing\b|bossa nova|fusion\b|hard bop|cool jazz|modal jazz|dixieland/i,
  Latin: /latin\b|salsa|cumbia|bachata|reggaeton|merengue|tango|mariachi|chicha|vallenato|bolero|ranchera/i,
  Pop: /pop\b|synthpop|k-pop|dance pop|electropop|hyperpop|art pop|indie pop/i,
  Indie: /indie\b|indie rock|indie pop|shoegaze|dream pop|chamber pop|lo-fi indie/i,
  Folk: /folk\b|bluegrass|americana|singer-songwriter|country\b|acoustic folk|traditional folk/i,
  Classical: /classical|baroque|orchestral|symphony|chamber music|concerto|sonata|opera|choral/i,
  'Lo-Fi': /lo-fi|lofi|chillhop|relaxing beats|study beats/i
};

/**
 * Resolves a list of micro-genres (from Spotify artists) or track metadata
 * into canonical Macro-Genres.
 */
export function resolveMacroGenres(
  rawGenres: string[] = [],
  textFallback: string = ''
): MacroGenre[] {
  const matched = new Set<MacroGenre>();

  // 1. Scan direct artist/album raw genres
  const combinedGenresStr = rawGenres.join(' ').toLowerCase();

  for (const [macro, pattern] of Object.entries(TAXONOMY_RULES) as [MacroGenre, RegExp][]) {
    if (pattern.test(combinedGenresStr)) {
      matched.add(macro);
    }
  }

  // 2. Scan text fallback (title + artist name + album) if no direct match or for hybrid tags
  if (textFallback) {
    const textLower = textFallback.toLowerCase();
    for (const [macro, pattern] of Object.entries(TAXONOMY_RULES) as [MacroGenre, RegExp][]) {
      if (pattern.test(textLower)) {
        matched.add(macro);
      }
    }
  }

  return Array.from(matched);
}

/**
 * Aggregates real track counts for each macro-genre physically present in the library
 */
export function getMacroGenreCounts(tracks: Track[]): Record<MacroGenre, number> {
  const counts: Record<MacroGenre, number> = {
    Ska: 0,
    Reggae: 0,
    Punk: 0,
    Rock: 0,
    Metal: 0,
    Electronic: 0,
    'Hip-Hop': 0,
    Jazz: 0,
    Latin: 0,
    Pop: 0,
    Indie: 0,
    Folk: 0,
    Classical: 0,
    'Lo-Fi': 0
  };

  for (const track of tracks) {
    const macroList =
      track.macro_genres && track.macro_genres.length > 0
        ? track.macro_genres
        : resolveMacroGenres(
            track.genres || (track.genre_vibe ? [track.genre_vibe] : []),
            `${track.name} ${track.artist} ${track.album || ''} ${track.mood_vibe || ''}`
          );

    for (const macro of macroList) {
      if (counts[macro] !== undefined) {
        counts[macro]++;
      }
    }
  }

  return counts;
}

/**
 * Checks whether a track belongs to any of the target macro genres
 */
export function trackMatchesMacroGenres(
  track: Track,
  selectedMacroGenres: string[]
): boolean {
  if (!selectedMacroGenres || selectedMacroGenres.length === 0) return true;

  const cleanSelected = selectedMacroGenres
    .map((g) => g.toLowerCase().trim())
    .filter(Boolean);

  if (
    cleanSelected.length === 0 ||
    cleanSelected.includes('all') ||
    cleanSelected.includes('all genres') ||
    cleanSelected.includes('surprise me')
  ) {
    return true;
  }

  const trackMacros =
    track.macro_genres && track.macro_genres.length > 0
      ? track.macro_genres
      : resolveMacroGenres(
          track.genres || (track.genre_vibe ? [track.genre_vibe] : []),
          `${track.name} ${track.artist} ${track.album || ''} ${track.mood_vibe || ''}`
        );

  const trackMacroLower = trackMacros.map((m) => m.toLowerCase());

  // Check intersection with selected macro genres
  const matchesMacro = cleanSelected.some((sel) => trackMacroLower.includes(sel));
  if (matchesMacro) return true;

  // Fallback to substring match on raw genres / title
  const rawGenre = (track.genre_vibe || '').toLowerCase();
  const trackGenres = (track.genres || []).map((g) => g.toLowerCase()).join(' ');
  const trackName = (track.name || '').toLowerCase();
  const trackArtist = (track.artist || '').toLowerCase();

  return cleanSelected.some((target) => {
    return (
      rawGenre.includes(target) ||
      trackGenres.includes(target) ||
      trackName.includes(target) ||
      trackArtist.includes(target)
    );
  });
}
