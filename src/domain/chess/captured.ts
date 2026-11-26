import { ChessGame } from './ChessGame';
import { PieceType, PieceColor } from './types';

const INITIAL_PIECE_COUNT: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export interface CapturedPiecesState {
  whiteCaptured: PieceType[]; // white pieces captured by black
  blackCaptured: PieceType[]; // black pieces captured by white
  whiteAdvantage: number;
  blackAdvantage: number;
}

export function computeCapturedPieces(game: ChessGame): CapturedPiecesState {
  const board = game.getBoard();
  const currentWhite: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const currentBlack: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      if (piece.color === 'w') {
        currentWhite[piece.type] = (currentWhite[piece.type] || 0) + 1;
      } else {
        currentBlack[piece.type] = (currentBlack[piece.type] || 0) + 1;
      }
    }
  }

  const whiteCaptured: PieceType[] = [];
  const blackCaptured: PieceType[] = [];

  for (const type of ['q', 'r', 'b', 'n', 'p'] as PieceType[]) {
    const wDiff = INITIAL_PIECE_COUNT[type] - (currentWhite[type] || 0);
    for (let i = 0; i < wDiff; i++) whiteCaptured.push(type);

    const bDiff = INITIAL_PIECE_COUNT[type] - (currentBlack[type] || 0);
    for (let i = 0; i < bDiff; i++) blackCaptured.push(type);
  }

  // Calculate material advantages
  let whiteMaterial = 0;
  let blackMaterial = 0;
  for (const p of blackCaptured) whiteMaterial += PIECE_VALUES[p];
  for (const p of whiteCaptured) blackMaterial += PIECE_VALUES[p];

  const diff = whiteMaterial - blackMaterial;

  return {
    whiteCaptured,
    blackCaptured,
    whiteAdvantage: diff > 0 ? diff : 0,
    blackAdvantage: diff < 0 ? Math.abs(diff) : 0,
  };
}
