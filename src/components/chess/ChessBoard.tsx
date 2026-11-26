import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ChessGame } from '../../domain/chess/ChessGame';
import { Square, PieceColor, PieceType, MoveDetails } from '../../domain/chess/types';
import { ChessPieceView } from './ChessPieceView';
import { playMoveSound } from '../../services/sound/SoundService';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface ChessBoardProps {
  game: ChessGame;
  orientation?: PieceColor;
  onMove?: (move: MoveDetails) => void;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  displayFen?: string;
  hintSquares?: { from?: Square; to?: Square } | null;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  orientation = 'w',
  onMove,
  disabled = false,
  lastMove = null,
  displayFen,
  hintSquares = null,
}) => {
  const { width } = useWindowDimensions();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Responsive board sizing
  const boardSize = useMemo(() => {
    if (width < 480) return Math.min(width - 24, 380);
    if (width < 768) return Math.min(width - 48, 480);
    return 520;
  }, [width]);

  const squareSize = boardSize / 8;

  // Active game (either historical snapshot or current game)
  const activeGame = useMemo(() => {
    if (displayFen && displayFen !== game.getFen()) {
      return new ChessGame(displayFen);
    }
    return game;
  }, [game, displayFen]);

  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare || disabled || (displayFen && displayFen !== game.getFen())) return [];
    return game.getLegalMoves(selectedSquare);
  }, [game, selectedSquare, disabled, displayFen]);

  const legalTargets = useMemo(() => {
    return new Set(legalMovesForSelected.map((m) => m.to));
  }, [legalMovesForSelected]);

  const displayedFiles = useMemo(() => {
    return orientation === 'w' ? FILES : [...FILES].reverse();
  }, [orientation]);

  const displayedRanks = useMemo(() => {
    return orientation === 'w' ? RANKS : [...RANKS].reverse();
  }, [orientation]);

  const isCheck = activeGame.isCheck();

  const handleSquarePress = useCallback(
    (sq: Square) => {
      if (disabled || (displayFen && displayFen !== game.getFen())) return;

      if (selectedSquare) {
        if (selectedSquare === sq) {
          setSelectedSquare(null);
          return;
        }

        if (legalTargets.has(sq)) {
          const move = game.makeMove(selectedSquare, sq);
          if (move) {
            setSelectedSquare(null);
            playMoveSound({ captured: !!move.captured, isCheck: move.isCheck });
            if (onMove) onMove(move);
            return;
          }
        }
      }

      const legalMoves = game.getLegalMoves(sq);
      if (legalMoves.length > 0) {
        setSelectedSquare(sq);
      } else {
        setSelectedSquare(null);
      }
    },
    [disabled, selectedSquare, legalTargets, game, onMove, displayFen]
  );

  return (
    <View style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}>
      {displayedRanks.map((rank, rankIdx) => (
        <View key={rank} style={styles.rankRow}>
          {displayedFiles.map((file, fileIdx) => {
            const sq = `${file}${rank}` as Square;
            const isLightSquare = (fileIdx + rankIdx) % 2 === 0;

            const isSelected = selectedSquare === sq;
            const isLegalTarget = legalTargets.has(sq);
            const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isDestinationSquare = lastMove && lastMove.to === sq;
            const isHintFrom = hintSquares && hintSquares.from === sq;
            const isHintTo = hintSquares && hintSquares.to === sq;

            const boardMatrix = activeGame.getBoard();
            const originalRankIdx = 8 - parseInt(rank, 10);
            const originalFileIdx = file.charCodeAt(0) - 'a'.charCodeAt(0);
            const piece = boardMatrix[originalRankIdx]?.[originalFileIdx];

            const isKingInCheck =
              isCheck &&
              piece &&
              piece.type === 'k' &&
              piece.color === activeGame.getTurn();

            return (
              <TouchableOpacity
                key={sq}
                activeOpacity={0.88}
                onPress={() => handleSquarePress(sq)}
                style={[
                  styles.square,
                  {
                    width: squareSize,
                    height: squareSize,
                    backgroundColor: isLightSquare ? '#EBECD0' : '#739552', // Classic Chess.com green board
                  },
                  isLastMoveSquare && (isLightSquare ? styles.lastMoveSquareLight : styles.lastMoveSquareDark),
                  isHintFrom && styles.hintFromSquare,
                  isHintTo && styles.hintToSquare,
                  isSelected && styles.selectedSquare,
                  isKingInCheck && styles.checkSquare,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${sq} ${piece ? `${piece.color} ${piece.type}` : 'empty'}`}
              >
                {/* Board Rank & File Coordinates */}
                {fileIdx === 0 && (
                  <Text
                    style={[
                      styles.rankCoord,
                      { color: isLightSquare ? '#739552' : '#EBECD0' },
                    ]}
                  >
                    {rank}
                  </Text>
                )}
                {rankIdx === 7 && (
                  <Text
                    style={[
                      styles.fileCoord,
                      { color: isLightSquare ? '#739552' : '#EBECD0' },
                    ]}
                  >
                    {file}
                  </Text>
                )}

                {/* Legal Move Indicators (Dot or Capture Ring) */}
                {isLegalTarget && (
                  <View
                    style={
                      piece
                        ? [
                            styles.captureRing,
                            { width: squareSize * 0.88, height: squareSize * 0.88 },
                          ]
                        : styles.legalDot
                    }
                  />
                )}

                {/* Crisp Piece View without glitchy animations */}
                {piece && (
                  <ChessPieceView
                    type={piece.type}
                    color={piece.color}
                    size={squareSize * 0.88}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  boardWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#262421',
    boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    elevation: 12,
    alignSelf: 'center',
  },
  rankRow: {
    flexDirection: 'row',
  },
  square: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedSquare: {
    backgroundColor: '#BACA44',
  },
  hintFromSquare: {
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  hintToSquare: {
    backgroundColor: 'rgba(129, 182, 76, 0.5)',
    borderWidth: 2.5,
    borderColor: '#81B64C',
  },
  lastMoveSquareLight: {
    backgroundColor: '#F7EC74',
  },
  lastMoveSquareDark: {
    backgroundColor: '#DAC343',
  },
  checkSquare: {
    backgroundColor: 'rgba(235, 97, 80, 0.85)',
  },
  legalDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    zIndex: 2,
  },
  captureRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 9999,
    zIndex: 2,
  },
  rankCoord: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 11,
    fontWeight: '800',
    userSelect: 'none',
  },
  fileCoord: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 11,
    fontWeight: '800',
    userSelect: 'none',
  },
});
