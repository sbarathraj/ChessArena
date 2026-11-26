import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/services/supabase/AuthContext';
import { PlayFriendModal } from '../../src/components/social/PlayFriendModal';
import { BotDifficultyModal } from '../../src/components/engine/BotDifficultyModal';
import { BOT_LEVELS } from '../../src/services/engine/KnightEngine';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);

  const isDesktop = width >= 768;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Play a Friend Modal */}
      <PlayFriendModal
        visible={isFriendModalOpen}
        onClose={() => setIsFriendModalOpen(false)}
        currentUserId={profile?.id}
        currentUsername={profile?.username}
        onChallengeCreated={(gameId) => {
          setIsFriendModalOpen(false);
          router.push(`/game/${gameId}` as any);
        }}
      />

      {/* Bot Difficulty Selector Modal (Appears directly after tapping Play Computer) */}
      <BotDifficultyModal
        visible={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSelectBot={(bot) => {
          setIsBotModalOpen(false);
          router.push(`/game/vs-computer?difficulty=${bot.id}` as any);
        }}
      />

      {/* Hero Welcome Banner */}
      <View style={styles.heroSection}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.heroLogo}
            resizeMode="cover"
          />
          <View style={styles.brandTextContainer}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>CHESS ARENA</Text>
            </View>
            <Text style={styles.heroTitle}>ChessArena</Text>
          </View>
        </View>
        <Text style={styles.heroSubtitle}>
          Play chess like a grandmaster. Challenge friends with room codes, battle intelligent bots, or solve tactical puzzles!
        </Text>
      </View>

      {/* Main Options Grid */}
      <View style={[styles.optionsGrid, isDesktop && styles.desktopGrid]}>
        {/* Card 1: Play Computer (Bots) - Directly prompts BOT DIFFICULTY first */}
        <TouchableOpacity
          style={[styles.playCard, styles.playBotCard]}
          activeOpacity={0.88}
          onPress={() => setIsBotModalOpen(true)}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>🤖</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play Computer</Text>
            <Text style={styles.cardDescription}>
              Select bot difficulty (Squire 800 to Titan 2600) and battle!
            </Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Play a Friend */}
        <TouchableOpacity
          style={[styles.playCard, styles.playFriendCard]}
          activeOpacity={0.88}
          onPress={() => setIsFriendModalOpen(true)}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>🤝</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play a Friend</Text>
            <Text style={styles.cardDescription}>
              Challenge active players or join with a 5-character room code.
            </Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Play Online */}
        <TouchableOpacity
          style={[styles.playCard, styles.playOnlineCard]}
          activeOpacity={0.88}
          onPress={() => router.push('/play' as any)}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>⚡</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play Online</Text>
            <Text style={styles.cardDescription}>
              Live matchmaking against rated players worldwide.
            </Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Pass & Play (Local 2-Player) */}
        <TouchableOpacity
          style={[styles.playCard, styles.passAndPlayCard]}
          activeOpacity={0.88}
          onPress={() => router.push('/game/pass-and-play' as any)}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>👥</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Pass & Play</Text>
            <Text style={styles.cardDescription}>
              Face-to-face 2-player match on this device.
            </Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 5: Solve Puzzles */}
        <TouchableOpacity
          style={[styles.playCard, styles.puzzlesCard]}
          activeOpacity={0.88}
          onPress={() => router.push('/puzzles' as any)}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>🧩</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Solve Puzzles</Text>
            <Text style={styles.cardDescription}>
              Tactical exercises and rating challenges.
            </Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Featured Bot Showcase */}
      <View style={styles.botShowcaseSection}>
        <Text style={styles.sectionHeading}>FEATURED BOTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.botScroll}>
          {BOT_LEVELS.map((bot) => (
            <TouchableOpacity
              key={bot.id}
              style={styles.botPillCard}
              onPress={() => router.push(`/game/vs-computer?difficulty=${bot.id}` as any)}
            >
              <Text style={styles.botPillEmoji}>🤖</Text>
              <Text style={styles.botPillName}>{bot.name}</Text>
              <Text style={styles.botPillRating}>{bot.rating} ELO</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#302E2B',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    maxWidth: 800,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  heroLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5A93C',
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  heroBadge: {
    backgroundColor: 'rgba(129, 182, 76, 0.15)',
    borderWidth: 1,
    borderColor: '#81B64C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81B64C',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#999490',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 500,
    lineHeight: 20,
  },
  optionsGrid: {
    width: '100%',
    maxWidth: 800,
    gap: 12,
  },
  desktopGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playCard: {
    backgroundColor: '#262421',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  playBotCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  playFriendCard: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  playOnlineCard: {
    borderColor: '#81B64C',
    backgroundColor: 'rgba(129, 182, 76, 0.08)',
  },
  passAndPlayCard: {
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  puzzlesCard: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#302E2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 12,
    color: '#999490',
    marginTop: 2,
    lineHeight: 16,
  },
  arrowBox: {
    paddingLeft: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#999490',
  },
  botShowcaseSection: {
    width: '100%',
    maxWidth: 800,
    marginTop: 28,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999490',
    letterSpacing: 1,
    marginBottom: 12,
  },
  botScroll: {
    gap: 10,
    paddingBottom: 10,
  },
  botPillCard: {
    backgroundColor: '#262421',
    borderWidth: 1,
    borderColor: '#3D3A34',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  botPillEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  botPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botPillRating: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81B64C',
    marginTop: 2,
  },
});
