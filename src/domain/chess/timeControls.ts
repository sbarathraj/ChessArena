import { PieceColor, PieceType } from './types';

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily';

export interface TimeControl {
  category: TimeControlCategory;
  baseSeconds: number;
  incrementSeconds: number;
  label: string;
}

export const STANDARD_TIME_CONTROLS: TimeControl[] = [
  { category: 'bullet', baseSeconds: 60, incrementSeconds: 0, label: '1 min' },
  { category: 'bullet', baseSeconds: 120, incrementSeconds: 1, label: '2+1 min' },
  { category: 'blitz', baseSeconds: 180, incrementSeconds: 0, label: '3 min' },
  { category: 'blitz', baseSeconds: 180, incrementSeconds: 2, label: '3+2 min' },
  { category: 'blitz', baseSeconds: 300, incrementSeconds: 0, label: '5 min' },
  { category: 'blitz', baseSeconds: 300, incrementSeconds: 3, label: '5+3 min' },
  { category: 'rapid', baseSeconds: 600, incrementSeconds: 0, label: '10 min' },
  { category: 'rapid', baseSeconds: 900, incrementSeconds: 10, label: '15+10 min' },
  { category: 'classical', baseSeconds: 1800, incrementSeconds: 0, label: '30 min' },
];

export function formatTimeControl(labelOrTc: string | TimeControl | undefined | null): string {
  if (!labelOrTc) return '10 min';
  const raw = typeof labelOrTc === 'string' ? labelOrTc : labelOrTc.label;
  let cleaned = raw.replace(/\s*(bullet|blitz|rapid|classical|daily)/gi, '').trim();
  cleaned = cleaned.replace(/\s*\+\s*0$/, '');
  if (!cleaned.toLowerCase().includes('min')) {
    cleaned = `${cleaned} min`;
  }
  return cleaned;
}
