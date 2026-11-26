import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { GameResult } from '../../domain/chess/types';

interface GameOverModalProps {
  visible: boolean;
  result: GameResult | null;
  whitePlayerName: string;
  blackPlayerName: string;
  onRematch: () => void;
  onNewOpponent: () => void;
  onHome?: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  result,
  whitePlayerName,
  blackPlayerName,
  onRematch,
  onNewOpponent,
  onHome,
  onClose,
}) => {
  if (!result || !result.isOver) return null;

  const isWhiteWinner = result.winner === 'w';
  const isBlackWinner = result.winner === 'b';
  const isDraw = result.winner === 'draw';

  const winnerName = isWhiteWinner ? whitePlayerName : isBlackWinner ? blackPlayerName : null;

  const titleText = isDraw
    ? 'Draw'
    : `${winnerName} Won!`;

  const reasonText =
    result.termination === 'checkmate'
      ? 'by checkmate'
      : result.termination === 'stalemate'
      ? 'by stalemate'
      : result.termination === 'insufficient_material'
      ? 'by insufficient material'
      : result.termination === 'threefold_repetition'
      ? 'by repetition'
      : result.termination === 'fifty_moves'
      ? 'by 50-move rule'
      : result.termination === 'timeout'
      ? 'on time'
      : result.termination === 'resignation'
      ? 'by resignation'
      : result.termination === 'abandonment'
      ? 'by abandonment (opponent left)'
      : 'Game Over';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close X */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Victory Icon / Crown */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{isDraw ? '🤝' : '👑'}</Text>
          </View>

          {/* Title & Reason (Chess.com exact formatting) */}
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{reasonText}</Text>

          {/* Player Result Summary Cards */}
          <View style={styles.playersContainer}>
            {/* White Player */}
            <View style={[styles.playerItem, isWhiteWinner && styles.winnerBorder]}>
              <View style={[styles.avatarBox, { backgroundColor: '#81B64C' }]}>
                <Text style={styles.avatarLetter}>W</Text>
              </View>
              <View style={styles.playerMeta}>
                <Text style={styles.playerNameText} numberOfLines={1}>
                  {whitePlayerName}
                </Text>
                <Text style={styles.playerResultStatus}>
                  {isWhiteWinner ? 'Winner' : isDraw ? 'Draw' : 'Defeated'}
                </Text>
              </View>
              <Text style={styles.scoreText}>{isWhiteWinner ? '1' : isDraw ? '½' : '0'}</Text>
            </View>

            {/* Black Player */}
            <View style={[styles.playerItem, isBlackWinner && styles.winnerBorder]}>
              <View style={[styles.avatarBox, { backgroundColor: '#334155' }]}>
                <Text style={styles.avatarLetter}>B</Text>
              </View>
              <View style={styles.playerMeta}>
                <Text style={styles.playerNameText} numberOfLines={1}>
                  {blackPlayerName}
                </Text>
                <Text style={styles.playerResultStatus}>
                  {isBlackWinner ? 'Winner' : isDraw ? 'Draw' : 'Defeated'}
                </Text>
              </View>
              <Text style={styles.scoreText}>{isBlackWinner ? '1' : isDraw ? '½' : '0'}</Text>
            </View>
          </View>

          {/* Action Buttons (Rematch & New Opponent) */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.rematchBtn} onPress={onRematch}>
              <Text style={styles.rematchBtnText}>🔄 Rematch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newOpponentBtn} onPress={onNewOpponent}>
              <Text style={styles.newOpponentBtnText}>New Game</Text>
            </TouchableOpacity>
          </View>

          {/* Home Page Button */}
          <TouchableOpacity style={styles.homeBtn} onPress={onHome || onNewOpponent}>
            <Text style={styles.homeBtnText}>🏠 Return to Home</Text>
          </TouchableOpacity>

          {/* Review Game Button */}
          <TouchableOpacity style={styles.reviewBtn} onPress={onClose}>
            <Text style={styles.reviewBtnText}>👀 Close & Review Board</Text>
          </TouchableOpacity>
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
    padding: 16,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#262421', // Authentic Chess.com dark popup background
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    alignItems: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
    elevation: 24,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 4,
  },
  closeBtnText: {
    color: '#999490',
    fontSize: 18,
    fontWeight: '700',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(129, 182, 76, 0.15)',
    borderWidth: 2,
    borderColor: '#81B64C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999490',
    marginTop: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  playersContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#302E2B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  winnerBorder: {
    borderColor: '#81B64C',
    backgroundColor: 'rgba(129, 182, 76, 0.12)',
  },
  avatarBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  playerMeta: {
    flex: 1,
  },
  playerNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerResultStatus: {
    fontSize: 11,
    color: '#999490',
    marginTop: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  rematchBtn: {
    flex: 1,
    backgroundColor: '#81B64C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  rematchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  newOpponentBtn: {
    flex: 1,
    backgroundColor: '#302E2B',
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  newOpponentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  homeBtn: {
    backgroundColor: '#383531',
    borderWidth: 1,
    borderColor: '#4D4942',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeBtnText: {
    color: '#81B64C',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewBtn: {
    paddingVertical: 8,
  },
  reviewBtnText: {
    color: '#999490',
    fontSize: 12,
    fontWeight: '600',
  },
});
