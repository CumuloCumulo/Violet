export type Gender = 'male' | 'female' | 'non_binary' | string | null;

const AURA_FEMALE: [string, string][] = [
  ['#fecfef', '#ff9a9e'],
  ['#fbc2eb', '#a6c1ee'],
  ['#fecfef', '#a6c1ee'],
];

const AURA_MALE: [string, string][] = [
  ['#a1c4fd', '#c2e9fb'],
  ['#d4eda4', '#a1c4fd'],
  ['#d4eda4', '#c2e9fb'],
];

const AURA_OTHER: [string, string][] = [
  ['#c2e9fb', '#d4eda4'],
  ['#a6c1ee', '#c2e9fb'],
  ['#d4eda4', '#fbc2eb'],
];

export function genderLabel(gender: Gender): string {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  if (gender === 'non_binary') return '非二元';
  return '?';
}

export function genderPickerLabel(gender: Gender): string {
  if (gender === 'male') return '男生';
  if (gender === 'female') return '女生';
  if (gender === 'non_binary') return '非二元';
  return '?';
}

export function genderIcon(gender: Gender): string {
  if (gender === 'male') return '♂';
  if (gender === 'female') return '♀';
  if (gender === 'non_binary') return '◯';
  return '?';
}

export function genderTagStyle(gender: Gender): { background: string; color: string } {
  if (gender === 'male') return { background: 'rgba(140,160,255,0.15)', color: '#6b82f0' };
  if (gender === 'female') return { background: 'rgba(196,125,142,0.15)', color: '#c47d8e' };
  if (gender === 'non_binary') return { background: 'rgba(160,180,220,0.15)', color: '#7a82a8' };
  return { background: 'rgba(158,152,170,0.15)', color: '#9e98aa' };
}

export function getAuraGradient(userId: string, gender: Gender): [string, string] {
  const pool = gender === 'female' ? AURA_FEMALE : gender === 'male' ? AURA_MALE : AURA_OTHER;
  return pool[userId.charCodeAt(userId.length - 1) % pool.length];
}
