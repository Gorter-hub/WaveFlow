import { Track } from '../types';

const ARTISTS_AND_TRACKS = [
  { artist: 'Fred again..', title: 'Danielle (smile on my face)', energy: 78, valence: 65, bpm: 128, vocals: 60, mood: 'euphoric', genre: 'electronic' },
  { artist: 'Bicep', title: 'Glue', energy: 72, valence: 55, bpm: 130, vocals: 15, mood: 'hypnotic', genre: 'breakbeat' },
  { artist: 'RÜFÜS DU SOL', title: 'Innerbloom', energy: 68, valence: 48, bpm: 122, vocals: 45, mood: 'introspective', genre: 'indie dance' },
  { artist: 'Disclosure', title: 'Latch (feat. Sam Smith)', energy: 82, valence: 75, bpm: 122, vocals: 85, mood: 'driving', genre: 'uk garage' },
  { artist: 'Daft Punk', title: 'One More Time', energy: 95, valence: 92, bpm: 123, vocals: 70, mood: 'euphoric', genre: 'french house' },
  { artist: 'Peggy Gou', title: '(It Goes Like) Nanana', energy: 88, valence: 85, bpm: 130, vocals: 65, mood: 'euphoric', genre: 'club' },
  { artist: 'Dom Dolla', title: 'Rhyme Dust', energy: 94, valence: 72, bpm: 128, vocals: 55, mood: 'driving', genre: 'tech house' },
  { artist: 'Fisher', title: 'Losing It', energy: 96, valence: 68, bpm: 125, vocals: 40, mood: 'driving', genre: 'tech house' },
  { artist: 'Lane 8', title: 'Brightest Lights', energy: 54, valence: 62, bpm: 120, vocals: 35, mood: 'ambient', genre: 'melodic deep' },
  { artist: 'Four Tet', title: 'Baby', energy: 64, valence: 70, bpm: 126, vocals: 30, mood: 'hypnotic', genre: 'folktronica' },
  { artist: 'Jamie xx', title: 'Gosh', energy: 76, valence: 52, bpm: 120, vocals: 10, mood: 'introspective', genre: 'electronic' },
  { artist: 'Eric Prydz', title: 'Opus', energy: 92, valence: 80, bpm: 126, vocals: 5, mood: 'cinematic', genre: 'progressive' },
  { artist: 'Bonobo', title: 'Kerala', energy: 58, valence: 60, bpm: 118, vocals: 12, mood: 'hypnotic', genre: 'downtempo' },
  { artist: 'Tycho', title: 'Awake', energy: 42, valence: 65, bpm: 110, vocals: 0, mood: 'ambient', genre: 'ambient' },
  { artist: 'Moderat', title: 'A New Error', energy: 69, valence: 40, bpm: 120, vocals: 5, mood: 'introspective', genre: 'idm' },
  { artist: 'ODESZA', title: 'The Last Goodbye', energy: 75, valence: 78, bpm: 116, vocals: 55, mood: 'cinematic', genre: 'electronic' },
  { artist: 'Deadmau5', title: 'Strobe', energy: 84, valence: 50, bpm: 128, vocals: 0, mood: 'hypnotic', genre: 'progressive' },
  { artist: 'Justice', title: 'Genesis', energy: 93, valence: 58, bpm: 118, vocals: 5, mood: 'driving', genre: 'electro' },
  { artist: 'Boris Brejcha', title: 'Gravity', energy: 86, valence: 45, bpm: 125, vocals: 10, mood: 'driving', genre: 'minimal tech' },
  { artist: 'Tale of Us', title: 'Astral', energy: 73, valence: 38, bpm: 124, vocals: 0, mood: 'introspective', genre: 'afterlife melodic' },
  { artist: 'Anyma', title: 'Eternity', energy: 87, valence: 42, bpm: 125, vocals: 20, mood: 'cinematic', genre: 'afterlife melodic' },
  { artist: 'CamelPhat', title: 'Cola', energy: 83, valence: 71, bpm: 122, vocals: 70, mood: 'driving', genre: 'tech house' },
  { artist: 'Overmono', title: 'Good Lies', energy: 74, valence: 60, bpm: 132, vocals: 35, mood: 'hypnotic', genre: 'uk bass' },
  { artist: 'Jon Hopkins', title: 'Emerald Rush', energy: 80, valence: 46, bpm: 124, vocals: 0, mood: 'hypnotic', genre: 'techno' },
  { artist: 'Tourist', title: 'Elixir', energy: 52, valence: 58, bpm: 118, vocals: 8, mood: 'ambient', genre: 'ambient' },
  { artist: 'Caribou', title: 'Can’t Do Without You', energy: 70, valence: 74, bpm: 128, vocals: 45, mood: 'euphoric', genre: 'indie electronic' },
  { artist: 'Barry Can’t Swim', title: 'Sunsleeper', energy: 66, valence: 82, bpm: 124, vocals: 40, mood: 'euphoric', genre: 'jazzy house' },
  { artist: 'Mall Grab', title: 'Liverpool Street In The Rain', energy: 62, valence: 54, bpm: 128, vocals: 15, mood: 'driving', genre: 'lo-fi house' },
  { artist: 'KAYTRANADA', title: '10%', energy: 67, valence: 77, bpm: 115, vocals: 65, mood: 'groovy', genre: 'r&b dance' },
  { artist: 'Floating Points', title: 'Vocoder', energy: 85, valence: 64, bpm: 133, vocals: 5, mood: 'driving', genre: 'techno' },
  { artist: 'Kiasmos', title: 'Blurred', energy: 48, valence: 50, bpm: 116, vocals: 0, mood: 'ambient', genre: 'minimal neoclassical' },
  { artist: 'Ben Böhmer', title: 'Beyond Beliefs', energy: 56, valence: 63, bpm: 123, vocals: 0, mood: 'hypnotic', genre: 'melodic deep' },
  { artist: 'Maribou State', title: 'Feel Good', energy: 53, valence: 70, bpm: 110, vocals: 30, mood: 'ambient', genre: 'downtempo' },
  { artist: 'Elderbrook', title: 'Numb', energy: 61, valence: 45, bpm: 122, vocals: 70, mood: 'introspective', genre: 'electronic' },
  { artist: 'John Summit', title: 'Where You Are', energy: 90, valence: 84, bpm: 126, vocals: 75, mood: 'euphoric', genre: 'house' },
  { artist: 'The Specials', title: 'A Message to You Rudy', energy: 62, valence: 85, bpm: 114, vocals: 60, mood: 'cadence-lock', genre: 'ska' },
  { artist: 'Madness', title: 'One Step Beyond', energy: 88, valence: 90, bpm: 150, vocals: 30, mood: 'cadence-lock', genre: 'ska' },
  { artist: 'Toots & The Maytals', title: '54-46 Was My Number', energy: 72, valence: 82, bpm: 120, vocals: 80, mood: 'cadence-lock', genre: 'ska reggae' },
  { artist: 'Klangkarussell', title: 'Sonnentanz', energy: 65, valence: 86, bpm: 120, vocals: 5, mood: 'euphoric', genre: 'melodic' },
  { artist: 'Bakermat', title: 'One Day (Vandaag)', energy: 72, valence: 88, bpm: 122, vocals: 35, mood: 'euphoric', genre: 'sax house' }
];

const ALBUM_COVERS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520523839898-50712825e3a7?w=300&h=300&fit=crop&q=80'
];

/**
 * Generates 200 realistic liked tracks enriched with cognitive vectors
 */
export function generateMockLikedTracks(): Track[] {
  const tracks: Track[] = [];

  for (let i = 0; i < 200; i++) {
    const template = ARTISTS_AND_TRACKS[i % ARTISTS_AND_TRACKS.length];
    const variationIndex = Math.floor(i / ARTISTS_AND_TRACKS.length);
    
    let trackName = template.title;
    if (variationIndex === 1) trackName = `${template.title} (Club Mix)`;
    else if (variationIndex === 2) trackName = `${template.title} (VIP Edit)`;
    else if (variationIndex === 3) trackName = `${template.title} (Live at Printworks)`;
    else if (variationIndex === 4) trackName = `${template.title} (Extended Mix)`;

    const baseEnergy = template.energy;
    const energyVariance = (i % 7) - 3;
    const computedEnergy = Math.max(30, Math.min(99, baseEnergy + energyVariance));

    const coverArt = ALBUM_COVERS[i % ALBUM_COVERS.length];

    tracks.push({
      id: `mock-track-${i + 1}`,
      name: trackName,
      artist: template.artist,
      artists: [template.artist],
      album: `${template.artist} Selected Works Vol. ${variationIndex + 1}`,
      albumArt: coverArt,
      duration_ms: (195 + (i % 90)) * 1000, // ~3:15 to ~4:45
      uri: `spotify:track:mock_${i + 1}`,
      energy_score: computedEnergy,
      valence_score: template.valence,
      bpm: template.bpm + ((i % 5) - 2),
      vocal_presence: template.vocals,
      mood_vibe: template.mood,
      genre_vibe: template.genre,
      energy: computedEnergy,
      valence: template.valence,
      preview_url: null
    });
  }

  return tracks;
}
