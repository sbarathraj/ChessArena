import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../src/services/supabase/AuthContext';
import { KnightArenaTheme } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'K'}
          </Text>
        </View>
        <Text style={styles.username}>{profile?.display_name || 'Player'}</Text>
        <Text style={styles.userTag}>@{profile?.username || 'player'}</Text>
      </View>

      <View style={styles.ratingsCard}>
        <Text style={styles.sectionTitle}>Ratings</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingCategory}>Bullet</Text>
          <Text style={styles.ratingValue}>1500 ± 350</Text>
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingCategory}>Blitz</Text>
          <Text style={styles.ratingValue}>1500 ± 350</Text>
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingCategory}>Rapid</Text>
          <Text style={styles.ratingValue}>1500 ± 350</Text>
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingCategory}>Puzzles</Text>
          <Text style={styles.ratingValue}>1200</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.dangerBtn} onPress={signOut}>
          <Text style={styles.dangerBtnText}>Sign Out / Switch Player</Text>
        </TouchableOpacity>
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
  avatarCard: {
    alignItems: 'center',
    marginBottom: KnightArenaTheme.spacing.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    borderWidth: 2,
    borderColor: KnightArenaTheme.colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: KnightArenaTheme.colors.brandPrimary,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: KnightArenaTheme.colors.textPrimary,
  },
  userTag: {
    fontSize: 13,
    color: KnightArenaTheme.colors.textMuted,
  },
  ratingsCard: {
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    borderRadius: KnightArenaTheme.borderRadius.md,
    padding: KnightArenaTheme.spacing.md,
    marginBottom: KnightArenaTheme.spacing.xl,
    borderWidth: 1,
    borderColor: KnightArenaTheme.colors.surfaceBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: KnightArenaTheme.colors.brandPrimary,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: KnightArenaTheme.colors.surfaceBorder,
  },
  ratingCategory: {
    color: KnightArenaTheme.colors.textPrimary,
    fontSize: 14,
  },
  ratingValue: {
    color: KnightArenaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: KnightArenaTheme.colors.brandPrimary,
    padding: 14,
    borderRadius: KnightArenaTheme.borderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: KnightArenaTheme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: KnightArenaTheme.colors.statusDanger,
    padding: 14,
    borderRadius: KnightArenaTheme.borderRadius.md,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: KnightArenaTheme.colors.statusDanger,
    fontWeight: '700',
  },
});
