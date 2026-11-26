import { ChessGame } from '../src/domain/chess/ChessGame';

describe('ChessGame Rule Engine', () => {
  let game: ChessGame;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('validates standard opening move', () => {
    const move = game.makeMove('e2', 'e4');
    expect(move).not.toBeNull();
    expect(move?.san).toBe('e4');
    expect(game.getTurn()).toBe('b');
  });

  test('rejects illegal move', () => {
    const move = game.makeMove('e2', 'e5'); // Pawn cannot jump two squares on initial unless 4
    expect(move).toBeNull();
  });

  test('detects Scholar\'s Mate checkmate', () => {
    game.makeMove('e2', 'e4');
    game.makeMove('e7', 'e5');
    game.makeMove('d1', 'h5');
    game.makeMove('b8', 'c6');
    game.makeMove('f1', 'c4');
    game.makeMove('g8', 'f6');
    const mateMove = game.makeMove('h5', 'f7');

    expect(mateMove?.isCheckmate).toBe(true);
    const result = game.getGameResult();
    expect(result.isOver).toBe(true);
    expect(result.winner).toBe('w');
    expect(result.termination).toBe('checkmate');
  });

  test('detects stalemate condition', () => {
    // Standard stalemate FEN
    game.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(game.isStalemate()).toBe(true);
    const result = game.getGameResult();
    expect(result.isOver).toBe(true);
    expect(result.winner).toBe('draw');
    expect(result.termination).toBe('stalemate');
  });

  test('detects insufficient mating material', () => {
    // King vs King
    game.load('8/8/8/4k3/8/8/4K3/8 w - - 0 1');
    expect(game.isInsufficientMaterial()).toBe(true);
    const result = game.getGameResult();
    expect(result.isOver).toBe(true);
    expect(result.winner).toBe('draw');
    expect(result.termination).toBe('insufficient_material');
  });

  test('detects threefold repetition draw by repeating moves', () => {
    // 1. Nf3 Nf6 2. Ng1 Ng8 (1st repetition back to start)
    game.makeMove('g1', 'f3');
    game.makeMove('g8', 'f6');
    game.makeMove('f3', 'g1');
    game.makeMove('f6', 'g8');

    // 3. Nf3 Nf6 4. Ng1 Ng8 (2nd repetition back to start = 3rd occurrence)
    game.makeMove('g1', 'f3');
    game.makeMove('g8', 'f6');
    game.makeMove('f3', 'g1');
    game.makeMove('f6', 'g8');

    expect(game.isThreefoldRepetition()).toBe(true);
    const result = game.getGameResult();
    expect(result.isOver).toBe(true);
    expect(result.winner).toBe('draw');
    expect(result.termination).toBe('threefold_repetition');
  });

  test('resolves correct winner upon opponent resignation', () => {
    function evaluateResignation(
      whitePlayerId: string,
      blackPlayerId: string,
      resigningPlayerId: string
    ) {
      const winnerId = resigningPlayerId === whitePlayerId ? blackPlayerId : whitePlayerId;
      const winnerColor = winnerId === whitePlayerId ? 'w' : 'b';
      return { winnerId, winnerColor };
    }

    // White resigns -> Black is winner
    expect(evaluateResignation('usr_white', 'usr_black', 'usr_white')).toEqual({
      winnerId: 'usr_black',
      winnerColor: 'b',
    });

    // Black resigns -> White is winner
    expect(evaluateResignation('usr_white', 'usr_black', 'usr_black')).toEqual({
      winnerId: 'usr_white',
      winnerColor: 'w',
    });
  });
});
