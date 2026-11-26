import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { ChessBoard } from '../../src/components/chess/ChessBoard';
import { ChessGame } from '../../src/domain/chess/ChessGame';
import { PuzzleItem, PuzzleService, PUZZLE_CATALOG } from '../../src/services/puzzles/PuzzleService';
import { MoveDetails, Square, PieceColor } from '../../src/domain/chess/types';
import { KnightArenaTheme } from '../../src/theme/tokens';
import { playMoveSound } from '../../src/services/sound/SoundService';

export default function PuzzlesScreen() {
  const { width } = useWindowDimensions();
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleItem>(PUZZLE_CATALOG[0]);
  const [game, setGame] = useState<ChessGame>(new ChessGame(PUZZLE_CATALOG[0].fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<string>('Find the best move!');
  const [isSolved, setIsSolved] = useState(false);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintSquares, setHintSquares] = useState<{ from?: Square; to?: Square } | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  const isDesktop = width >= 768;

  // Determine board orientation based on who plays first in the puzzle
  const puzzleOrientation: PieceColor = useMemo(() => {
    const turn = currentPuzzle.fen.split(' ')[1];
    return turn === 'b' ? 'b' : 'w';
  }, [currentPuzzle]);

  const currentIndex = useMemo(() => {
    return PUZZLE_CATALOG.findIndex((p) => p.id === currentPuzzle.id);
  }, [currentPuzzle]);

  // Load a new puzzle cleanly
  const loadPuzzle = useCallback((newPuzzle: PuzzleItem) => {
    setCurrentPuzzle(newPuzzle);
    setGame(new ChessGame(newPuzzle.fen));
    setMoveIndex(0);
    setIsSolved(false);
    setHintLevel(0);
    setHintSquares(null);
    setStatus('Find the best tactical move!');
  }, []);

  // Handle next puzzle navigation
  const handleNextPuzzle = () => {
    const next = PuzzleService.getNextPuzzle(currentPuzzle.id);
    loadPuzzle(next);
  };

  // Handle previous puzzle navigation
  const handlePrevPuzzle = () => {
    const prev = PuzzleService.getPrevPuzzle(currentPuzzle.id);
    loadPuzzle(prev);
  };

  // Handle random puzzle
  const handleRandomPuzzle = () => {
    const rand = PuzzleService.getRandomPuzzle(currentPuzzle.id);
    loadPuzzle(rand);
  };

  // Handle retry / reset current puzzle
  const handleRetry = () => {
    setGame(new ChessGame(currentPuzzle.fen));
    setMoveIndex(0);
    setIsSolved(false);
    setHintLevel(0);
    setHintSquares(null);
    setStatus('Find the best tactical move!');
  };

  // Handle smart Hint requested by user
  const handleGetHint = () => {
    if (isSolved) return;

    const hintInfo = PuzzleService.getHint(currentPuzzle, moveIndex);

    if (hintLevel === 0) {
      // Level 1: Highlight origin piece & show conceptual clue
      setHintLevel(1);
      setHintSquares({ from: hintInfo.pieceSquare });
      setStatus(`💡 Hint: Focus on your piece at ${hintInfo.pieceSquare.toUpperCase()}! ${hintInfo.hintText}`);
    } else {
      // Level 2: Reveal both origin piece and target destination square
      setHintLevel(2);
      setHintSquares({ from: hintInfo.pieceSquare, to: hintInfo.targetSquare });
      setStatus(`🎯 Destination: Move ${hintInfo.pieceSquare.toUpperCase()} ➔ ${hintInfo.targetSquare.toUpperCase()}!`);
    }
  };

  const handleMove = (move: MoveDetails) => {
    if (!currentPuzzle || isSolved) return;

    const isCorrect = PuzzleService.verifyMove(currentPuzzle, moveIndex, move.uci);

    if (isCorrect) {
      const nextIndex = moveIndex + 1;
      setMoveIndex(nextIndex);
      setHintSquares(null); // Clear hint on correct move

      if (nextIndex >= currentPuzzle.moves.length) {
        setIsSolved(true);
        setStatus('🎉 Puzzle Solved! Brilliant tactic!');
        setSolvedCount((c) => c + 1);
        setCurrentStreak((s) => s + 1);
      } else {
        setStatus('⚡ Best move! Opponent replying...');
        // Automated opponent response from solution
        setTimeout(() => {
          const opponentUci = currentPuzzle.moves[nextIndex];
          const from = opponentUci.slice(0, 2) as Square;
          const to = opponentUci.slice(2, 4) as Square;
          const promo = (opponentUci.slice(4, 5) || 'q') as any;
          const executed = game.makeMove(from, to, promo);
          if (executed) {
            playMoveSound({ captured: !!executed.captured, isCheck: executed.isCheck });
          }
          setMoveIndex(nextIndex + 1);
          setStatus('Your turn. Complete the winning line!');
        }, 500);
      }
    } else {
      setStatus('❌ Incorrect move. Try again or tap Hint!');
      setCurrentStreak(0); // Reset streak on error
      // Reset position to previous state
      setTimeout(() => {
        const resetGame = new ChessGame(currentPuzzle.fen);
        for (let i = 0; i < moveIndex; i++) {
          const uci = currentPuzzle.moves[i];
          resetGame.makeMove(
            uci.slice(0, 2) as Square,
            uci.slice(2, 4) as Square,
            (uci.slice(4, 5) || 'q') as any
          );
        }
        setGame(resetGame);
      }, 700);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Card: Title, Rating, Themes & Streak */}
      <View style={[styles.headerCard, isDesktop && styles.desktopHeaderCard]}>
        <View style={styles.titleRow}>
          <View>
            <View style={styles.puzzleIndexBadge}>
              <Text style={styles.puzzleIndexText}>
                PUZZLE {currentIndex + 1} OF {PUZZLE_CATALOG.length}
              </Text>
            </View>
            <Text style={styles.puzzleTitle}>{currentPuzzle.title}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>⚡ {currentPuzzle.rating}</Text>
          </View>
        </View>

        {/* Themes and Perspective */}
        <View style={styles.metaRow}>
          <View style={styles.themesContainer}>
            {currentPuzzle.themes.map((t, idx) => (
              <View key={idx} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>
              🔥 Streak: {currentStreak} | Solved: {solvedCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Dynamic Status / Clue Banner */}
      <View style={[styles.statusBanner, isSolved && styles.solvedBanner]}>
        <Text style={[styles.statusText, isSolved && styles.solvedText]}>
          {status}
        </Text>
        {isSolved && (
          <TouchableOpacity style={styles.nextBannerBtn} onPress={handleNextPuzzle}>
            <Text style={styles.nextBannerBtnText}>Next Puzzle ➔</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Interactive Chessboard */}
      <ChessBoard
        game={game}
        orientation={puzzleOrientation}
        onMove={handleMove}
        disabled={isSolved}
        hintSquares={hintSquares}
      />

      {/* Control Buttons Row: Move Puzzle & Hint */}
      <View style={[styles.controlsCard, isDesktop && styles.desktopControlsCard]}>
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handlePrevPuzzle}
            accessibilityLabel="Previous Puzzle"
          >
            <Text style={styles.navBtnText}>⏮ Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.hintBtn]}
            onPress={handleGetHint}
            disabled={isSolved}
          >
            <Text style={styles.hintBtnText}>
              {hintLevel === 0 ? '💡 Hint' : hintLevel === 1 ? '🎯 Target Hint' : '💡 Solved'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={handleRetry}>
            <Text style={styles.navBtnText}>🔄 Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={handleRandomPuzzle}>
            <Text style={styles.navBtnText}>🎲 Random</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.nextBtn]}
            onPress={handleNextPuzzle}
            accessibilityLabel="Next Puzzle"
          >
            <Text style={styles.nextBtnText}>Next ⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161512',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#262421',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    width: '100%',
    maxWidth: 520,
    marginBottom: 12,
  },
  desktopHeaderCard: {
    maxWidth: 540,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  puzzleIndexBadge: {
    backgroundColor: '#302E2B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  puzzleIndexText: {
    color: '#81B64C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  puzzleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratingBadgeText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  themeTag: {
    backgroundColor: '#302E2B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  themeTagText: {
    color: '#999490',
    fontSize: 11,
    fontWeight: '600',
  },
  statsBadge: {
    backgroundColor: '#1E1C18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBanner: {
    backgroundColor: '#262421',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solvedBanner: {
    borderColor: '#81B64C',
    backgroundColor: 'rgba(129, 182, 76, 0.12)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  solvedText: {
    color: '#81B64C',
    fontSize: 15,
  },
  nextBannerBtn: {
    marginTop: 8,
    backgroundColor: '#81B64C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  nextBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  controlsCard: {
    backgroundColor: '#262421',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    width: '100%',
    maxWidth: 520,
    marginTop: 14,
  },
  desktopControlsCard: {
    maxWidth: 540,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#302E2B',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  navBtnText: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtn: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtn: {
    backgroundColor: '#F59E0B',
  },
  hintBtnText: {
    color: '#161512',
    fontWeight: '800',
    fontSize: 13,
  },
  nextBtn: {
    backgroundColor: '#81B64C',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
