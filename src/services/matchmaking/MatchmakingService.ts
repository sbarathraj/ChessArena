import { supabase } from '../supabase/client';
import { TimeControl } from '../../domain/chess/types';

export interface MatchmakingRequest {
  userId: string;
  username?: string;
  userRating: number;
  userRd: number;
  timeControl: TimeControl;
  isRated: boolean;
}

export class MatchmakingService {
  /**
   * Enqueues the player into the matchmaking queue and attempts atomic pairing.
   * Utilizes the atomic database RPC `join_or_match_player` to guarantee immediate pairing
   * and race-condition free game creation with row-level locks.
   */
  public static async joinQueue(request: MatchmakingRequest): Promise<{ matchedGameId?: string }> {
    const { userId, username, userRating, userRd, timeControl, isRated } = request;
    const baseMs = timeControl.baseSeconds * 1000;
    const incMs = timeControl.incrementSeconds * 1000;

    try {
      const { data, error } = await supabase.rpc('join_or_match_player', {
        p_user_id: userId,
        p_username: username || 'ArenaPlayer',
        p_category: timeControl.category,
        p_base_ms: baseMs,
        p_inc_ms: incMs,
        p_rating: userRating,
        p_rd: userRd,
        p_is_rated: isRated,
      });

      if (!error && data?.matched && data.game_id) {
        return { matchedGameId: data.game_id };
      }
    } catch {
      // Fallback
    }

    return {};
  }

  /**
   * Rapidly polls for an active match where the player has been paired as White or Black
   */
  public static async checkMatch(userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('games')
        .select('id')
        .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        // Clean up from queue
        await supabase.from('matchmaking_queue').delete().eq('user_id', userId);
        return data[0].id;
      }
    } catch {
      // Fallback
    }

    return null;
  }

  public static async leaveQueue(userId: string): Promise<void> {
    try {
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId);
    } catch {
      // Fallback
    }
  }
}
