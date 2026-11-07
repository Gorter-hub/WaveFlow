import { Track } from '../types';

const ARTISTS_AND_TRACKS = [
  { artist: 'Fred again..', title: 'Danielle (smile on my face)', energy: 78, valence: 65 },
  { artist: 'Bicep', title: 'Glue', energy: 72, valence: 55 },
  { artist: 'RÜFÜS DU SOL', title: 'Innerbloom', energy: 68, valence: 48 },
  { artist: 'Disclosure', title: 'Latch (feat. Sam Smith)', energy: 82, valence: 75 },
  { artist: 'Daft Punk', title: 'One More Time', energy: 95, valence: 92 },
  { artist: 'Peggy Gou', title: '(It Goes Like) Nanana', energy: 88, valence: 85 },
  { artist: 'Dom Dolla', title: 'Rhyme Dust', energy: 94, valence: 72 },
  { artist: 'Fisher', title: 'Losing It', energy: 96, valence: 68 },
  { artist: 'Lane 8', title: 'Brightest Lights', energy: 54, valence: 62 },
  { artist: 'Four Tet', title: 'Baby', energy: 64, valence: 70 },
  { artist: 'Jamie xx', title: 'Gosh', energy: 76, valence: 52 },
  { artist: 'Eric Prydz', title: 'Opus', energy: 92, valence: 80 },
  { artist: 'Bonobo', title: 'Kerala', energy: 58, valence: 60 },
  { artist: 'Tycho', title: 'Awake', energy: 42, valence: 65 },
  { artist: 'Moderat', title: 'A New Error', energy: 69, valence: 40 },
  { artist: 'ODESZA', title: 'The Last Goodbye', energy: 75, valence: 78 },
  { artist: 'Deadmau5', title: 'Strobe', energy: 84, valence: 50 },
  { artist: 'Justice', title: 'Genesis', energy: 93, valence: 58 },
  { artist: 'Boris Brejcha', title: 'Gravity', energy: 86, valence: 45 },
  { artist: 'Tale of Us', title: 'Astral', energy: 73, valence: 38 },
  { artist: 'Anyma', title: 'Eternity', energy: 87, valence: 42 },
  { artist: 'CamelPhat', title: 'Cola', energy: 83, valence: 71 },
  { artist: 'Overmono', title: 'Good Lies', energy: 74, valence: 60 },
  { artist: 'Jon Hopkins', title: 'Emerald Rush', energy: 80, valence: 46 },
  { artist: 'Tourist', title: 'Elixir', energy: 52, valence: 58 },
  { artist: 'Caribou', title: 'Can’t Do Without You', energy: 70, valence: 74 },
  { artist: 'Barry Can’t Swim', title: 'Sunsleeper', energy: 66, valence: 82 },
  { artist: 'Mall Grab', title: 'Liverpool Street In The Rain', energy: 62, valence: 54 },
  { artist: 'KAYTRANADA', title: '10%', energy: 67, valence: 77 },
  { artist: 'Floating Points', title: 'Vocoder', energy: 85, valence: 64 },
  { artist: 'Kiasmos', title: 'Blurred', energy: 48, valence: 50 },
  { artist: 'Ben Böhmer', title: 'Beyond Beliefs', energy: 56, valence: 63 },
  { artist: 'Maribou State', title: 'Feel Good', energy: 53, valence: 70 },
  { artist: 'Elderbrook', title: 'Numb', energy: 61, valence: 45 },
  { artist: 'John Summit', title: 'Where You Are', energy: 90, valence: 84 },
  { artist: 'Gorgon City', title: 'Ready For Your Love', energy: 81, valence: 76 },
  { artist: 'Chris Lake', title: 'Turn Off The Lights', energy: 92, valence: 66 },
  { artist: 'Meduza', title: 'Piece Of Your Heart', energy: 89, valence: 79 },
  { artist: 'Klangkarussell', title: 'Sonnentanz', energy: 65, valence: 86 },
  { artist: 'Bakermat', title: 'One Day (Vandaag)', energy: 72, valence: 88 }
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
 * Generates 200 realistic liked tracks covering all energy spectrums (ambient 30 -> raging climax 99)
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
    else if (variationIndex === 4) trackName = `${template.title} (Acoustic Redux)`;

    // Slight energy variation
    const baseEnergy = template.energy;
    const energyVariance = (i % 7) - 3;
    const computedEnergy = Math.max(30, Math.min(99, baseEnergy + energyVariance));

    // Cover art cycle
    const coverArt = ALBUM_COVERS[i % ALBUM_COVERS.length];

    tracks.push({
      id: `mock-track-${i + 1}`,
      name: trackName,
      artist: template.artist,
      artists: [template.artist],
      album: `${template.artist} Selected Works Vol. ${variationIndex + 1}`,
      albumArt: coverArt,
      duration_ms: (180 + (i % 120)) * 1000, // 3 to 5 minutes
      uri: `spotify:track:mock_${i + 1}`,
      energy: computedEnergy,
      valence: template.valence,
      preview_url: null
    });
  }

  return tracks;
}
