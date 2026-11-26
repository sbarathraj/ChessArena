import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { FriendProfile, FriendService } from '../../services/friends/FriendService';
import { STANDARD_TIME_CONTROLS, TimeControl } from '../../domain/chess/timeControls';
import { supabase } from '../../services/supabase/client';

interface PlayFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onChallengeCreated: (gameId: string, inviteCode: string, friendUsername: string) => void;
  currentUserId?: string;
  currentUsername?: string;
}

export const PlayFriendModal: React.FC<PlayFriendModalProps> = ({
  visible,
  onClose,
  onChallengeCreated,
  currentUserId,
  currentUsername,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Shared Time Control state
  const [selectedTc, setSelectedTc] = useState<TimeControl>(STANDARD_TIME_CONTROLS[6]); // 10 min Rapid default

  // Challenge Friend state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUsers, setActiveUsers] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string; gameId: string } | null>(null);
  const [pendingChallengeInfo, setPendingChallengeInfo] = useState<{
    challengeId: string;
    friendUsername: string;
    gameId: string;
    code: string;
  } | null>(null);
  const [isWaitingForFriend, setIsWaitingForFriend] = useState(false);

  // Join Mode state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatusMessage, setJoinStatusMessage] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null);

  const roomWaitPollRef = useRef<NodeJS.Timeout | null>(null);
  const roomRealtimeRef = useRef<any>(null);

  // Cleanup watchers
  const cleanupRoomWait = () => {
    if (roomWaitPollRef.current) {
      clearInterval(roomWaitPollRef.current);
      roomWaitPollRef.current = null;
    }
    if (roomRealtimeRef.current) {
      supabase.removeChannel(roomRealtimeRef.current);
      roomRealtimeRef.current = null;
    }
    setIsWaitingForFriend(false);
  };

  useEffect(() => {
    return () => cleanupRoomWait();
  }, []);

  // Fetch initial active players when modal opens
  useEffect(() => {
    if (visible) {
      loadActiveUsers('');
    } else {
      cleanupRoomWait();
      setGeneratedInvite(null);
      setPendingChallengeInfo(null);
      setJoinStatusMessage(null);
      setJoinCodeInput('');
    }
  }, [visible, currentUserId]);

  const loadActiveUsers = async (query: string) => {
    setIsSearching(true);
    const users = await FriendService.searchUsers(query, currentUserId);
    setActiveUsers(users);
    setIsSearching(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadActiveUsers(text);
  };

  // Direct friend challenge
  const handleSendChallenge = async (friend: FriendProfile) => {
    if (!currentUserId) return;
    setIsSending(true);
    cleanupRoomWait();
    setJoinStatusMessage(null);

    const result = await FriendService.sendDirectChallenge(
      currentUserId,
      currentUsername || 'Challenger',
      friend.id,
      selectedTc
    );
    setIsSending(false);

    if (!result.success) {
      setJoinStatusMessage({ type: 'error', text: result.error || 'Failed to send challenge' });
      return;
    }

    // Mutual challenge or already waiting: start game immediately!
    if (result.status === 'accepted' && result.gameId) {
      cleanupRoomWait();
      onClose();
      onChallengeCreated(result.gameId, result.inviteCode, friend.display_name || friend.username);
      return;
    }

    // Pending challenge: display waiting screen and listen for acceptance
    if (result.gameId && result.challengeId) {
      setGeneratedInvite({ code: result.inviteCode, gameId: result.gameId });
      setPendingChallengeInfo({
        challengeId: result.challengeId,
        friendUsername: friend.display_name || friend.username,
        gameId: result.gameId,
        code: result.inviteCode,
      });
      setIsWaitingForFriend(true);

      // Listen on friend_challenges for receiver acceptance or decline
      const channel = supabase
        .channel(`challenge_wait_${result.challengeId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'friend_challenges',
            filter: `id=eq.${result.challengeId}`,
          },
          (payload) => {
            const updated = payload.new as any;
            if (updated.status === 'accepted') {
              cleanupRoomWait();
              onClose();
              onChallengeCreated(result.gameId, result.inviteCode, friend.display_name || friend.username);
            } else if (updated.status === 'declined') {
              cleanupRoomWait();
              setGeneratedInvite(null);
              setPendingChallengeInfo(null);
              setJoinStatusMessage({
                type: 'warning',
                text: `${friend.display_name || friend.username} declined the challenge.`,
              });
            }
          }
        )
        .subscribe();

      roomRealtimeRef.current = channel;

      // 1200ms Polling fallback
      roomWaitPollRef.current = setInterval(async () => {
        const hasJoined = await FriendService.checkRoomJoined(result.gameId);
        if (hasJoined) {
          cleanupRoomWait();
          onClose();
          onChallengeCreated(result.gameId, result.inviteCode, friend.display_name || friend.username);
        }
      }, 1200);
    }
  };

  // Generate 5-character shareable room code
  const handleGenerateCode = async () => {
    if (!currentUserId) return;
    setIsSending(true);
    cleanupRoomWait();

    const result = await FriendService.createFriendChallenge(
      currentUserId,
      currentUsername || 'HostPlayer',
      selectedTc
    );
    setIsSending(false);

    if (result.gameId && result.inviteCode) {
      setGeneratedInvite({ code: result.inviteCode, gameId: result.gameId });
      setIsWaitingForFriend(true);

      // Listen for when friend enters the room via Realtime
      const channel = supabase
        .channel(`room_wait_${result.gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${result.gameId}`,
          },
          (payload) => {
            const updated = payload.new as any;
            if (updated.status === 'active' || !!updated.black_player_id) {
              cleanupRoomWait();
              onClose();
              onChallengeCreated(result.gameId, result.inviteCode, 'Friend');
            }
          }
        )
        .subscribe();

      roomRealtimeRef.current = channel;

      // Polling fallback every 1200ms
      roomWaitPollRef.current = setInterval(async () => {
        const hasJoined = await FriendService.checkRoomJoined(result.gameId);
        if (hasJoined) {
          cleanupRoomWait();
          onClose();
          onChallengeCreated(result.gameId, result.inviteCode, 'Friend');
        }
      }, 1200);
    }
  };

  // Join or create game room by 5-character code
  const handleJoinGame = async () => {
    const clean = joinCodeInput.trim().toUpperCase();

    if (clean.length !== 5) {
      setJoinStatusMessage({
        type: 'error',
        text: 'Room code must be exactly 5 letters or numbers.',
      });
      return;
    }

    if (!/^[A-Z0-9]{5}$/.test(clean)) {
      setJoinStatusMessage({
        type: 'error',
        text: 'Only letters and numbers are allowed.',
      });
      return;
    }

    setIsJoining(true);
    setJoinStatusMessage(null);

    const res = await FriendService.joinGameByCode(
      clean,
      currentUserId || 'usr_temp',
      currentUsername || 'Guest',
      selectedTc
    );

    setIsJoining(false);

    // If room is active or was joined (opponent successfully joined), enter game immediately!
    if (res.gameId && (res.status === 'active' || res.status === 'joined')) {
      cleanupRoomWait();
      onClose();
      onChallengeCreated(res.gameId, clean, 'Friend Match');
      return;
    }

    // If room did not exist yet, or was reopened for rematch, wait for friend to enter code!
    if (res.gameId && (res.status === 'created' || res.status === 'pending' || res.reopened)) {
      setGeneratedInvite({ code: clean, gameId: res.gameId });
      setIsWaitingForFriend(true);
      setJoinStatusMessage({
        type: 'info',
        text: `Room ${clean} created! Waiting for your friend to enter code ${clean}...`,
      });

      const channel = supabase
        .channel(`room_join_wait_${res.gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${res.gameId}`,
          },
          (payload) => {
            const updated = payload.new as any;
            if (updated.status === 'active' || !!updated.black_player_id) {
              cleanupRoomWait();
              onClose();
              onChallengeCreated(res.gameId!, clean, 'Friend Match');
            }
          }
        )
        .subscribe();

      roomRealtimeRef.current = channel;

      roomWaitPollRef.current = setInterval(async () => {
        const hasJoined = await FriendService.checkRoomJoined(res.gameId!);
        if (hasJoined) {
          cleanupRoomWait();
          onClose();
          onChallengeCreated(res.gameId!, clean, 'Friend Match');
        }
      }, 1200);
      return;
    }

    if (res.status === 'playing') {
      // Both players are already playing in this room
      setJoinStatusMessage({
        type: 'warning',
        text: 'Both players are already playing in this room (Game in Progress).',
      });
    } else {
      setJoinStatusMessage({
        type: 'error',
        text: res.error || 'Room code could not be opened.',
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Play a Friend</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Navigation */}
          <View style={styles.tabNavRow}>
            <TouchableOpacity
              style={[styles.tabNavBtn, activeTab === 'create' && styles.activeTabNavBtn]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabNavText, activeTab === 'create' && styles.activeTabNavText]}>
                Challenge Friend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabNavBtn, activeTab === 'join' && styles.activeTabNavBtn]}
              onPress={() => setActiveTab('join')}
            >
              <Text style={[styles.tabNavText, activeTab === 'join' && styles.activeTabNavText]}>
                Join with Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* MANDATORY TIME CONTROL SELECTOR */}
          <View style={styles.tcSection}>
            <Text style={styles.subHeader}>MANDATORY TIME CONTROL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tcScrollView}>
              <View style={styles.tcRow}>
                {STANDARD_TIME_CONTROLS.map((tc) => {
                  const isSelected = selectedTc.label === tc.label;
                  return (
                    <TouchableOpacity
                      key={tc.label}
                      style={[styles.tcPill, isSelected && styles.activeTcPill]}
                      onPress={() => setSelectedTc(tc)}
                    >
                      <Text style={[styles.tcText, isSelected && styles.activeTcText]}>
                        {tc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {activeTab === 'create' ? (
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Direct Challenge in Progress Banner */}
              {pendingChallengeInfo && (
                <View style={styles.challengeWaitCard}>
                  <View style={styles.challengeWaitHeader}>
                    <ActivityIndicator size="small" color="#81B64C" />
                    <Text style={styles.challengeWaitTitle}>
                      Challenging {pendingChallengeInfo.friendUsername}...
                    </Text>
                  </View>
                  <Text style={styles.challengeWaitDesc}>
                    An invitation was sent to {pendingChallengeInfo.friendUsername} ({selectedTc.label}). Waiting for them to accept or join...
                  </Text>
                  <Text style={styles.challengeWaitCodeText}>
                    Room Code: {pendingChallengeInfo.code}
                  </Text>
                  <TouchableOpacity
                    style={styles.cancelChallengeBtn}
                    onPress={() => {
                      if (pendingChallengeInfo) {
                        FriendService.cancelChallenge(pendingChallengeInfo.challengeId);
                      }
                      cleanupRoomWait();
                      setGeneratedInvite(null);
                      setPendingChallengeInfo(null);
                    }}
                  >
                    <Text style={styles.cancelChallengeBtnText}>Cancel Challenge</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Search Active Friends / Players */}
              <Text style={styles.subHeader}>CHALLENGE ACTIVE PLAYERS</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />

              {isSearching && (
                <ActivityIndicator size="small" color="#81B64C" style={{ marginVertical: 8 }} />
              )}

              {/* Active Users List */}
              <View style={styles.resultsList}>
                {activeUsers.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <View style={[styles.avatar, { backgroundColor: user.is_online ? '#81B64C' : '#475569' }]}>
                        <Text style={styles.avatarText}>
                          {(user.username || 'P').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.usernameText}>{user.display_name || user.username}</Text>
                        <Text style={styles.statusText}>
                          {user.is_online ? '🟢 Online & Ready' : '⚪ Offline'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.challengeBtn}
                      onPress={() => handleSendChallenge(user)}
                      disabled={isSending || isWaitingForFriend}
                    >
                      <Text style={styles.challengeBtnText}>Challenge ➔</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {activeUsers.length === 0 && !isSearching && (
                  <Text style={styles.noResults}>
                    {searchQuery.trim().length > 0
                      ? 'No player found with that username.'
                      : 'No other players currently online. Share a 5-character code below to invite a friend!'}
                  </Text>
                )}
              </View>

              {/* Shareable 5-Character Room Code Section */}
              <View style={styles.inviteSection}>
                <Text style={styles.dividerText}>── OR CREATE 5-CHARACTER ROOM CODE ──</Text>
                {generatedInvite ? (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>Share this 5-character code with your friend:</Text>
                    <Text style={styles.codeText}>{generatedInvite.code}</Text>
                    {isWaitingForFriend ? (
                      <View style={styles.waitingNotice}>
                        <ActivityIndicator size="small" color="#F59E0B" />
                        <Text style={styles.waitingText}>
                          Waiting for friend to enter code {generatedInvite.code}...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.codeSub}>Tap "Join with Code" and type {generatedInvite.code} to connect!</Text>
                    )}
                    <TouchableOpacity
                      style={styles.cancelWaitBtn}
                      onPress={() => {
                        cleanupRoomWait();
                        setGeneratedInvite(null);
                        setPendingChallengeInfo(null);
                      }}
                    >
                      <Text style={styles.cancelWaitBtnText}>✕ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerateCode}
                    disabled={isSending}
                  >
                    <Text style={styles.generateBtnText}>🔗 Generate 5-Character Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          ) : (
            /* Join Mode (5-Character Code Only) */
            <View style={styles.joinContainer}>
              {generatedInvite && isWaitingForFriend ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Room created! Waiting for your friend:</Text>
                  <Text style={styles.codeText}>{generatedInvite.code}</Text>
                  <View style={styles.waitingNotice}>
                    <ActivityIndicator size="small" color="#81B64C" />
                    <Text style={[styles.waitingText, { color: '#81B64C' }]}>
                      Share code {generatedInvite.code} with your friend to connect!
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelWaitBtn}
                    onPress={() => {
                      cleanupRoomWait();
                      setGeneratedInvite(null);
                      setJoinStatusMessage(null);
                    }}
                  >
                    <Text style={styles.cancelWaitBtnText}>✕ Enter Different Code</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.joinHelpText}>
                    Enter the 5-character room code (letters or numbers) to join or create a game room:
                  </Text>

                  <TextInput
                    style={styles.joinCodeInput}
                    placeholder="e.g. G8K2P"
                    placeholderTextColor="#666"
                    value={joinCodeInput}
                    onChangeText={(t) => {
                      const clean = t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      setJoinCodeInput(clean.substring(0, 5));
                      setJoinStatusMessage(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={5}
                  />

                  <Text style={styles.charCountText}>
                    {joinCodeInput.length}/5 Characters
                  </Text>

                  {joinStatusMessage && (
                    <View
                      style={[
                        styles.statusAlert,
                        joinStatusMessage.type === 'error' && styles.statusAlertError,
                        joinStatusMessage.type === 'warning' && styles.statusAlertWarning,
                        joinStatusMessage.type === 'info' && styles.statusAlertInfo,
                      ]}
                    >
                      <Text style={styles.statusAlertText}>{joinStatusMessage.text}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmJoinBtn,
                      joinCodeInput.length !== 5 && styles.confirmJoinBtnDisabled,
                    ]}
                    onPress={handleJoinGame}
                    disabled={isJoining || joinCodeInput.length !== 5}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmJoinBtnText}>Join / Create Room ➔</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#262421',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#999490',
    fontSize: 18,
    fontWeight: '700',
  },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1D1B',
    borderRadius: 8,
    padding: 4,
    marginBottom: 14,
  },
  tabNavBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabNavBtn: {
    backgroundColor: '#302E2B',
  },
  tabNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999490',
  },
  activeTabNavText: {
    color: '#81B64C',
  },
  tcSection: {
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999490',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tcScrollView: {
    marginBottom: 4,
  },
  tcRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tcPill: {
    backgroundColor: '#302E2B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  activeTcPill: {
    borderColor: '#81B64C',
    backgroundColor: '#3B3A36',
  },
  tcText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  activeTcText: {
    color: '#81B64C',
  },
  searchInput: {
    backgroundColor: '#302E2B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3D3A34',
    marginBottom: 10,
  },
  resultsList: {
    gap: 8,
    marginBottom: 14,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#302E2B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 11,
    color: '#999490',
  },
  challengeBtn: {
    backgroundColor: '#81B64C',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  challengeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  noResults: {
    color: '#999490',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
    lineHeight: 18,
  },
  inviteSection: {
    borderTopWidth: 1,
    borderTopColor: '#3D3A34',
    paddingTop: 12,
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#66615C',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  generateBtn: {
    backgroundColor: '#302E2B',
    borderWidth: 1.5,
    borderColor: '#81B64C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#81B64C',
    fontSize: 14,
    fontWeight: '800',
  },
  codeBox: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontSize: 12,
    color: '#999490',
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 6,
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  waitingText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  codeSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  joinBtn: {
    backgroundColor: '#81B64C',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginTop: 4,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  joinContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 14,
  },
  joinHelpText: {
    fontSize: 13,
    color: '#999490',
    textAlign: 'center',
    lineHeight: 18,
  },
  joinCodeInput: {
    backgroundColor: '#302E2B',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    width: '75%',
    borderWidth: 1.5,
    borderColor: '#81B64C',
  },
  charCountText: {
    color: '#999490',
    fontSize: 11,
    fontWeight: '600',
    marginTop: -8,
  },
  statusAlert: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '85%',
    alignItems: 'center',
  },
  statusAlertError: {
    backgroundColor: '#451A1A',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusAlertWarning: {
    backgroundColor: '#422A0C',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusAlertInfo: {
    backgroundColor: '#1E3A24',
    borderWidth: 1,
    borderColor: '#81B64C',
  },
  statusAlertText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  challengeWaitCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#81B64C',
    alignItems: 'center',
  },
  challengeWaitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  challengeWaitTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  challengeWaitDesc: {
    color: '#A0AEC0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  challengeWaitCodeText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 10,
  },
  cancelChallengeBtn: {
    backgroundColor: '#362222',
    borderWidth: 1,
    borderColor: '#7A3333',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelChallengeBtnText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelWaitBtn: {
    backgroundColor: '#332724',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5C3831',
    marginTop: 6,
  },
  cancelWaitBtnText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
  },
  confirmJoinBtn: {
    backgroundColor: '#81B64C',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    width: '75%',
    alignItems: 'center',
  },
  confirmJoinBtnDisabled: {
    opacity: 0.4,
  },
  confirmJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
