import { PuzzleService, PUZZLE_CATALOG } from '../src/services/puzzles/PuzzleService';

describe('PuzzleService & Tactical Catalog', () => {
  test('Catalog contains at least 15 verified tactical puzzles', () => {
    expect(PUZZLE_CATALOG.length).toBeGreaterThanOrEqual(15);
    for (const p of PUZZLE_CATALOG) {
      expect(p.id).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.fen).toContain('/');
      expect(p.moves.length).toBeGreaterThan(0);
      expect(p.rating).toBeGreaterThan(500);
      expect(p.themes.length).toBeGreaterThan(0);
      expect(p.pieceSquare).toMatch(/^[a-h][1-8]$/);
      expect(p.targetSquare).toMatch(/^[a-h][1-8]$/);
    }
  });

  test('Puzzle navigation moves forward and backward cyclically', () => {
    const first = PUZZLE_CATALOG[0];
    const second = PuzzleService.getNextPuzzle(first.id);
    expect(second.id).toBe(PUZZLE_CATALOG[1].id);

    const prevOfSecond = PuzzleService.getPrevPuzzle(second.id);
    expect(prevOfSecond.id).toBe(first.id);

    const last = PUZZLE_CATALOG[PUZZLE_CATALOG.length - 1];
    const nextOfLast = PuzzleService.getNextPuzzle(last.id);
    expect(nextOfLast.id).toBe(first.id); // Loops to start

    const prevOfFirst = PuzzleService.getPrevPuzzle(first.id);
    expect(prevOfFirst.id).toBe(last.id); // Loops to end
  });

  test('Random puzzle picker returns valid puzzle', () => {
    const current = PUZZLE_CATALOG[0];
    const random = PuzzleService.getRandomPuzzle(current.id);
    expect(random).toBeDefined();
    expect(random.id).toBeDefined();
  });

  test('Smart hint provides origin square and target destination', () => {
    const puzzle = PUZZLE_CATALOG[0]; // e2e8
    const hint = PuzzleService.getHint(puzzle, 0);
    expect(hint.pieceSquare).toBe('e2');
    expect(hint.targetSquare).toBe('e8');
    expect(hint.hintText).toBeDefined();
  });

  test('verifyMove validates UCI move strings accurately', () => {
    const puzzle = PUZZLE_CATALOG[0];
    const correctMove = puzzle.moves[0];
    expect(PuzzleService.verifyMove(puzzle, 0, correctMove)).toBe(true);
    expect(PuzzleService.verifyMove(puzzle, 0, 'a1a2')).toBe(false);
  });
});
