-- ============================================================================
-- KnightArena Database Schema & RLS Migrations
-- Phase 1 & 2: Core Auth, Profiles, Ratings, Games, Moves, Clocks, & Fair Play
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Time Control Category Enum
CREATE TYPE time_control_category AS ENUM ('bullet', 'blitz', 'rapid', 'classical', 'daily');

-- Game Status Enum
CREATE TYPE game_status AS ENUM ('pending', 'active', 'checkmate', 'stalemate', 'resignation', 'timeout', 'draw_agreement', 'draw_repetition', 'draw_material', 'abandoned');

-- Game Termination Reason Enum
CREATE TYPE termination_reason AS ENUM ('normal', 'time_forfeit', 'resignation', 'agreement', 'repetition', 'fifty_moves', 'insufficient_material', 'abandonment');

-- ----------------------------------------------------------------------------
-- 1. Profiles Table (Public Identity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    country_code VARCHAR(3),
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]{3,20}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ----------------------------------------------------------------------------
-- 2. Private User Settings (Strict User-Only Access)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    sound_enabled BOOLEAN DEFAULT true,
    haptics_enabled BOOLEAN DEFAULT true,
    auto_queen BOOLEAN DEFAULT false,
    move_confirmation BOOLEAN DEFAULT false,
    board_theme TEXT DEFAULT 'obsidian',
    piece_theme TEXT DEFAULT 'classic',
    allow_friend_challenges BOOLEAN DEFAULT true,
    allow_spectators BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. User Ratings Table (Glicko-2 state per category)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category time_control_category NOT NULL,
    rating DOUBLE PRECISION DEFAULT 1500.0 NOT NULL,
    rating_deviation DOUBLE PRECISION DEFAULT 350.0 NOT NULL,
    volatility DOUBLE PRECISION DEFAULT 0.06 NOT NULL,
    is_provisional BOOLEAN DEFAULT true NOT NULL,
    games_played INT DEFAULT 0 NOT NULL,
    wins INT DEFAULT 0 NOT NULL,
    losses INT DEFAULT 0 NOT NULL,
    draws INT DEFAULT 0 NOT NULL,
    peak_rating DOUBLE PRECISION DEFAULT 1500.0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_ratings_leaderboard ON public.user_ratings(category, rating DESC);

-- Immutable Rating History
CREATE TABLE IF NOT EXISTS public.rating_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID,
    category time_control_category NOT NULL,
    old_rating DOUBLE PRECISION NOT NULL,
    new_rating DOUBLE PRECISION NOT NULL,
    old_rd DOUBLE PRECISION NOT NULL,
    new_rd DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. Games Table (Authoritative Realtime State)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category time_control_category NOT NULL,
    time_control_base_ms INT NOT NULL, -- e.g. 180000 for 3 min
    time_control_increment_ms INT DEFAULT 0 NOT NULL, -- e.g. 2000 for 2 sec
    is_rated BOOLEAN DEFAULT true NOT NULL,
    status game_status DEFAULT 'pending' NOT NULL,
    fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' NOT NULL,
    pgn TEXT DEFAULT '' NOT NULL,
    turn VARCHAR(1) DEFAULT 'w' NOT NULL,
    move_count INT DEFAULT 0 NOT NULL,
    state_version INT DEFAULT 1 NOT NULL,
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    termination termination_reason,
    white_time_remaining_ms INT NOT NULL,
    black_time_remaining_ms INT NOT NULL,
    last_move_at TIMESTAMPTZ,
    last_turn_deadline TIMESTAMPTZ,
    draw_offered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,
    invite_code VARCHAR(8) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_games_players ON public.games(white_player_id, black_player_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_invite_code ON public.games(invite_code);

-- ----------------------------------------------------------------------------
-- 5. Game Moves Table (Persisted Move Ledger with Concurrency Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    move_number INT NOT NULL,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    san TEXT NOT NULL,
    uci TEXT NOT NULL,
    fen_after TEXT NOT NULL,
    time_spent_ms INT DEFAULT 0 NOT NULL,
    white_time_remaining_ms INT NOT NULL,
    black_time_remaining_ms INT NOT NULL,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(game_id, move_number),
    UNIQUE(game_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_game_moves_game ON public.game_moves(game_id, move_number ASC);

-- ----------------------------------------------------------------------------
-- 6. Matchmaking Queue (Atomic Pairing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    category time_control_category NOT NULL,
    time_control_base_ms INT NOT NULL,
    time_control_increment_ms INT NOT NULL,
    rating DOUBLE PRECISION NOT NULL,
    rd DOUBLE PRECISION NOT NULL,
    is_rated BOOLEAN DEFAULT true NOT NULL,
    min_rating DOUBLE PRECISION,
    max_rating DOUBLE PRECISION,
    enqueued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. Social & Friendships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY(blocker_id, blocked_id)
);

-- ----------------------------------------------------------------------------
-- 8. Puzzles & Progress
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.puzzles (
    id TEXT PRIMARY KEY,
    fen TEXT NOT NULL,
    moves TEXT[] NOT NULL,
    rating INT DEFAULT 1500 NOT NULL,
    rating_deviation INT DEFAULT 100 NOT NULL,
    themes TEXT[] DEFAULT '{}' NOT NULL,
    opening_tags TEXT[] DEFAULT '{}' NOT NULL,
    game_url TEXT
);

CREATE TABLE IF NOT EXISTS public.puzzle_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
    is_solved BOOLEAN NOT NULL,
    time_spent_ms INT NOT NULL,
    rating_change INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_user ON public.puzzle_attempts(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. Row-Level Security (RLS) Setup
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles, owners can update their own
CREATE POLICY "Public profiles are viewable by all" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Private Settings: Only the authenticated user can access their settings
CREATE POLICY "Users can read own settings" 
    ON public.private_user_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
    ON public.private_user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
    ON public.private_user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ratings: Viewable by all; only modified via server functions
CREATE POLICY "User ratings are viewable by all" 
    ON public.user_ratings FOR SELECT USING (true);

CREATE POLICY "Rating events viewable by all" 
    ON public.rating_events FOR SELECT USING (true);

-- Games: Publicly viewable unless marked private; players have direct visibility
CREATE POLICY "Games viewable by everyone unless private"
    ON public.games FOR SELECT 
    USING (
        NOT is_private 
        OR auth.uid() = white_player_id 
        OR auth.uid() = black_player_id
    );

-- Game Moves: Viewable by players and spectators
CREATE POLICY "Game moves viewable by all"
    ON public.game_moves FOR SELECT USING (true);

-- Matchmaking: Users can only see and manage their own queue item
CREATE POLICY "Users manage their own matchmaking item"
    ON public.matchmaking_queue FOR ALL USING (auth.uid() = user_id);

-- Friendships & Blocks
CREATE POLICY "Users can read their friendships"
    ON public.friendships FOR SELECT 
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can read their blocks"
    ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);

-- Puzzles: Public read access
CREATE POLICY "Puzzles viewable by all" ON public.puzzles FOR SELECT USING (true);
CREATE POLICY "Users can view own puzzle attempts" ON public.puzzle_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log own puzzle attempt" ON public.puzzle_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 10. PostgreSQL Stored Procedures (Authoritative Server Logic)
-- ----------------------------------------------------------------------------

-- A. Submit Move Function (Atomic validation, optimistic lock, clock update)
CREATE OR REPLACE FUNCTION public.submit_move(
    p_game_id UUID,
    p_san TEXT,
    p_uci TEXT,
    p_fen_after TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game public.games%ROWTYPE;
    v_user_id UUID := auth.uid();
    v_now TIMESTAMPTZ := clock_timestamp();
    v_elapsed_ms INT;
    v_next_turn VARCHAR(1);
    v_white_time INT;
    v_black_time INT;
    v_next_deadline TIMESTAMPTZ;
BEGIN
    -- Check caller authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Fetch game with row-level lock
    SELECT * INTO v_game 
    FROM public.games 
    WHERE id = p_game_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found';
    END IF;

    IF v_game.status <> 'active' AND v_game.status <> 'pending' THEN
        RAISE EXCEPTION 'Game is not active';
    END IF;

    -- Turn validation
    IF (v_game.turn = 'w' AND v_game.white_player_id <> v_user_id) OR
       (v_game.turn = 'b' AND v_game.black_player_id <> v_user_id) THEN
        RAISE EXCEPTION 'Not your turn';
    END IF;

    -- Compute clock timings
    v_white_time := v_game.white_time_remaining_ms;
    v_black_time := v_game.black_time_remaining_ms;

    IF v_game.last_move_at IS NOT NULL THEN
        v_elapsed_ms := EXTRACT(MILLISECONDS FROM (v_now - v_game.last_move_at))::INT;
        
        -- Deduct time from active player
        IF v_game.turn = 'w' THEN
            v_white_time := v_white_time - v_elapsed_ms;
            IF v_white_time < 0 THEN
                -- Timeout occurred
                UPDATE public.games
                SET status = 'timeout',
                    winner_id = v_game.black_player_id,
                    termination = 'time_forfeit',
                    ended_at = v_now
                WHERE id = p_game_id;
                RETURN jsonb_build_object('success', false, 'reason', 'timeout');
            END IF;
            -- Add increment
            v_white_time := v_white_time + v_game.time_control_increment_ms;
        ELSE
            v_black_time := v_black_time - v_elapsed_ms;
            IF v_black_time < 0 THEN
                UPDATE public.games
                SET status = 'timeout',
                    winner_id = v_game.white_player_id,
                    termination = 'time_forfeit',
                    ended_at = v_now
                WHERE id = p_game_id;
                RETURN jsonb_build_object('success', false, 'reason', 'timeout');
            END IF;
            -- Add increment
            v_black_time := v_black_time + v_game.time_control_increment_ms;
        END IF;
    END IF;

    -- Determine next turn
    IF v_game.turn = 'w' THEN
        v_next_turn := 'b';
        v_next_deadline := v_now + (v_black_time || ' milliseconds')::INTERVAL;
    ELSE
        v_next_turn := 'w';
        v_next_deadline := v_now + (v_white_time || ' milliseconds')::INTERVAL;
    END IF;

    -- Persist move in ledger
    INSERT INTO public.game_moves (
        game_id,
        move_number,
        player_id,
        san,
        uci,
        fen_after,
        time_spent_ms,
        white_time_remaining_ms,
        black_time_remaining_ms,
        idempotency_key
    ) VALUES (
        p_game_id,
        v_game.move_count + 1,
        v_user_id,
        p_san,
        p_uci,
        p_fen_after,
        COALESCE(v_elapsed_ms, 0),
        v_white_time,
        v_black_time,
        p_idempotency_key
    );

    -- Update authoritative game state
    UPDATE public.games
    SET fen = p_fen_after,
        turn = v_next_turn,
        status = 'active',
        move_count = v_game.move_count + 1,
        state_version = v_game.state_version + 1,
        white_time_remaining_ms = v_white_time,
        black_time_remaining_ms = v_black_time,
        last_move_at = v_now,
        last_turn_deadline = v_next_deadline,
        started_at = COALESCE(v_game.started_at, v_now)
    WHERE id = p_game_id;

    RETURN jsonb_build_object(
        'success', true,
        'move_number', v_game.move_count + 1,
        'turn', v_next_turn,
        'white_time', v_white_time,
        'black_time', v_black_time
    );
END;
$$;

-- B. Claim Timeout Stored Procedure
CREATE OR REPLACE FUNCTION public.claim_timeout(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game public.games%ROWTYPE;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found';
    END IF;

    IF v_game.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Game is not active');
    END IF;

    IF v_game.last_turn_deadline IS NOT NULL AND v_now > v_game.last_turn_deadline THEN
        -- Timeout confirmed
        UPDATE public.games
        SET status = 'timeout',
            winner_id = CASE WHEN v_game.turn = 'w' THEN v_game.black_player_id ELSE v_game.white_player_id END,
            termination = 'time_forfeit',
            ended_at = v_now
        WHERE id = p_game_id;

        RETURN jsonb_build_object('success', true, 'winner', CASE WHEN v_game.turn = 'w' THEN 'black' ELSE 'white' END);
    END IF;

    RETURN jsonb_build_object('success', false, 'message', 'Time has not expired');
END;
$$;

-- C. Resign Game Stored Procedure
CREATE OR REPLACE FUNCTION public.resign_game(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game public.games%ROWTYPE;
    v_user_id UUID := auth.uid();
    v_winner_id UUID;
BEGIN
    SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found';
    END IF;

    IF v_game.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Game is not active');
    END IF;

    IF v_user_id = v_game.white_player_id THEN
        v_winner_id := v_game.black_player_id;
    ELSIF v_user_id = v_game.black_player_id THEN
        v_winner_id := v_game.white_player_id;
    ELSE
        RAISE EXCEPTION 'You are not a player in this game';
    END IF;

    UPDATE public.games
    SET status = 'resignation',
        winner_id = v_winner_id,
        termination = 'resignation',
        ended_at = clock_timestamp()
    WHERE id = p_game_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
