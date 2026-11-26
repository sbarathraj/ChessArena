import { Glicko2, GlickoPlayer } from '../src/domain/ratings/Glicko2';

describe('Glicko2 Rating Engine', () => {
  test('updates rating accurately when a player wins against equal opponent', () => {
    const player: GlickoPlayer = { rating: 1500, rd: 200, volatility: 0.06 };
    const opponent: GlickoPlayer = { rating: 1500, rd: 200, volatility: 0.06 };

    const result = Glicko2.calculateNewRating(player, {
      opponent,
      score: 1.0, // Win
    });

    expect(result.rating).toBeGreaterThan(1500);
    expect(result.rd).toBeLessThan(200); // Confidence increases, RD shrinks
  });

  test('updates rating downwards when losing against lower rated opponent', () => {
    const player: GlickoPlayer = { rating: 1600, rd: 100, volatility: 0.06 };
    const opponent: GlickoPlayer = { rating: 1400, rd: 100, volatility: 0.06 };

    const result = Glicko2.calculateNewRating(player, {
      opponent,
      score: 0.0, // Loss
    });

    expect(result.rating).toBeLessThan(1600);
  });
});
