import { supabase } from '../supabase/client';
import { TimeControl } from '../../domain/chess/timeControls';
import { generate5CharCode, isValid5CharCode } from '../../domain/chess/roomCode';

export { generate5CharCode, isValid5CharCode };

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
}

export interface IncomingFriendChallenge {
  id: string;
  sender_id: string;
  sender_username: string;
  receiver_id: string;
  receiver_username: string;
  game_id: string;
  invite_code: string;
  time_control_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
}

export class FriendService {
  /**
   * Retrieves active online players or searches by username from Supabase
   */
  public static async searchUsers(query: string = '', currentUserId?: string): Promise<FriendProfile[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_players', {
        p_exclude_user_id: currentUserId || null,
        p_query: query.trim(),
      });

      if (!error && data) {
        return data as FriendProfile[];
      }
    } catch {
      // Fallback
    }

    return [];
  }

  /**
   * Sends a real-time direct challenge to a friend, or auto-accepts if they already challenged you
   */
  public static async sendDirectChallenge(
    senderId: string,
    senderUsername: string,
    receiverId: string,
    timeControl: TimeControl
  ): Promise<{
    success: boolean;
    status: 'pending' | 'accepted';
    gameId: string;
    inviteCode: string;
    challengeId?: string;
    message?: string;
    error?: string;
  }> {
    const baseMs = timeControl.baseSeconds * 1000;
    const incMs = timeControl.incrementSeconds * 1000;

    try {
      const { data, error } = await supabase.rpc('send_friend_challenge', {
        p_sender_id: senderId,
        p_sender_username: senderUsername,
        p_receiver_id: receiverId,
        p_category: timeControl.category,
        p_base_ms: baseMs,
        p_inc_ms: incMs,
        p_tc_label: timeControl.label,
      });

      if (error) {
        return { success: false, status: 'pending', gameId: '', inviteCode: '', error: error.message };
      }

      if (data && data.success) {
        return {
          success: true,
          status: data.status,
          gameId: data.game_id,
          inviteCode: data.invite_code,
          challengeId: data.challenge_id,
          message: data.message,
        };
      }
    } catch (err: any) {
      return { success: false, status: 'pending', gameId: '', inviteCode: '', error: err?.message };
    }

    return { success: false, status: 'pending', gameId: '', inviteCode: '', error: 'Failed to send challenge' };
  }

  /**
   * Responds to an incoming challenge (accept or decline)
   */
  public static async respondToChallenge(
    challengeId: string,
    userId: string,
    action: 'accept' | 'decline'
  ): Promise<{ success: boolean; status: string; gameId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('respond_friend_challenge', {
        p_challenge_id: challengeId,
        p_user_id: userId,
        p_action: action,
      });

      if (error) {
        return { success: false, status: 'error', error: error.message };
      }

      if (data) {
        return {
          success: !!data.success,
          status: data.status,
          gameId: data.game_id || data.gameId,
          error: data.error,
        };
      }

      return { success: false, status: 'error', error: 'No response from server' };
    } catch (err: any) {
      return { success: false, status: 'error', error: err?.message };
    }
  }

  /**
   * Cancels a pending challenge sent by the user
   */
  public static async cancelChallenge(challengeId: string): Promise<void> {
    try {
      await supabase
        .from('friend_challenges')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', challengeId);
    } catch {
      // Ignored
    }
  }

  /**
   * Creates an authoritative friend match in the database with selected time control
   * and a 5-character room code.
   */
  public static async createFriendChallenge(
    senderId: string,
    senderUsername: string,
    timeControl: TimeControl,
    codeOverride?: string
  ): Promise<{ gameId: string; inviteCode: string }> {
    const code = (codeOverride || generate5CharCode()).toUpperCase();
    const baseMs = timeControl.baseSeconds * 1000;
    const incMs = timeControl.incrementSeconds * 1000;

    try {
      const { data, error } = await supabase.rpc('create_friend_room', {
        p_user_id: senderId,
        p_username: senderUsername,
        p_code: code,
        p_category: timeControl.category,
        p_base_ms: baseMs,
        p_inc_ms: incMs,
      });

      if (!error && data?.success) {
        return { gameId: data.game_id, inviteCode: data.invite_code };
      }
    } catch {
      // Fallback
    }

    return { gameId: '', inviteCode: code };
  }

  /**
   * Checks whether the friend has joined the created room
   */
  public static async checkRoomJoined(gameId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, status, black_player_id')
        .eq('id', gameId)
        .single();

      if (!error && data) {
        return data.status === 'active' || !!data.black_player_id;
      }
    } catch {
      // Fallback
    }
    return false;
  }

  /**
   * Joins or creates a room by 5-character code with mandatory time control:
   * - If not found: creates the room with the code and specified time control
   * - If pending: joins as black and starts the match
   * - If playing: alerts that both players are already playing
   */
  public static async joinGameByCode(
    inviteCode: string,
    joiningUserId: string,
    joiningUsername?: string,
    timeControl?: TimeControl
  ): Promise<{ gameId?: string; status?: string; role?: string; reopened?: boolean; message?: string; error?: string }> {
    const clean = inviteCode.trim().toUpperCase();

    if (!clean || clean.length !== 5 || !/^[A-Z0-9]{5}$/.test(clean)) {
      return { error: 'Please enter a valid 5-character letter/number room code.' };
    }

    const baseMs = (timeControl?.baseSeconds ?? 600) * 1000;
    const incMs = (timeControl?.incrementSeconds ?? 0) * 1000;
    const category = timeControl?.category ?? 'rapid';

    try {
      const { data, error } = await supabase.rpc('join_friend_room', {
        p_user_id: joiningUserId,
        p_username: joiningUsername || 'Challenger',
        p_code: clean,
        p_category: category,
        p_base_ms: baseMs,
        p_inc_ms: incMs,
      });

      if (error) {
        return { error: error.message };
      }

      if (data) {
        if (data.success && (data.game_id || data.gameId)) {
          return {
            gameId: data.game_id || data.gameId,
            status: data.status,
            role: data.role,
            reopened: data.reopened,
            message: data.message,
          };
        }
        return { error: data.error || 'Could not join room', status: data.status };
      }
    } catch (err: any) {
      return { error: err?.message || 'Error communicating with game server' };
    }

    return { error: 'Room code not found' };
  }
}
