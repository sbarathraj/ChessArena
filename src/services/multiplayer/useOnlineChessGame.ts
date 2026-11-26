import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { ChessGame } from '../../domain/chess/ChessGame';
import { Square, MoveDetails, PieceColor } from '../../domain/chess/types';

export interface OnlineGameState {
  id: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  turn: PieceColor;
  status: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveAt: string | null;
  lastTurnDeadline: string | null;
  stateVersion: number;
  fen: string;
  winnerId: string | null;
  termination: string | null;
}

export interface OnlineMoveSnapshot {
  san: string;
  uci: string;
  fen: string;
  from: Square;
  to: Square;
}

export interface PlayerSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
}

export function useOnlineChessGame(gameId: string, currentUserId?: string) {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [whitePlayer, setWhitePlayer] = useState<PlayerSummary | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<PlayerSummary | null>(null);

  const [gameEngine] = useState<ChessGame>(() => new ChessGame());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<OnlineMoveSnapshot[]>([]);
  const [isThreefoldRepetition, setIsThreefoldRepetition] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authoritative local clock countdowns
  const [whiteDisplayMs, setWhiteDisplayMs] = useState<number>(0);
  const [blackDisplayMs, setBlackDisplayMs] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync clocks locally based on server timestamp
  const updateLocalClocks = useCallback((state: OnlineGameState) => {
    if (state.status !== 'active') {
      setWhiteDisplayMs(state.whiteTimeMs);
      setBlackDisplayMs(state.blackTimeMs);
      return;
    }

    const referenceTime = state.lastMoveAt ? new Date(state.lastMoveAt).getTime() : Date.now();
    const elapsed = Math.max(0, Date.now() - referenceTime);

    if (state.turn === 'w') {
      const remaining = Math.max(0, state.whiteTimeMs - elapsed);
      setWhiteDisplayMs(remaining);
      setBlackDisplayMs(state.blackTimeMs);
    } else {
      const remaining = Math.max(0, state.blackTimeMs - elapsed);
      setBlackDisplayMs(remaining);
      setWhiteDisplayMs(state.whiteTimeMs);
    }
  }, []);

  // Fetch canonical state from PostgreSQL
  const fetchCanonicalState = useCallback(async () => {
    if (!gameId) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchErr || !data) return;

      const mappedState: OnlineGameState = {
        id: data.id,
        whitePlayerId: data.white_player_id,
        blackPlayerId: data.black_player_id,
        turn: data.turn as PieceColor,
        status: data.status,
        whiteTimeMs: data.white_time_remaining_ms,
        blackTimeMs: data.black_time_remaining_ms,
        lastMoveAt: data.last_move_at,
        lastTurnDeadline: data.last_turn_deadline,
        stateVersion: data.state_version,
        fen: data.fen,
        winnerId: data.winner_id,
        termination: data.termination,
      };

      gameEngine.load(mappedState.fen);
      setGameState(mappedState);
      updateLocalClocks(mappedState);

      // Fetch player profiles
      const playerIds = [data.white_player_id, data.black_player_id].filter(Boolean);
      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', playerIds);

        if (profiles) {
          const w = profiles.find((p: any) => p.id === data.white_player_id);
          const b = profiles.find((p: any) => p.id === data.black_player_id);
          if (w) {
            setWhitePlayer({
              id: w.id,
              username: w.username,
              displayName: w.display_name || w.username,
              avatarUrl: w.avatar_url,
              rating: (w as any)?.rating || 1500,
            });
          }
          if (b) {
            setBlackPlayer({
              id: b.id,
              username: b.username,
              displayName: b.display_name || b.username,
              avatarUrl: b.avatar_url,
              rating: (b as any)?.rating || 1500,
            });
          }
        }
      }

      // Fetch move history
      const { data: movesData } = await supabase
        .from('game_moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_number', { ascending: true });

      if (movesData) {
        const mappedMoves: OnlineMoveSnapshot[] = movesData.map((m: any) => ({
          san: m.san,
          uci: m.uci,
          fen: m.fen_after,
          from: m.uci.substring(0, 2) as Square,
          to: m.uci.substring(2, 4) as Square,
        }));
        setMoveHistory(mappedMoves);
        if (mappedMoves.length > 0) {
          const last = mappedMoves[mappedMoves.length - 1];
          setLastMove({ from: last.from, to: last.to });
        }

        // Detect Threefold Repetition locally across moves
        const positionCounts = new Map<string, number>();
        const initialKey = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
        positionCounts.set(initialKey, 1);
        let threefoldFound = false;

        for (const m of mappedMoves) {
          const parts = m.fen.split(' ');
          const key = `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
          const count = (positionCounts.get(key) || 0) + 1;
          positionCounts.set(key, count);
          if (count >= 3) {
            threefoldFound = true;
            break;
          }
        }
        setIsThreefoldRepetition(threefoldFound);
      }
    } catch (err: any) {
      setError(err?.message || 'Error syncing game state');
    }
  }, [gameId, gameEngine, updateLocalClocks]);

  // Initial fetch, Realtime WebSocket subscription, and 1200ms polling fallback
  useEffect(() => {
    fetchCanonicalState();

    const channel = supabase
      .channel(`game_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        () => {
          fetchCanonicalState();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchCanonicalState();
        }
      )
      .subscribe();

    // High-reliability polling fallback
    const pollInterval = setInterval(() => {
      fetchCanonicalState();
    }, 1200);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchCanonicalState]);

  const resign = useCallback(async () => {
    if (!gameState) return;
    try {
      await supabase.rpc('resign_game', {
        p_game_id: gameState.id,
        p_player_id: currentUserId || null,
      });
    } catch (e) {
      console.warn('Resign error:', e);
    }
    await fetchCanonicalState();
  }, [gameState, fetchCanonicalState, currentUserId]);

  const leaveGame = useCallback(async () => {
    if (!gameState || gameState.status !== 'active') return;
    try {
      await supabase.rpc('leave_game', {
        p_game_id: gameState.id,
        p_player_id: currentUserId || null,
      });
    } catch (e) {
      console.warn('Leave game error:', e);
    }
    await fetchCanonicalState();
  }, [gameState, fetchCanonicalState, currentUserId]);

  const claimTimeout = useCallback(async () => {
    if (!gameState) return;
    try {
      await supabase.rpc('claim_timeout', { p_game_id: gameState.id });
    } catch (e) {
      console.warn('Claim timeout error:', e);
    }
    await fetchCanonicalState();
  }, [gameState, fetchCanonicalState]);

  // High-frequency UI tick (100ms) for ultra-smooth digital clocks and auto-timeout claim
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!gameState || gameState.status !== 'active') return;
      const refTime = gameState.lastMoveAt ? new Date(gameState.lastMoveAt).getTime() : Date.now();
      const elapsed = Math.max(0, Date.now() - refTime);
      if (gameState.turn === 'w') {
        const remaining = Math.max(0, gameState.whiteTimeMs - elapsed);
        setWhiteDisplayMs(remaining);
        if (remaining === 0) {
          claimTimeout();
        }
      } else {
        const remaining = Math.max(0, gameState.blackTimeMs - elapsed);
        setBlackDisplayMs(remaining);
        if (remaining === 0) {
          claimTimeout();
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, claimTimeout]);

  // Submit move to authoritative server stored procedure
  const submitOnlineMove = useCallback(
    async (move: MoveDetails) => {
      if (!gameState || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);
      setLastMove({ from: move.from, to: move.to });

      try {
        const idempotencyKey = `${gameState.id}_${gameState.stateVersion}_${move.uci}`;
        const { data, error: rpcErr } = await supabase.rpc('submit_move', {
          p_game_id: gameState.id,
          p_san: move.san,
          p_uci: move.uci,
          p_fen_after: move.fenAfter,
          p_idempotency_key: idempotencyKey,
          p_player_id: currentUserId,
        });

        if (rpcErr) {
          setError(rpcErr.message);
          fetchCanonicalState();
        } else {
          // Immediately sync local state
          fetchCanonicalState();
        }
      } catch (err: any) {
        setError(err?.message || 'Move failed');
        fetchCanonicalState();
      } finally {
        setIsSubmitting(false);
      }
    },
    [gameState, isSubmitting, fetchCanonicalState, currentUserId]
  );

  return {
    gameState,
    gameEngine,
    whitePlayer,
    blackPlayer,
    whiteDisplayMs,
    blackDisplayMs,
    lastMove,
    moveHistory,
    isThreefoldRepetition,
    isSubmitting,
    error,
    submitOnlineMove,
    resign,
    leaveGame,
    claimTimeout,
    refresh: fetchCanonicalState,
  };
}
