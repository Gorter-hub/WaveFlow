export function formatDuration(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getEnergyColor(energy?: number): {
  text: string;
  bg: string;
  border: string;
  accent: string;
} {
  if (energy === undefined) {
    return {
      text: 'text-zinc-400',
      bg: 'bg-zinc-800/60',
      border: 'border-zinc-700/50',
      accent: '#71717a'
    };
  }

  if (energy < 40) {
    // Ambient / Chill
    return {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      accent: '#38bdf8'
    };
  } else if (energy < 60) {
    // Warm-up / Groove
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      accent: '#34d399'
    };
  } else if (energy < 80) {
    // Build-up / Driving
    return {
      text: 'text-spotify',
      bg: 'bg-spotify/10',
      border: 'border-spotify/30',
      accent: '#1DB954'
    };
  } else if (energy < 90) {
    // Peak / High
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      accent: '#fbbf24'
    };
  } else {
    // Climax / Maximum
    return {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      accent: '#f43f5e'
    };
  }
}

export function getPhaseBadgeColor(phase?: string): string {
  switch (phase) {
    case 'Warm-up':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Build-up':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'Peak':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Valley/Respiro':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'Climax':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    case 'Outro':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}
