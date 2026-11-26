import { Chess } from 'chess.js';
import { Square, MoveDetails, GameResult, PieceColor, PieceType } from './types';

/**
 * KnightArena Client Chess Engine Wrapper
 * Wraps chess.js for high-speed client move verification, legal moves calculation,
 * and standard FIDE rule evaluations (Checkmate, Stalemate, 50-move rule, Repetition, Insufficient Material).
 */
export class ChessGame {
  private instance: Chess;

  constructor(fen?: string) {
    this.instance = new Chess(fen);
  }

  public getFen(): string {
    return this.instance.fen();
  }

  public getPgn(): string {
    return this.instance.pgn();
  }

  public getTurn(): PieceColor {
    return this.instance.turn();
  }

  public isCheck(): boolean {
    return this.instance.inCheck();
  }

  public isCheckmate(): boolean {
    return this.instance.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.instance.isStalemate();
  }

  public isDraw(): boolean {
    return this.instance.isDraw();
  }

  public isInsufficientMaterial(): boolean {
    return this.instance.isInsufficientMaterial();
  }

  public isThreefoldRepetition(): boolean {
    return this.instance.isThreefoldRepetition();
  }

  public getBoard(): ({ type: PieceType; color: PieceColor } | null)[][] {
    return this.instance.board();
  }

  public getLegalMoves(square?: Square): MoveDetails[] {
    const rawMoves = this.instance.moves({
      square: square as any,
      verbose: true,
    });

    return rawMoves.map((m) => ({
      from: m.from as Square,
      to: m.to as Square,
      promotion: m.promotion as any,
      san: m.san,
      uci: `${m.from}${m.to}${m.promotion || ''}`,
      fenAfter: m.after,
      captured: m.captured as PieceType | undefined,
      isCheck: m.san.includes('+'),
      isCheckmate: m.san.includes('#'),
    }));
  }

  public makeMove(from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q'): MoveDetails | null {
    try {
      const move = this.instance.move({
        from: from as any,
        to: to as any,
        promotion,
      });

      if (!move) return null;

      return {
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion as any,
        san: move.san,
        uci: `${move.from}${move.to}${move.promotion || ''}`,
        fenAfter: this.instance.fen(),
        captured: move.captured as PieceType | undefined,
        isCheck: this.instance.inCheck(),
        isCheckmate: this.instance.isCheckmate(),
      };
    } catch {
      return null;
    }
  }

  public undo(): boolean {
    return !!this.instance.undo();
  }

  public getGameResult(): GameResult {
    if (this.instance.isCheckmate()) {
      const winner = this.instance.turn() === 'w' ? 'b' : 'w';
      return {
        isOver: true,
        winner,
        termination: 'checkmate',
        description: `${winner === 'w' ? 'White' : 'Black'} won by checkmate.`,
      };
    }

    if (this.instance.isStalemate()) {
      return {
        isOver: true,
        winner: 'draw',
        termination: 'stalemate',
        description: 'Drawn by stalemate.',
      };
    }

    if (this.instance.isThreefoldRepetition()) {
      return {
        isOver: true,
        winner: 'draw',
        termination: 'threefold_repetition',
        description: 'Drawn by threefold repetition.',
      };
    }

    if (this.instance.isInsufficientMaterial()) {
      return {
        isOver: true,
        winner: 'draw',
        termination: 'insufficient_material',
        description: 'Drawn due to insufficient mating material.',
      };
    }

    if (this.instance.isDraw()) {
      return {
        isOver: true,
        winner: 'draw',
        termination: 'fifty_moves',
        description: 'Drawn by 50-move rule.',
      };
    }

    return {
      isOver: false,
      winner: null,
      termination: null,
      description: 'Game in progress.',
    };
  }

  public reset(): void {
    this.instance.reset();
  }

  public load(fen: string): boolean {
    try {
      this.instance.load(fen);
      return true;
    } catch {
      return false;
    }
  }
}
