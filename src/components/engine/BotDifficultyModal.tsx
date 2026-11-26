import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { BOT_LEVELS, BotPersonality } from '../../services/engine/KnightEngine';

interface BotDifficultyModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBot: (bot: BotPersonality) => void;
}

export const BotDifficultyModal: React.FC<BotDifficultyModalProps> = ({
  visible,
  onClose,
  onSelectBot,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Choose Bot Difficulty</Text>
              <Text style={styles.subtitle}>Select a pro bot opponent to battle</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 5 Pro Bot Options */}
          <ScrollView style={styles.botList} showsVerticalScrollIndicator={false}>
            {BOT_LEVELS.map((bot) => (
              <TouchableOpacity
                key={bot.id}
                activeOpacity={0.85}
                style={styles.botCard}
                onPress={() => onSelectBot(bot)}
              >
                <View style={styles.botCardTop}>
                  <View style={styles.botTitleRow}>
                    <Text style={styles.botEmoji}>🤖</Text>
                    <Text style={styles.botName}>{bot.name}</Text>
                  </View>
                  <View style={styles.eloBadge}>
                    <Text style={styles.eloText}>{bot.rating} ELO</Text>
                  </View>
                </View>
                <Text style={styles.botDescription}>{bot.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#262421',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#999490',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#999490',
    fontWeight: '700',
  },
  botList: {
    gap: 8,
  },
  botCard: {
    backgroundColor: '#302E2B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
  },
  botCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  botTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botEmoji: {
    fontSize: 20,
  },
  botName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eloBadge: {
    backgroundColor: '#81B64C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eloText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  botDescription: {
    fontSize: 12,
    color: '#999490',
    lineHeight: 17,
  },
});
