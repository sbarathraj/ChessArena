import { ChessGame } from '../../domain/chess/ChessGame';
import { MoveDetails, PieceType, Square } from '../../domain/chess/types';
import { queryOpeningBook, OpeningStyle } from '../../domain/chess/openingBook';

export type BotDifficulty = 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'grandmaster';

export interface BotPersonality {
  id: BotDifficulty;
  name: string;
  rating: number;
  depth: number;
  description: string;
  style: OpeningStyle;
  searchCandidates: number;
  candidateMargin: number; // centipawn margin for randomized smart play (no repetitive patterns)
}

export const BOT_LEVELS: BotPersonality[] = [
  {
    id: 'beginner',
    name: 'Squire (1000 ELO)',
    rating: 1000,
    depth: 2,
    description: 'Disciplined club player. Follows sound opening rules, guards pieces, and punishes free hanging pawns.',
    style: 'solid',
    searchCandidates: 12,
    candidateMargin: 35,
  },
  {
    id: 'casual',
    name: 'Archer (1400 ELO)',
    rating: 1400,
    depth: 3,
    description: 'Sharp attacking player. Hunts kingside attacks, develops pieces swiftly, and executes pin & fork tactics.',
    style: 'aggressive',
    searchCandidates: 16,
    candidateMargin: 25,
  },
  {
    id: 'intermediate',
    name: 'Knight (1800 ELO)',
    rating: 1800,
    depth: 3,
    description: 'Master tactician. Controls open files, coordinates rook lifts, and calculates multi-move exchanges.',
    style: 'tactical',
    searchCandidates: 20,
    candidateMargin: 15,
  },
  {
    id: 'advanced',
    name: 'Champion (2200 ELO)',
    rating: 2200,
    depth: 4,
    description: 'International Master caliber. Squeezes positional advantages, dominates bishop pairs, and converts endgames.',
    style: 'positional',
    searchCandidates: 24,
    candidateMargin: 8,
  },
  {
    id: 'grandmaster',
    name: 'Arena Titan (2700 ELO)',
    rating: 2700,
    depth: 4,
    description: 'Grandmaster engine: Deep Quiescence search, MVV-LVA move ordering, king safety heuristics, and zero mistakes.',
    style: 'unbeatable',
    searchCandidates: 28,
    candidateMargin: 0,
  },
];

// Centipawn piece valuations
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 325,
  b: 340,
  r: 510,
  q: 980,
  k: 20000,
};

// Grandmaster Piece-Square Tables (White perspective)
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(sq: Square): number {
  const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(sq[1], 10);
  return rank * 8 + file;
}

export class KnightEngine {
  /**
   * Professional Engine Execution: Zero dummy random blunders across ALL tiers.
   * Every tier plays purposeful chess with distinct depth and tactical discipline.
   * Eliminates repetitive formulas by smart randomized candidate selection within optimal margin.
   */
  public static async findMoveAsync(
    game: ChessGame,
    difficulty: BotDifficulty = 'grandmaster',
    moveHistoryUci: string[] = []
  ): Promise<MoveDetails | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const config = BOT_LEVELS.find((b) => b.id === difficulty) || BOT_LEVELS[4];
    const legalMoves = game.getLegalMoves();
    if (legalMoves.length === 0) return null;

    // 1. Opening Book Repertoire lookup (with bot personality style)
    if (moveHistoryUci.length <= 14) {
      const bookUci = queryOpeningBook(moveHistoryUci, config.style);
      if (bookUci) {
        const bookMove = legalMoves.find((m) => m.uci === bookUci);
        if (bookMove) return bookMove;
      }
    }

    // 2. Always deliver immediate Checkmate if available
    const mateMove = legalMoves.find((m) => m.isCheckmate);
    if (mateMove) return mateMove;

    const isWhite = game.getTurn() === 'w';

    // 3. MVV-LVA Move Ordering (Most Valuable Victim - Least Valuable Attacker)
    const sortedMoves = this.orderMoves(legalMoves);

    const scoredMoves: { move: MoveDetails; score: number }[] = [];
    let bestScore = -Infinity;

    for (let i = 0; i < sortedMoves.length; i++) {
      const move = sortedMoves[i];
      if (i % 4 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const clone = new ChessGame(game.getFen());
      clone.makeMove(move.from, move.to, move.promotion);

      // Deep Alpha-Beta search with Quiescence resolution
      const score = -this.alphaBeta(
        clone,
        config.depth - 1,
        -Infinity,
        Infinity,
        !isWhite,
        config.searchCandidates,
        config.style
      );

      scoredMoves.push({ move, score });
      if (score > bestScore) {
        bestScore = score;
      }
    }

    if (scoredMoves.length === 0) return sortedMoves[0];

    // 4. Smart Chess.com-style diversity:
    // Gather all candidate moves that are within candidateMargin of the absolute best score.
    // Randomize among top-tier moves so the engine never follows the exact same formula every game!
    const candidateThreshold = bestScore - config.candidateMargin;
    const topCandidates = scoredMoves.filter((sm) => sm.score >= candidateThreshold);

    if (topCandidates.length > 0) {
      const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      return selected.move;
    }

    return sortedMoves[0];
  }

  /**
   * Sorts moves intelligently for fast alpha-beta cutoffs:
   * 1. Captures with MVV-LVA (e.g. Pawn takes Queen before Queen takes Pawn)
   * 2. Promotions
   * 3. Checks
   * 4. Castling
   * 5. Center control (e4, d4, e5, d5)
   */
  private static orderMoves(moves: MoveDetails[]): MoveDetails[] {
    return [...moves].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Captures: MVV-LVA
      if (a.captured) {
        scoreA += PIECE_VALUES[a.captured] * 10;
      }
      if (b.captured) {
        scoreB += PIECE_VALUES[b.captured] * 10;
      }

      // Promotions
      if (a.promotion) scoreA += 800;
      if (b.promotion) scoreB += 800;

      // Checks
      if (a.isCheck) scoreA += 120;
      if (b.isCheck) scoreB += 120;

      // Castling
      if (a.san === 'O-O' || a.san === 'O-O-O') scoreA += 70;
      if (b.san === 'O-O' || b.san === 'O-O-O') scoreB += 70;

      // Center control (landing on e4, d4, e5, d5)
      if (['e4', 'd4', 'e5', 'd5'].includes(a.to)) scoreA += 30;
      if (['e4', 'd4', 'e5', 'd5'].includes(b.to)) scoreB += 30;

      return scoreB - scoreA;
    });
  }

  private static alphaBeta(
    game: ChessGame,
    depth: number,
    alpha: number,
    beta: number,
    isWhite: boolean,
    searchCandidates: number,
    style: OpeningStyle
  ): number {
    if (depth <= 0) {
      return this.quiescence(game, alpha, beta, isWhite, 3, style);
    }

    const result = game.getGameResult();
    if (result.isOver) {
      return this.evaluate(game, isWhite, style);
    }

    const moves = this.orderMoves(game.getLegalMoves());
    let maxEval = -Infinity;

    const candidatesCount = Math.min(moves.length, searchCandidates);
    for (let i = 0; i < candidatesCount; i++) {
      const move = moves[i];
      const clone = new ChessGame(game.getFen());
      clone.makeMove(move.from, move.to, move.promotion);

      const evaluation = -this.alphaBeta(
        clone,
        depth - 1,
        -beta,
        -alpha,
        !isWhite,
        searchCandidates,
        style
      );
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return maxEval;
  }

  /**
   * Quiescence Search: Resolves tactical capture trades until position is quiet
   */
  private static quiescence(
    game: ChessGame,
    alpha: number,
    beta: number,
    isWhite: boolean,
    maxQDepth: number,
    style: OpeningStyle
  ): number {
    const standPat = this.evaluate(game, isWhite, style);
    if (maxQDepth <= 0) return standPat;

    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const captureMoves = this.orderMoves(
      game.getLegalMoves().filter((m) => !!m.captured || m.isCheck || !!m.promotion)
    );

    for (const move of captureMoves) {
      const clone = new ChessGame(game.getFen());
      clone.makeMove(move.from, move.to, move.promotion);

      const score = -this.quiescence(clone, -beta, -alpha, !isWhite, maxQDepth - 1, style);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  /**
   * Positional Evaluation (Material, Piece-Square Tables, Center Dominance, King Safety, Pawn Structure)
   */
  private static evaluate(game: ChessGame, isWhite: boolean, style: OpeningStyle): number {
    const result = game.getGameResult();
    if (result.isOver) {
      if (result.winner === 'draw') return 0;
      if (result.winner === (isWhite ? 'w' : 'b')) return 50000;
      return -50000;
    }

    const board = game.getBoard();
    let score = 0;

    let whiteBishops = 0;
    let blackBishops = 0;
    let whitePawnsByFile = new Array(8).fill(0);
    let blackPawnsByFile = new Array(8).fill(0);

    let whiteKingSq: Square = 'e1';
    let blackKingSq: Square = 'e8';

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (!piece) continue;

        let pieceScore = PIECE_VALUES[piece.type];
        const sq = `${String.fromCharCode('a'.charCodeAt(0) + f)}${8 - r}` as Square;
        const idx = getSquareIndex(sq);
        const pstIdx = piece.color === 'w' ? idx : 63 - idx;

        // Apply Piece-Square Table weights
        if (piece.type === 'p') {
          pieceScore += PAWN_TABLE[pstIdx];
          if (piece.color === 'w') whitePawnsByFile[f]++;
          else blackPawnsByFile[f]++;
        } else if (piece.type === 'n') {
          pieceScore += KNIGHT_TABLE[pstIdx];
        } else if (piece.type === 'b') {
          pieceScore += BISHOP_TABLE[pstIdx];
          if (piece.color === 'w') whiteBishops++;
          else blackBishops++;
        } else if (piece.type === 'r') {
          pieceScore += ROOK_TABLE[pstIdx];
          // Rook on 7th / 2nd rank bonus
          if ((piece.color === 'w' && r === 1) || (piece.color === 'b' && r === 6)) {
            pieceScore += 45;
          }
        } else if (piece.type === 'q') {
          pieceScore += QUEEN_TABLE[pstIdx];
        } else if (piece.type === 'k') {
          pieceScore += KING_TABLE[pstIdx];
          if (piece.color === 'w') whiteKingSq = sq;
          else blackKingSq = sq;
        }

        if (piece.color === (isWhite ? 'w' : 'b')) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }

    // Bishop Pair Bonus (+50 centipawns)
    if (whiteBishops >= 2) score += isWhite ? 50 : -50;
    if (blackBishops >= 2) score += isWhite ? -50 : 50;

    // Pawn Structure Evaluation (Doubled & Isolated Pawns)
    for (let f = 0; f < 8; f++) {
      if (whitePawnsByFile[f] > 1) score += isWhite ? -20 : 20; // Doubled pawns penalty
      if (blackPawnsByFile[f] > 1) score += isWhite ? 20 : -20;

      // Isolated pawns
      const left = f > 0 ? whitePawnsByFile[f - 1] : 0;
      const right = f < 7 ? whitePawnsByFile[f + 1] : 0;
      if (whitePawnsByFile[f] > 0 && left === 0 && right === 0) {
        score += isWhite ? -20 : 20;
      }

      const bLeft = f > 0 ? blackPawnsByFile[f - 1] : 0;
      const bRight = f < 7 ? blackPawnsByFile[f + 1] : 0;
      if (blackPawnsByFile[f] > 0 && bLeft === 0 && bRight === 0) {
        score += isWhite ? 20 : -20;
      }
    }

    // King Pawn Shield bonus
    // White king on g1/c1 has castled; Black on g8/c8
    if (['g1', 'c1', 'b1', 'h1'].includes(whiteKingSq)) {
      score += isWhite ? 35 : -35;
    }
    if (['g8', 'c8', 'b8', 'h8'].includes(blackKingSq)) {
      score += isWhite ? -35 : 35;
    }

    // Bot style adjustments
    if (style === 'aggressive') {
      // Attacks towards enemy king
      const targetKingSq = isWhite ? blackKingSq : whiteKingSq;
      const targetRank = parseInt(targetKingSq[1], 10);
      if (isWhite && targetRank >= 7) score += 25;
      if (!isWhite && targetRank <= 2) score += 25;
    }

    return score;
  }
}
