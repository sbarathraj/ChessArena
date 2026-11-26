/**
 * Glicko-2 Rating Engine Implementation
 * Follows Mark E. Glickman's Glicko-2 specifications.
 * All operations are pure and testable.
 */

export interface GlickoPlayer {
  rating: number;      // r (e.g. 1500)
  rd: number;          // RD rating deviation (e.g. 350 for unrated, 50-100 for active)
  volatility: number;  // sigma (e.g. 0.06)
}

export interface GlickoMatchResult {
  opponent: GlickoPlayer;
  score: number; // 1.0 = win, 0.5 = draw, 0.0 = loss
}

const SCALE = 173.7178;
const TAU = 0.5; // System constant constraining volatility change over time
const EPSILON = 0.000001;

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function E(mu: number, mu_j: number, phi_j: number): number {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
}

export class Glicko2 {
  /**
   * Updates player's rating, deviation, and volatility after a single match or rating period.
   */
  public static calculateNewRating(
    player: GlickoPlayer,
    match: GlickoMatchResult
  ): GlickoPlayer {
    // Step 2: Convert to Glicko-2 scale
    const mu = (player.rating - 1500) / SCALE;
    const phi = player.rd / SCALE;
    const sigma = player.volatility;

    const mu_j = (match.opponent.rating - 1500) / SCALE;
    const phi_j = match.opponent.rd / SCALE;
    const score = match.score;

    // Step 3: Compute variance v
    const g_phi = g(phi_j);
    const e_val = E(mu, mu_j, phi_j);
    const v = 1 / (g_phi * g_phi * e_val * (1 - e_val));

    // Step 4: Compute Delta
    const delta = v * g_phi * (score - e_val);

    // Step 5: Determine new volatility sigma_prime via Illinois algorithm
    const a = Math.log(sigma * sigma);
    const f = (x: number): number => {
      const exp_x = Math.exp(x);
      const phi_sq = phi * phi;
      const d_sq = delta * delta;
      const num1 = exp_x * (d_sq - phi_sq - v - exp_x);
      const den1 = 2 * Math.pow(phi_sq + v + exp_x, 2);
      const term2 = (x - a) / (TAU * TAU);
      return num1 / den1 - term2;
    };

    let A = a;
    let B: number;
    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v);
    } else {
      let k = 1;
      while (f(a - k * TAU) < 0) {
        k++;
      }
      B = a - k * TAU;
    }

    let f_A = f(A);
    let f_B = f(B);

    while (Math.abs(B - A) > EPSILON) {
      const C = A + ((A - B) * f_A) / (f_B - f_A);
      const f_C = f(C);
      if (f_C * f_B < 0) {
        A = B;
        f_A = f_B;
      } else {
        f_A = f_A / 2;
      }
      B = C;
      f_B = f_C;
    }

    const sigma_prime = Math.exp(A / 2);

    // Step 6: Update rating deviation to pre-rating period value phi_star
    const phi_star = Math.sqrt(phi * phi + sigma_prime * sigma_prime);

    // Step 7: Update rating and RD to new values
    const phi_prime = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v);
    const mu_prime = mu + phi_prime * phi_prime * g_phi * (score - e_val);

    // Step 8: Convert back to Glicko scale
    return {
      rating: Math.round((mu_prime * SCALE + 1500) * 10) / 10,
      rd: Math.max(30, Math.min(350, Math.round((phi_prime * SCALE) * 10) / 10)),
      volatility: Math.round(sigma_prime * 1000000) / 1000000,
    };
  }
}
