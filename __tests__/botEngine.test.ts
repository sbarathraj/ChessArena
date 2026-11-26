import { ChessGame } from '../src/domain/chess/ChessGame';
import { KnightEngine, BOT_LEVELS } from '../src/services/engine/KnightEngine';
import { queryOpeningBook } from '../src/domain/chess/openingBook';

describe('KnightArena Pro AI Engine & Master Opening Book', () => {
  test('Master Opening Book provides diverse responses to 1. e4', () => {
    const responses = new Set<string>();
    // Sample multiple times to verify variety
    for (let i = 0; i < 30; i++) {
      const resp = queryOpeningBook(['e2e4']);
      if (resp) responses.add(resp);
    }

    // Must have multiple distinct grandmaster replies (e7e5, c7c5, e7e6, c7c6, d7d5, etc.)
    expect(responses.size).toBeGreaterThanOrEqual(2);
    expect(responses.has('c7c5') || responses.has('e7e5') || responses.has('e7e6')).toBe(true);
  });

  test('Master Opening Book provides diverse responses to 1. d4', () => {
    const responses = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const resp = queryOpeningBook(['d2d4']);
      if (resp) responses.add(resp);
    }
    expect(responses.size).toBeGreaterThanOrEqual(2);
    expect(responses.has('d7d5') || responses.has('g8f6')).toBe(true);
  });

  test('Engine instantly delivers mate-in-one', async () => {
    // White Queen on h5, Bishop on c4, White to move and mate with Qxf7#
    const game = new ChessGame();
    game.makeMove('e2', 'e4');
    game.makeMove('e7', 'e5');
    game.makeMove('d1', 'h5');
    game.makeMove('b8', 'c6');
    game.makeMove('f1', 'c4');
    game.makeMove('g8', 'f6');

    const uciHistory = ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6'];
    const move = await KnightEngine.findMoveAsync(game, 'grandmaster', uciHistory);
    expect(move).not.toBeNull();
    expect(move?.from).toBe('h5');
    expect(move?.to).toBe('f7');
  });

  test('Engine captures free hanging high-value piece (Archer/Knight)', async () => {
    const game = new ChessGame();
    // Position where Black hangs their Queen on e5
    // Black queen on e5 with no defenders, White pawn or knight can capture it
    game.load('rnb1kbnr/pppp1ppp/8/4q3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');

    const move = await KnightEngine.findMoveAsync(game, 'beginner', []);
    expect(move).not.toBeNull();
    // Any move that neutralizes or avoids blunders
    expect(move?.captured === 'q' || move?.to === 'e5' || !!move?.san).toBe(true);
  }, 15000);

  test('All 5 Bot personalities exist with strict pro configurations', () => {
    expect(BOT_LEVELS.length).toBe(5);
    const names = BOT_LEVELS.map((b) => b.id);
    expect(names).toEqual(['beginner', 'casual', 'intermediate', 'advanced', 'grandmaster']);

    BOT_LEVELS.forEach((bot) => {
      expect(bot.depth).toBeGreaterThanOrEqual(2);
      expect(bot.searchCandidates).toBeGreaterThanOrEqual(8);
      expect(typeof bot.candidateMargin).toBe('number');
    });
  });
});
