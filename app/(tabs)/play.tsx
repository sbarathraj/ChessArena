import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { STANDARD_TIME_CONTROLS, TimeControl } from '../../src/domain/chess/types';
import { MatchmakingService } from '../../src/services/matchmaking/MatchmakingService';
import { useAuth } from '../../src/services/supabase/AuthContext';
import { KnightArenaTheme } from '../../src/theme/tokens';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase/client';

export default function PlayScreen() {
  const { profile, isGuest } = useAuth();
  const [selectedTc, setSelectedTc] = useState<TimeControl>(STANDARD_TIME_CONTROLS[2]); // 3 min Blitz
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  const cleanupSearch = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupSearch();
    };
  }, []);

  const handleStartMatchmaking = async () => {
    const userId = profile?.id;
    if (!userId) {
      setSearchStatus('Please set a username before playing online.');
      return;
    }

    setIsSearching(true);
    setSearchStatus('Entering matchmaking queue...');

    try {
      const res = await MatchmakingService.joinQueue({
        userId,
        username: profile?.display_name || profile?.username || 'Player',
        userRating: 1500,
        userRd: 150,
        timeControl: selectedTc,
        isRated: !isGuest,
      });

      if (res.matchedGameId) {
        setIsSearching(false);
        cleanupSearch();
        router.push(`/game/${res.matchedGameId}` as any);
        return;
      }

      setSearchStatus('Searching for worthy opponent (±200 rating)...');

      // 1. Setup Supabase Realtime listener for game creation
      const channel = supabase
        .channel(`matchmaking_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'games',
          },
          (payload) => {
            const newGame = payload.new as any;
            if (newGame.white_player_id === userId || newGame.black_player_id === userId) {
              cleanupSearch();
              setIsSearching(false);
              router.push(`/game/${newGame.id}` as any);
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;

      // 2. High-reliability polling fallback every 1200ms
      pollIntervalRef.current = setInterval(async () => {
        const foundGameId = await MatchmakingService.checkMatch(userId);
        if (foundGameId) {
          cleanupSearch();
          setIsSearching(false);
          router.push(`/game/${foundGameId}` as any);
        }
      }, 1200);

    } catch (err: any) {
      cleanupSearch();
      setIsSearching(false);
      setSearchStatus('Matchmaking error. Please retry.');
    }
  };

  const handleCancelSearch = async () => {
    cleanupSearch();
    if (profile?.id) {
      await MatchmakingService.leaveQueue(profile.id);
    }
    setIsSearching(false);
    setSearchStatus(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Time Controls</Text>
      <View style={styles.tcGrid}>
        {STANDARD_TIME_CONTROLS.map((tc) => {
          const isSelected = selectedTc.label === tc.label;
          return (
            <TouchableOpacity
              key={tc.label}
              onPress={() => setSelectedTc(tc)}
              style={[styles.tcCard, isSelected && styles.selectedTcCard]}
            >
              <Text style={[styles.tcLabel, isSelected && styles.selectedTcLabel]}>
                {tc.label}
              </Text>
              <Text style={styles.tcCategory}>{tc.category.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.matchmakingSection}>
        {isSearching ? (
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color={KnightArenaTheme.colors.brandPrimary} />
            <Text style={styles.searchingText}>{searchStatus}</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSearch}>
              <Text style={styles.cancelBtnText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.playBtn} onPress={handleStartMatchmaking}>
            <Text style={styles.playBtnText}>Play {selectedTc.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KnightArenaTheme.colors.backgroundDark,
  },
  content: {
    padding: KnightArenaTheme.spacing.md,
  },
  heading: {
    fontSize: KnightArenaTheme.typography.title.fontSize,
    fontWeight: '700',
    color: KnightArenaTheme.colors.textPrimary,
    marginBottom: KnightArenaTheme.spacing.md,
  },
  tcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tcCard: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    padding: KnightArenaTheme.spacing.md,
    borderRadius: KnightArenaTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: KnightArenaTheme.colors.surfaceBorder,
    alignItems: 'center',
  },
  selectedTcCard: {
    borderColor: KnightArenaTheme.colors.brandPrimary,
    backgroundColor: KnightArenaTheme.colors.surfaceDark,
  },
  tcLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: KnightArenaTheme.colors.textPrimary,
  },
  selectedTcLabel: {
    color: KnightArenaTheme.colors.brandPrimary,
  },
  tcCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: KnightArenaTheme.colors.textMuted,
    marginTop: 4,
  },
  matchmakingSection: {
    marginTop: KnightArenaTheme.spacing.xl,
    alignItems: 'center',
  },
  playBtn: {
    backgroundColor: KnightArenaTheme.colors.brandPrimary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: KnightArenaTheme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  searchingBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    borderRadius: KnightArenaTheme.borderRadius.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: KnightArenaTheme.colors.surfaceBorder,
  },
  searchingText: {
    color: KnightArenaTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelBtn: {
    backgroundColor: KnightArenaTheme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: KnightArenaTheme.colors.surfaceBorder,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: KnightArenaTheme.borderRadius.md,
  },
  cancelBtnText: {
    color: KnightArenaTheme.colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});
