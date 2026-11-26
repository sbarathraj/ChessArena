// ============================================================================
// KnightArena Master Opening Book (ECO - Encyclopedia of Chess Openings)
// Contains 50+ grandmaster opening repertoires for White and Black
// Prevents repetitive patterns and delivers Chess.com-style opening variety
// ============================================================================

export type OpeningStyle = 'solid' | 'aggressive' | 'tactical' | 'positional' | 'unbeatable';

export interface OpeningVariation {
  name: string;
  eco: string;
  styles: OpeningStyle[];
  moves: string[]; // sequence of UCI move strings (e.g. 'e2e4', 'e7e5')
}

export const MASTER_OPENING_BOOK: OpeningVariation[] = [
  // --------------------------------------------------------------------------
  // 1. KING'S PAWN OPENINGS (1. e4 e5)
  // --------------------------------------------------------------------------
  {
    name: "Ruy Lopez (Morphy Defense - Closed)",
    eco: "C84",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6"],
  },
  {
    name: "Ruy Lopez (Berlin Defense)",
    eco: "C65",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "g8f6", "e1g1", "f6e4", "d2d4", "e4d6", "b5c6", "d7c6", "d4e5", "d6f5"],
  },
  {
    name: "Ruy Lopez (Exchange Variation)",
    eco: "C68",
    styles: ['solid', 'tactical'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5c6", "d7c6", "e1g1", "f7f6", "d2d4", "e5d4"],
  },
  {
    name: "Italian Game (Giuoco Piano - Main Line)",
    eco: "C50",
    styles: ['solid', 'positional'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "c2c3", "g8f6", "d2d3", "d7d6", "e1g1", "e8g8"],
  },
  {
    name: "Italian Game (Two Knights Defense)",
    eco: "C57",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "d2d4", "e5d4", "e1g1", "f6e4", "f1e1", "d7d5"],
  },
  {
    name: "Italian Game (Evans Gambit)",
    eco: "C51",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "b2b4", "c5b4", "c2c3", "b4a5", "d2d4", "e5d4"],
  },
  {
    name: "Scotch Game (Mieses Variation)",
    eco: "C45",
    styles: ['tactical', 'aggressive', 'positional'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4", "f3d4", "g8f6", "d4c6", "b7c6", "e4e5", "d8e7"],
  },
  {
    name: "King's Gambit (Accepted)",
    eco: "C34",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "e7e5", "f2f4", "e5f4", "g1f3", "g7g5", "h2h4", "g5g4", "f3e5", "g8f6"],
  },
  {
    name: "Vienna Game (Max Lange Defense)",
    eco: "C26",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "e7e5", "b1c3", "g8f6", "f1c4", "f8c5", "d2d3", "c7c6", "g1f3", "d7d6"],
  },
  {
    name: "Four Knights Game (Spanish Variation)",
    eco: "C48",
    styles: ['solid', 'positional'],
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "b1c3", "g8f6", "f1b5", "f8b4", "e1g1", "e8g8"],
  },
  {
    name: "Petroff / Russian Defense (Classical)",
    eco: "C42",
    styles: ['solid', 'unbeatable'],
    moves: ["e2e4", "e7e5", "g1f3", "g8f6", "f3e5", "d7d6", "e5f3", "f6e4", "d2d4", "d6d5", "f1d3", "f8e7"],
  },

  // --------------------------------------------------------------------------
  // 2. SICILIAN DEFENSE (1. e4 c5)
  // --------------------------------------------------------------------------
  {
    name: "Sicilian Defense (Najdorf Variation)",
    eco: "B90",
    styles: ['tactical', 'aggressive', 'unbeatable'],
    moves: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "a7a6", "c1e3", "e7e5", "d4b3", "c8e6"],
  },
  {
    name: "Sicilian Defense (Dragon Variation - Yugoslav Attack)",
    eco: "B77",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "g7g6", "c1e3", "f8g7", "f2f3", "e8g8", "d1d2", "b8c6"],
  },
  {
    name: "Sicilian Defense (Classical Variation)",
    eco: "B58",
    styles: ['tactical', 'positional'],
    moves: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "b8c6", "f1e2", "e7e5"],
  },
  {
    name: "Sicilian Defense (Alapin Variation)",
    eco: "B22",
    styles: ['solid', 'positional'],
    moves: ["e2e4", "c7c5", "c2c3", "d7d5", "e4d5", "d8d5", "d2d4", "g8f6", "g1f3", "e7e6"],
  },
  {
    name: "Sicilian Defense (Closed Sicilian)",
    eco: "B23",
    styles: ['positional', 'solid'],
    moves: ["e2e4", "c7c5", "b1c3", "b8c6", "g2g3", "g7g6", "f1g2", "f8g7", "d2d3", "d7d6"],
  },
  {
    name: "Sicilian Defense (Smith-Morra Gambit)",
    eco: "B21",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "c7c5", "d2d4", "c5d4", "c2c3", "d4c3", "b1c3", "b8c6", "g1f3", "d7d6"],
  },

  // --------------------------------------------------------------------------
  // 3. FRENCH & CARO-KANN DEFENSES
  // --------------------------------------------------------------------------
  {
    name: "French Defense (Winawer Variation)",
    eco: "C15",
    styles: ['tactical', 'unbeatable'],
    moves: ["e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "f8b4", "e4e5", "c7c5", "a2a3", "b4c3", "b2c3", "g8e7"],
  },
  {
    name: "French Defense (Tarrasch Variation)",
    eco: "C07",
    styles: ['solid', 'positional'],
    moves: ["e2e4", "e7e6", "d2d4", "d7d5", "b1d2", "c7c5", "e4d5", "e6d5", "g1f3", "g8f6"],
  },
  {
    name: "French Defense (Advance Variation)",
    eco: "C02",
    styles: ['positional', 'solid'],
    moves: ["e2e4", "e7e6", "d2d4", "d7d5", "e4e5", "c7c5", "c2c3", "b8c6", "g1f3", "d8b6"],
  },
  {
    name: "Caro-Kann Defense (Advance Variation)",
    eco: "B12",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["e2e4", "c7c6", "d2d4", "d7d5", "e4e5", "c8f5", "g1f3", "e7e6", "f1e2", "c6c5", "c1e3", "b8c6"],
  },
  {
    name: "Caro-Kann Defense (Classical Variation)",
    eco: "B18",
    styles: ['solid', 'unbeatable'],
    moves: ["e2e4", "c7c6", "d2d4", "d7d5", "b1c3", "d5e4", "c3e4", "c8f5", "e4g3", "f5g6", "h2h4", "h7h6"],
  },

  // --------------------------------------------------------------------------
  // 4. OTHER 1. e4 RESPONSES
  // --------------------------------------------------------------------------
  {
    name: "Scandinavian Defense (Modern Variation)",
    eco: "B01",
    styles: ['tactical', 'aggressive'],
    moves: ["e2e4", "d7d5", "e4d5", "g8f6", "d2d4", "f6d5", "c2c4", "d5b6", "g1f3", "g7g6"],
  },
  {
    name: "Scandinavian Defense (Main Line)",
    eco: "B01",
    styles: ['solid', 'tactical'],
    moves: ["e2e4", "d7d5", "e4d5", "d8d5", "b1c3", "d5a5", "d2d4", "g8f6", "g1f3", "c7c6"],
  },
  {
    name: "Pirc Defense (Austrian Attack)",
    eco: "B09",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "d7d6", "d2d4", "g8f6", "b1c3", "g7g6", "f2f4", "f8g7", "g1f3", "e8g8"],
  },
  {
    name: "Alekhine's Defense (Modern Variation)",
    eco: "B04",
    styles: ['aggressive', 'tactical'],
    moves: ["e2e4", "g8f6", "e4e5", "f6d5", "d2d4", "d7d6", "g1f3", "g7g6", "f1c4", "d5b6"],
  },

  // --------------------------------------------------------------------------
  // 5. QUEEN'S PAWN OPENINGS (1. d4 d5)
  // --------------------------------------------------------------------------
  {
    name: "Queen's Gambit Declined (Tartakower Defense)",
    eco: "D58",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6", "c1g5", "f8e7", "e2e3", "h7h6", "g5h4", "e8g8", "g1f3", "b7b6"],
  },
  {
    name: "Queen's Gambit Accepted",
    eco: "D20",
    styles: ['solid', 'tactical'],
    moves: ["d2d4", "d7d5", "c2c4", "d5c4", "g1f3", "g8f6", "e2e3", "e7e6", "f1c4", "c7c5", "e1g1", "a7a6"],
  },
  {
    name: "Slav Defense (Main Line)",
    eco: "D15",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["d2d4", "d7d5", "c2c4", "c7c6", "g1f3", "g8f6", "b1c3", "d5c4", "a2a4", "c8f5", "e2e3", "e7e6"],
  },
  {
    name: "Semi-Slav Defense (Meran Variation)",
    eco: "D45",
    styles: ['tactical', 'unbeatable'],
    moves: ["d2d4", "d7d5", "c2c4", "c7c6", "g1f3", "g8f6", "b1c3", "e7e6", "e2e3", "b8d7", "f1d3", "d5c4", "d3c4", "b7b5"],
  },
  {
    name: "London System (vs 1... d5)",
    eco: "D00",
    styles: ['solid', 'positional'],
    moves: ["d2d4", "d7d5", "c1f4", "g8f6", "e2e3", "c7c5", "c2c3", "b8c6", "b1d2", "e7e6", "g1f3", "f8d6"],
  },
  {
    name: "London System (vs 1... Nf6)",
    eco: "A46",
    styles: ['solid', 'positional'],
    moves: ["d2d4", "g8f6", "g1f3", "e7e6", "c1f4", "c7c5", "e2e3", "b7b6", "b1d2", "c8b7"],
  },
  {
    name: "Catalan Opening (Closed)",
    eco: "E06",
    styles: ['positional', 'unbeatable'],
    moves: ["d2d4", "d7d5", "c2c4", "e7e6", "g1f3", "g8f6", "g2g3", "f8e7", "f1g2", "e8g8", "e1g1", "b8d7"],
  },

  // --------------------------------------------------------------------------
  // 6. INDIAN DEFENSES (1. d4 Nf6)
  // --------------------------------------------------------------------------
  {
    name: "King's Indian Defense (Mar del Plata Variation)",
    eco: "E97",
    styles: ['aggressive', 'tactical', 'unbeatable'],
    moves: ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7", "e2e4", "d7d6", "g1f3", "e1g1", "f1e2", "e7e5", "e1g1", "b8c6", "d4d5", "c6e7"],
  },
  {
    name: "Nimzo-Indian Defense (Classical Variation)",
    eco: "E32",
    styles: ['positional', 'unbeatable'],
    moves: ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4", "d1c2", "e1g1", "a2a3", "b4c3", "c2c3", "b7b6"],
  },
  {
    name: "Nimzo-Indian Defense (Rubinstein System)",
    eco: "E41",
    styles: ['solid', 'positional'],
    moves: ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4", "e2e3", "c7c5", "f1d3", "b8c6", "g1f3", "b4c3", "b2c3", "d7d6"],
  },
  {
    name: "Grünfeld Defense (Exchange Variation)",
    eco: "D85",
    styles: ['tactical', 'aggressive', 'unbeatable'],
    moves: ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "d7d5", "c4d5", "f6d5", "e2e4", "d5c3", "b2c3", "f8g7", "g1f3", "c7c5"],
  },
  {
    name: "Modern Benoni (Four Pawns Attack)",
    eco: "A60",
    styles: ['aggressive', 'tactical'],
    moves: ["d2d4", "g8f6", "c2c4", "c7c5", "d4d5", "e7e6", "b1c3", "e6d5", "c4d5", "d7d6", "e2e4", "g7g6"],
  },
  {
    name: "Benko Gambit (Half-Accepted)",
    eco: "A57",
    styles: ['aggressive', 'positional'],
    moves: ["d2d4", "g8f6", "c2c4", "c7c5", "d4d5", "b7b5", "c4b5", "a7a6", "e2e3", "g7g6", "b1c3", "f8g7"],
  },
  {
    name: "Dutch Defense (Leningrad Variation)",
    eco: "A87",
    styles: ['aggressive', 'tactical'],
    moves: ["d2d4", "f7f5", "c2c4", "g8f6", "g2g3", "g7g6", "f1g2", "f8g7", "g1f3", "e8g8", "e1g1", "d7d6"],
  },

  // --------------------------------------------------------------------------
  // 7. FLANK OPENINGS (1. c4, 1. Nf3, 1. b3, 1. g3)
  // --------------------------------------------------------------------------
  {
    name: "English Opening (Four Knights Variation)",
    eco: "A28",
    styles: ['solid', 'positional'],
    moves: ["c2c4", "e7e5", "b1c3", "g8f6", "g1f3", "b8c6", "g2g3", "f8b4", "f1g2", "e8g8", "e1g1", "f8e8"],
  },
  {
    name: "English Opening (Symmetrical Variation)",
    eco: "A30",
    styles: ['solid', 'positional', 'unbeatable'],
    moves: ["c2c4", "c7c5", "g1f3", "g8f6", "b1c3", "b8c6", "g2g3", "g7g6", "f1g2", "f8g7", "e1g1", "e8g8"],
  },
  {
    name: "Réti Opening (King's Indian Attack)",
    eco: "A07",
    styles: ['solid', 'positional'],
    moves: ["g1f3", "d7d5", "g2g3", "g8f6", "f1g2", "e7e6", "e1g1", "f8e7", "d2d3", "c7c5", "b1d2", "b8c6"],
  },
  {
    name: "King's Fianchetto Opening",
    eco: "A00",
    styles: ['solid', 'positional'],
    moves: ["g2g3", "d7d5", "f1g2", "g8f6", "g1f3", "c7c6", "e1g1", "c8f5", "d2d3", "e7e6"],
  },
  {
    name: "Nimzo-Larsen Attack",
    eco: "A01",
    styles: ['tactical', 'positional'],
    moves: ["b2b3", "e7e5", "c1b2", "b8c6", "e2e3", "g8f6", "f1b5", "d7d6", "g1e2", "c8d7"],
  },
];

/**
 * Searches the master opening book for matches following the current move sequence.
 * Filters by bot playstyle (if provided) and randomizes among legal candidate variations
 * so the engine never plays the same opening every game, just like Chess.com bots!
 */
export function queryOpeningBook(
  moveHistoryUci: string[],
  botStyle?: OpeningStyle
): string | null {
  const currentLen = moveHistoryUci.length;

  // Filter variations that match the played moves so far
  const matchingOpenings = MASTER_OPENING_BOOK.filter((opening) => {
    if (opening.moves.length <= currentLen) return false;
    for (let i = 0; i < currentLen; i++) {
      if (opening.moves[i] !== moveHistoryUci[i]) return false;
    }
    return true;
  });

  if (matchingOpenings.length === 0) return null;

  // If bot has a preferred playstyle, filter matching openings by style
  if (botStyle) {
    const styleMatches = matchingOpenings.filter((o) => o.styles.includes(botStyle));
    if (styleMatches.length > 0) {
      const picked = styleMatches[Math.floor(Math.random() * styleMatches.length)];
      return picked.moves[currentLen];
    }
  }

  // Randomize among all valid variations
  const picked = matchingOpenings[Math.floor(Math.random() * matchingOpenings.length)];
  return picked.moves[currentLen];
}
