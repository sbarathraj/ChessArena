import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChessPieceView } from './ChessPieceView';
import { PieceType, PieceColor } from '../../domain/chess/types';
import { KnightArenaTheme } from '../../theme/tokens';

const ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

interface CapturedPiecesBarProps {
  color: PieceColor; // color of the pieces that were captured
  capturedPieces: PieceType[];
  advantagePoints?: number;
}

export const CapturedPiecesBar: React.FC<CapturedPiecesBarProps> = ({
  color,
  capturedPieces,
  advantagePoints = 0,
}) => {
  // Sort pieces by standard value
  const sorted = [...capturedPieces].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
  );

  return (
    <View style={styles.container}>
      <View style={styles.piecesRow}>
        {sorted.map((type, idx) => (
          <View key={`${type}_${idx}`} style={styles.pieceSlot}>
            <ChessPieceView type={type} color={color} size={22} />
          </View>
        ))}
        {sorted.length === 0 && (
          <Text style={styles.emptyText}>No captures</Text>
        )}
      </View>
      {advantagePoints > 0 && (
        <View style={styles.advantageBadge}>
          <Text style={styles.advantageText}>+{advantagePoints}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: KnightArenaTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 32,
    marginVertical: 4,
  },
  piecesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 1,
  },
  pieceSlot: {
    marginRight: -4,
  },
  emptyText: {
    fontSize: 11,
    color: KnightArenaTheme.colors.textMuted,
    fontStyle: 'italic',
  },
  advantageBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  advantageText: {
    fontSize: 11,
    fontWeight: '800',
    color: KnightArenaTheme.colors.brandPrimary,
  },
});
