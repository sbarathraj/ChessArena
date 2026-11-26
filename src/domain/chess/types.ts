export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type Square =
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

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

export interface MoveDetails {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
  uci: string;
  fenAfter: string;
  captured?: PieceType;
  isCheck: boolean;
  isCheckmate: boolean;
}

export type GameTermination =
  | 'checkmate'
  | 'stalemate'
  | 'threefold_repetition'
  | 'fifty_moves'
  | 'insufficient_material'
  | 'resignation'
  | 'timeout'
  | 'draw_agreement'
  | 'abandoned'
  | 'abandonment'
  | 'time_forfeit';

export interface GameResult {
  isOver: boolean;
  winner: PieceColor | 'draw' | null;
  termination: GameTermination | null;
  description: string;
}
