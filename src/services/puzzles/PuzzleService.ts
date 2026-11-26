import { Square } from '../../domain/chess/types';

export interface PuzzleItem {
  id: string;
  title: string;
  fen: string;
  moves: string[]; // sequence of uci strings (e.g. ['c4f7', 'e8f7', 'd1e2'])
  rating: number;
  themes: string[];
  hint: string;
  pieceSquare: Square;
  targetSquare: Square;
}

export const PUZZLE_CATALOG: PuzzleItem[] = [
  {
    id: 'pz_01',
    title: 'Deflection Back-Rank Decoy',
    fen: '5rk1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
    moves: ['e2e8', 'f8e8', 'e1e8'],
    rating: 1050,
    themes: ['Back Rank', 'Deflection', 'Checkmate'],
    hint: 'Deflect the Black Rook from protecting the 8th rank by offering your Queen on e8.',
    pieceSquare: 'e2',
    targetSquare: 'e8',
  },
  {
    id: 'pz_02',
    title: 'Anastasia Checkmate Outpost',
    fen: '5rk1/1p3ppp/8/3N4/8/8/5PPP/1R4K1 w - - 0 1',
    moves: ['d5e7', 'g8h8', 'b1b7'],
    rating: 1200,
    themes: ['Knight Outpost', 'Tactics'],
    hint: 'Drive the Black King into the corner with a royal check.',
    pieceSquare: 'd5',
    targetSquare: 'e7',
  },
  {
    id: 'pz_03',
    title: 'Two Knights Fork Sacrifice',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
    moves: ['c4f7', 'e8f7', 'd1e2'],
    rating: 1100,
    themes: ['Fork', 'King Hunt', 'Sacrifice'],
    hint: 'Sacrifice the Bishop on f7 to disrupt the Black King and pin the Knight.',
    pieceSquare: 'c4',
    targetSquare: 'f7',
  },
  {
    id: 'pz_04',
    title: 'Discovered Central Strike',
    fen: 'r3kb1r/pp1n1ppp/2p1pn2/q7/2B3b1/2NP1N2/PPPB1PPP/R2Q1RK1 w kq - 0 9',
    moves: ['c3d5', 'a5d8', 'd5f6'],
    rating: 1250,
    themes: ['Discovered Attack', 'Center Control'],
    hint: 'Leap your Knight to d5, uncovering a discovery against the Black Queen on a5.',
    pieceSquare: 'c3',
    targetSquare: 'd5',
  },
  {
    id: 'pz_05',
    title: 'Black Back-Rank Infiltration',
    fen: '4r1k1/4qppp/8/8/8/8/5PPP/3RR1K1 b - - 0 1',
    moves: ['e7e1', 'd1e1', 'e8e1'],
    rating: 1120,
    themes: ['Back Rank', 'Queen Sacrifice', 'Checkmate'],
    hint: 'Smash through on e1 by sacrificing your Queen to force checkmate!',
    pieceSquare: 'e7',
    targetSquare: 'e1',
  },
  {
    id: 'pz_06',
    title: 'Corner King Trap',
    fen: '6k1/R5pp/8/5N2/8/8/5PPP/6K1 w - - 0 1',
    moves: ['a7g7', 'g8h8', 'g7a7'],
    rating: 1180,
    themes: ['7th Rank', 'King Trap'],
    hint: 'Infiltrate on the 7th rank with your Rook to strip the pawn shield.',
    pieceSquare: 'a7',
    targetSquare: 'g7',
  },
  {
    id: 'pz_07',
    title: 'Absolute Pin Extraction',
    fen: 'r3k2r/pppq1ppp/2np1n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 7',
    moves: ['c1g5', 'h7h6', 'g5f6'],
    rating: 1200,
    themes: ['Pin', 'Double Pawns'],
    hint: 'Pin Black’s Knight on f6 to the Queen to compromise their king-side shelter.',
    pieceSquare: 'c1',
    targetSquare: 'g5',
  },
  {
    id: 'pz_08',
    title: 'Rook Infiltration Strike',
    fen: 'r4rk1/5ppp/8/8/8/8/1R3PPP/1R4K1 w - - 0 1',
    moves: ['b2b8', 'a8b8', 'b1b8'],
    rating: 1080,
    themes: ['Battery', 'Back Rank'],
    hint: 'Use your doubled Rooks on the b-file to crash through on the 8th rank.',
    pieceSquare: 'b2',
    targetSquare: 'b8',
  },
  {
    id: 'pz_09',
    title: 'Black Center Liquidation',
    fen: 'r1b1k2r/pp2qppp/2n1pn2/3p4/2PP4/2N2N2/PP2BPPP/R2QK2R b KQkq - 0 9',
    moves: ['d5c4', 'e2c4', 'e8g8'],
    rating: 1100,
    themes: ['Pawn Structure', 'Castling'],
    hint: 'Liquidate the center pawn and prepare safe castling.',
    pieceSquare: 'd5',
    targetSquare: 'c4',
  },
  {
    id: 'pz_10',
    title: 'Heavy Piece Dominance',
    fen: 'r5k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 w - - 0 1',
    moves: ['b2b7', 'a8f8', 'e1e7'],
    rating: 1350,
    themes: ['Seventh Rank', 'Dominance'],
    hint: 'Infiltrate with your Queen on b7, attacking Black’s loose Rook and securing the 7th rank.',
    pieceSquare: 'b2',
    targetSquare: 'b7',
  },
  {
    id: 'pz_11',
    title: 'Overloaded Defender Tactic',
    fen: '2r3k1/5ppp/8/8/8/8/4QPPP/2R3K1 w - - 0 1',
    moves: ['c1c8'],
    rating: 980,
    themes: ['Hanging Piece', 'Back Rank', 'Mate in 1'],
    hint: 'Spot the unprotected Rook on c8 and deliver instant checkmate!',
    pieceSquare: 'c1',
    targetSquare: 'c8',
  },
  {
    id: 'pz_12',
    title: 'Kingside Castle Fortress',
    fen: 'r1b2rk1/pp1n1ppp/1q2pn2/2pp4/1bPP4/1PN1PN2/PB1QBPPP/R3K2R w KQ - 0 9',
    moves: ['e1g1', 'c5d4', 'e3d4'],
    rating: 1240,
    themes: ['Prophylaxis', 'Castling'],
    hint: 'Tuck your King safely away with kingside castling before the central storm.',
    pieceSquare: 'e1',
    targetSquare: 'g1',
  },
  {
    id: 'pz_13',
    title: 'Safe Harbor Evacuation',
    fen: 'r1bqk2r/ppppbppp/2n5/4P3/8/2B2N2/PPP2PPP/R2QKB1R b KQkq - 0 8',
    moves: ['e8g8', 'f1d3', 'd7d6'],
    rating: 1100,
    themes: ['Castling', 'Development'],
    hint: 'Get your King to safety with kingside castling.',
    pieceSquare: 'e8',
    targetSquare: 'g8',
  },
  {
    id: 'pz_14',
    title: 'Center Piece Capture',
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/2NP1N2/PPP1BPPP/R1BQK2R w KQkq - 0 6',
    moves: ['d3e4', 'b4c3', 'b2c3'],
    rating: 1150,
    themes: ['Material Gain', 'Piece Capture'],
    hint: 'Capture the overextended Knight on e4 with your d-pawn.',
    pieceSquare: 'd3',
    targetSquare: 'e4',
  },
  {
    id: 'pz_15',
    title: 'Scholar Mate Execution',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    moves: ['f3f7'],
    rating: 850,
    themes: ['Checkmate', 'Mate in 1'],
    hint: 'Direct your Queen to f7 for an immediate checkmate!',
    pieceSquare: 'f3',
    targetSquare: 'f7',
  },
  {
    id: 'pz_16',
    title: 'Black Queen Central Infiltration',
    fen: 'rnb1k1nr/pppp1ppp/8/4p3/1b1PP2q/8/PPP2PPP/RNBQKBNR b KQkq - 0 4',
    moves: ['h4e4'],
    rating: 950,
    themes: ['Double Check', 'Disruption'],
    hint: 'Grab the free central pawn on e4 with check!',
    pieceSquare: 'h4',
    targetSquare: 'e4',
  },
];

export class PuzzleService {
  /**
   * Retrieves all puzzles in the catalog
   */
  public static getAllPuzzles(): PuzzleItem[] {
    return PUZZLE_CATALOG;
  }

  /**
   * Fetches daily or initial puzzle
   */
  public static async getDailyPuzzle(): Promise<PuzzleItem> {
    return PUZZLE_CATALOG[0];
  }

  /**
   * Retrieves a puzzle by index (0-based)
   */
  public static getPuzzleByIndex(index: number): PuzzleItem {
    const safeIdx = Math.max(0, Math.min(index, PUZZLE_CATALOG.length - 1));
    return PUZZLE_CATALOG[safeIdx];
  }

  /**
   * Retrieves a random puzzle different from the current one
   */
  public static getRandomPuzzle(excludeId?: string): PuzzleItem {
    const filtered = PUZZLE_CATALOG.filter((p) => p.id !== excludeId);
    const pool = filtered.length > 0 ? filtered : PUZZLE_CATALOG;
    const randomIdx = Math.floor(Math.random() * pool.length);
    return pool[randomIdx];
  }

  /**
   * Retrieves the next puzzle in sequence
   */
  public static getNextPuzzle(currentId: string): PuzzleItem {
    const idx = PUZZLE_CATALOG.findIndex((p) => p.id === currentId);
    if (idx === -1 || idx >= PUZZLE_CATALOG.length - 1) {
      return PUZZLE_CATALOG[0]; // Loop back to start
    }
    return PUZZLE_CATALOG[idx + 1];
  }

  /**
   * Retrieves the previous puzzle in sequence
   */
  public static getPrevPuzzle(currentId: string): PuzzleItem {
    const idx = PUZZLE_CATALOG.findIndex((p) => p.id === currentId);
    if (idx <= 0) {
      return PUZZLE_CATALOG[PUZZLE_CATALOG.length - 1]; // Loop to end
    }
    return PUZZLE_CATALOG[idx - 1];
  }

  /**
   * Generates step-by-step smart hints for the puzzle
   */
  public static getHint(
    puzzle: PuzzleItem,
    moveIndex: number
  ): { hintText: string; pieceSquare: Square; targetSquare: Square } {
    const nextUci = puzzle.moves[moveIndex] || puzzle.moves[0];
    const pieceSquare = nextUci.slice(0, 2) as Square;
    const targetSquare = nextUci.slice(2, 4) as Square;

    return {
      hintText: puzzle.hint || `Look for a move starting from ${pieceSquare.toUpperCase()} to ${targetSquare.toUpperCase()}!`,
      pieceSquare,
      targetSquare,
    };
  }

  /**
   * Validates user move attempt against puzzle solution.
   */
  public static verifyMove(
    puzzle: PuzzleItem,
    moveIndex: number,
    uciMove: string
  ): boolean {
    return puzzle.moves[moveIndex]?.toLowerCase() === uciMove.toLowerCase();
  }
}
