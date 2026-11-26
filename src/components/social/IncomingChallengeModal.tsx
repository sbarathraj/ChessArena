import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../services/supabase/AuthContext';
import { supabase } from '../../services/supabase/client';
import { FriendService, IncomingFriendChallenge } from '../../services/friends/FriendService';
import { formatTimeControl } from '../../domain/chess/timeControls';

export const IncomingChallengeModal: React.FC = () => {
  const { profile } = useAuth();
  const [activeChallenge, setActiveChallenge] = useState<IncomingFriendChallenge | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkPendingChallenges = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friend_challenges')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const chal = data[0] as IncomingFriendChallenge;
        // Verify challenge is recent (within last 3 minutes)
        const ageMs = Date.now() - new Date(chal.created_at).getTime();
        if (ageMs < 180000) {
          setActiveChallenge(chal);
          return;
        }
      }
      setActiveChallenge(null);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    // Initial check
    checkPendingChallenges(profile.id);

    // Supabase Realtime subscription for incoming challenges
    const channel = supabase
      .channel(`incoming_challenges_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_challenges',
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload) => {
          const newChal = payload.new as IncomingFriendChallenge;
          if (newChal.status === 'pending') {
            setActiveChallenge(newChal);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_challenges',
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload) => {
          const updated = payload.new as IncomingFriendChallenge;
          if (updated.status !== 'pending') {
            setActiveChallenge(null);
          }
        }
      )
      .subscribe();

    // 2.5s Polling fallback
    pollTimerRef.current = setInterval(() => {
      checkPendingChallenges(profile.id);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [profile?.id]);

  if (!activeChallenge) return null;

  const handleAccept = async () => {
    if (!profile?.id || !activeChallenge) return;
    setIsResponding(true);
    const res = await FriendService.respondToChallenge(activeChallenge.id, profile.id, 'accept');
    setIsResponding(false);

    const targetGameId = res.gameId || (res as any)?.game_id || activeChallenge.game_id;
    if (res.success && targetGameId) {
      setActiveChallenge(null);
      router.push(`/game/${targetGameId}` as any);
    }
  };

  const handleDecline = async () => {
    if (!profile?.id || !activeChallenge) return;
    setIsResponding(true);
    await FriendService.respondToChallenge(activeChallenge.id, profile.id, 'decline');
    setIsResponding(false);
    setActiveChallenge(null);
  };

  return (
    <Modal visible={!!activeChallenge} transparent animationType="fade" onRequestClose={handleDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚔️ MATCH CHALLENGE</Text>
            </View>
          </View>

          {/* Sender Info */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {activeChallenge.sender_username.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.challengerName}>{activeChallenge.sender_username}</Text>
          <Text style={styles.challengerSubtext}>has challenged you to a live chess game!</Text>

          {/* Time Control Pill */}
          <View style={styles.tcBadge}>
            <Text style={styles.tcText}>⏱️ {formatTimeControl(activeChallenge.time_control_label)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.declineBtn]}
              onPress={handleDecline}
              disabled={isResponding}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={isResponding}
            >
              {isResponding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept Challenge ➔</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#262421',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#81B64C',
    shadowColor: '#81B64C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  badgeRow: {
    marginBottom: 14,
  },
  badge: {
    backgroundColor: '#81B64C22',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#81B64C66',
  },
  badgeText: {
    color: '#81B64C',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#81B64C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
  },
  challengerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  challengerSubtext: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  tcBadge: {
    backgroundColor: '#1E1D1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3A34',
    marginBottom: 24,
  },
  tcText: {
    color: '#F6E05E',
    fontWeight: '700',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#362222',
    borderWidth: 1,
    borderColor: '#7A3333',
  },
  declineBtnText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 15,
  },
  acceptBtn: {
    backgroundColor: '#81B64C',
    borderWidth: 1,
    borderColor: '#6F9E41',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
