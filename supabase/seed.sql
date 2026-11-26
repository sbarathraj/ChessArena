-- ============================================================================
-- KnightArena Seed Data for Local Development and Training
-- ============================================================================

INSERT INTO public.puzzles (id, fen, moves, rating, rating_deviation, themes, opening_tags, game_url)
VALUES 
(
    'kz001',
    'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
    ARRAY['c4f7', 'e8f7', 'd1e2'],
    1200,
    70,
    ARRAY['fork', 'sacrifice', 'opening'],
    ARRAY['Italian Game', 'Two Knights Defense'],
    'https://knightarena.com/games/seed01'
),
(
    'kz002',
    'r1b2rk1/ppp2ppp/2n5/3qp3/8/3B1N2/PPP2PPP/R2Q1RK1 w - - 0 11',
    ARRAY['d3h7', 'g8h7', 'd1d5'],
    1350,
    65,
    ARRAY['discoveredAttack', 'queenTrap', 'sacrifice'],
    ARRAY['Scotch Game'],
    'https://knightarena.com/games/seed02'
),
(
    'kz003',
    '6k1/5ppp/8/8/8/8/1r3PPP/4R1K1 w - - 0 1',
    ARRAY['e1e8'],
    1000,
    50,
    ARRAY['backRankMate', 'mateIn1'],
    ARRAY['Endgame'],
    'https://knightarena.com/games/seed03'
),
(
    'kz004',
    'r2qkb1r/pp2pppp/2n2n2/3p4/3P2b1/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 3 7',
    ARRAY['d3h7', 'f6h7', 'd1d3'],
    1550,
    80,
    ARRAY['advantage', 'tactic'],
    ARRAY['Queens Pawn Game'],
    'https://knightarena.com/games/seed04'
),
(
    'kz005',
    '2r3k1/pp3ppp/8/3p4/8/1P1QP3/P4PPP/2qR2K1 b - - 2 24',
    ARRAY['c1d1', 'd3d1', 'c8c1'],
    1680,
    75,
    ARRAY['pin', 'endgame', 'simplification'],
    ARRAY['Endgame'],
    'https://knightarena.com/games/seed05'
)
ON CONFLICT (id) DO NOTHING;
