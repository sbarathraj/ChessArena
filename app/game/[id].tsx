import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOnlineChessGame } from '../../src/services/multiplayer/useOnlineChessGame';
import { ChessBoard } from '../../src/components/chess/ChessBoard';
import { ClockView } from '../../src/components/chess/ClockView';
import { CapturedPiecesBar } from '../../src/components/chess/CapturedPiecesBar';
import { GameOverModal } from '../../src/components/chess/GameOverModal';
import { computeCapturedPieces } from '../../src/domain/chess/captured';
import { ChessGame } from '../../src/domain/chess/ChessGame';
import { useAuth } from '../../src/services/supabase/AuthContext';
import { KnightArenaTheme } from '../../src/theme/tokens';
import { Square, PieceType } from '../../src/domain/chess/types';

export default function LiveGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const {
    gameState,
    gameEngine,
    whiteDisplayMs,
    blackDisplayMs,
    lastMove,
    moveHistory,
    isThreefoldRepetition,
    error,
    whitePlayer,
    blackPlayer,
    submitOnlineMove,
    resign,
    leaveGame,
    claimTimeout,
  } = useOnlineChessGame(id || '', profile?.id);

  const [viewIndex, setViewIndex] = useState<number>(-1);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [showResignConfirm, setShowResignConfirm] = useState<boolean>(false);
  const [isModalDismissed, setIsModalDismissed] = useState<boolean>(false);
  const isDesktop = width >= 940;

  const orientation = gameState?.blackPlayerId === profile?.id ? 'b' : 'w';
  const isMyTurn = gameState?.turn === orientation && gameState?.status === 'active';

  // Display FEN and Last Move based on whether user is reviewing move history
  const displayFen = useMemo(() => {
    if (viewIndex >= 0 && viewIndex < moveHistory.length) {
      return moveHistory[viewIndex].fen;
    }
    return gameState?.fen || gameEngine.getFen();
  }, [viewIndex, moveHistory, gameState, gameEngine]);

  const displayLastMove = useMemo(() => {
    if (viewIndex >= 0 && viewIndex < moveHistory.length) {
      return { from: moveHistory[viewIndex].from, to: moveHistory[viewIndex].to };
    }
    return lastMove;
  }, [viewIndex, moveHistory, lastMove]);

  const capturedState = useMemo(() => {
    const activeGame = new ChessGame(displayFen);
    return computeCapturedPieces(activeGame);
  }, [displayFen]);

  const isInspectingHistory = viewIndex !== -1 && viewIndex < moveHistory.length - 1;

  // History Navigation Controls
  const handleStepBack = () => {
    if (moveHistory.length === 0) return;
    if (viewIndex === -1) {
      if (moveHistory.length > 1) {
        setViewIndex(moveHistory.length - 2);
      } else {
        setViewIndex(0);
      }
    } else if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
    }
  };

  const handleStepForward = () => {
    if (viewIndex === -1) {
      // Already at latest live move - NEVER jump back to 0!
      return;
    }
    if (viewIndex >= moveHistory.length - 1) {
      setViewIndex(-1);
    } else {
      setViewIndex(viewIndex + 1);
    }
  };

  const handleFirstMove = () => {
    if (moveHistory.length > 0) {
      setViewIndex(0);
    }
  };

  const handleLatestMove = () => {
    setViewIndex(-1);
  };

  const isAtStart = moveHistory.length === 0 || viewIndex === 0;
  const isAtEnd = viewIndex === -1;

  // Game Result for GameOverModal
  const gameResult = useMemo(() => {
    const isOverStatus = gameState && gameState.status !== 'active' && gameState.status !== 'pending';
    if (!isOverStatus && !isThreefoldRepetition) {
      return null;
    }

    let winner: 'w' | 'b' | 'draw' = 'draw';
    let termination = gameState?.termination || gameState?.status || 'normal';
    let description = 'Game finished.';

    // 1. Authoritative winner_id from database
    if (gameState?.winnerId) {
      if (gameState.winnerId === gameState.whitePlayerId) {
        winner = 'w';
      } else if (gameState.winnerId === gameState.blackPlayerId) {
        winner = 'b';
      }
    } else if (gameState?.status === 'timeout') {
      const timeoutWinner = gameState.winnerId
        ? (gameState.winnerId === gameState.whitePlayerId ? 'w' : 'b')
        : (gameState.turn === 'w' ? 'b' : 'w');
      winner = timeoutWinner;
      termination = 'time_forfeit';
      description = winner === orientation ? 'Opponent ran out of time. You win!' : 'You ran out of time. Opponent wins!';
    } else if (gameState?.status === 'resigned' || gameState?.status === 'resignation' || gameState?.termination === 'resignation') {
      // Opposite of the player who resigned wins
      winner = orientation === 'w' ? 'b' : 'w';
      termination = 'resignation';
      description = winner === orientation ? 'Opponent resigned. You win!' : 'You resigned. Opponent wins!';
    } else if (gameState?.status === 'abandoned' || gameState?.termination === 'abandonment') {
      winner = orientation === 'w' ? 'b' : 'w';
      termination = 'abandonment';
      description = winner === orientation ? 'Opponent left the match. You win!' : 'You left the match. Opponent wins!';
    } else if (gameState?.status === 'draw' || isThreefoldRepetition || gameState?.termination === 'threefold_repetition') {
      winner = 'draw';
      termination = 'threefold_repetition';
      description = 'Drawn by repetition.';
    } else {
      const gRes = gameEngine.getGameResult();
      if (gRes.isOver && gRes.winner) {
        winner = gRes.winner;
        termination = gRes.termination || termination;
        description = gRes.description;
      }
    }

    if (gameState?.status === 'resigned' || gameState?.status === 'resignation' || gameState?.termination === 'resignation') {
      description = winner === orientation ? 'Opponent resigned. You win!' : 'You resigned. Opponent wins!';
    } else if (gameState?.status === 'abandoned' || gameState?.termination === 'abandonment') {
      description = winner === orientation ? 'Opponent left the match. You win!' : 'You left the match. Opponent wins!';
    } else if (gameState?.status === 'timeout' || gameState?.termination === 'time_forfeit') {
      description = winner === orientation ? 'Opponent ran out of time. You win!' : 'You ran out of time. Opponent wins!';
    } else if (winner === 'draw') {
      description = 'Draw by repetition.';
    }

    return {
      isOver: true,
      winner,
      termination: termination as any,
      description,
    };
  }, [gameState, orientation, gameEngine, isThreefoldRepetition]);

  const handleBackPress = () => {
    if (gameState?.status === 'active') {
      setShowLeaveConfirm(true);
    } else {
      router.replace('/' as any);
    }
  };

  const topColor = orientation === 'w' ? 'b' : 'w';
  const bottomColor = orientation;

  const topPlayer = topColor === 'w' ? whitePlayer : blackPlayer;
  const bottomPlayer = bottomColor === 'w' ? whitePlayer : blackPlayer;

  const topName = topPlayer?.displayName || topPlayer?.username || (topColor === 'w' ? 'White' : 'Black');
  const topRating = topPlayer?.rating ?? 1500;
  const topInitial = (topPlayer?.displayName || topPlayer?.username || topColor)?.[0]?.toUpperCase() || topColor.toUpperCase();

  const bottomName = bottomPlayer?.displayName || bottomPlayer?.username || profile?.display_name || profile?.username || 'You';
  const bottomRating = bottomPlayer?.rating ?? profile?.rating ?? 1500;
  const bottomInitial = (bottomName || bottomColor)?.[0]?.toUpperCase() || bottomColor.toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Leave Confirmation Dialog during Active Play */}
      {showLeaveConfirm && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowLeaveConfirm(false)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>⚠️ Match in Progress</Text>
              <Text style={styles.confirmText}>
                You are currently in an active game. Leaving will forfeit the match and declare your opponent as the winner. Are you sure you want to leave?
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.keepPlayingBtn} onPress={() => setShowLeaveConfirm(false)}>
                  <Text style={styles.keepPlayingBtnText}>Keep Playing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.leaveResignBtn}
                  onPress={async () => {
                    setShowLeaveConfirm(false);
                    await leaveGame();
                    router.replace('/' as any);
                  }}
                >
                  <Text style={styles.leaveResignBtnText}>Forfeit & Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Resign Confirmation Dialog during Active Play */}
      {showResignConfirm && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowResignConfirm(false)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>🏳️ Resign Match?</Text>
              <Text style={styles.confirmText}>
                Are you sure you want to resign? Your opponent will be awarded the victory immediately.
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.keepPlayingBtn} onPress={() => setShowResignConfirm(false)}>
                  <Text style={styles.keepPlayingBtnText}>Keep Playing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.leaveResignBtn}
                  onPress={async () => {
                    setShowResignConfirm(false);
                    await resign();
                  }}
                >
                  <Text style={styles.leaveResignBtnText}>Yes, Resign</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Game Over Victory Dialog */}
      <GameOverModal
        visible={!!gameResult && !isModalDismissed}
        result={gameResult}
        whitePlayerName={whitePlayer?.displayName || whitePlayer?.username || 'White'}
        blackPlayerName={blackPlayer?.displayName || blackPlayer?.username || 'Black'}
        onHome={() => router.replace('/' as any)}
        onRematch={() => router.push('/play' as any)}
        onNewOpponent={() => router.replace('/' as any)}
        onClose={() => setIsModalDismissed(true)}
      />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Text style={styles.backBtnText}>◀ Arena</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Match</Text>
        {gameState?.status === 'active' ? (
          <TouchableOpacity style={styles.resignBtn} onPress={() => setShowResignConfirm(true)}>
            <Text style={styles.resignBtnText}>Resign</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Review Reopen Banner if modal was closed */}
      {isModalDismissed && !!gameResult && (
        <TouchableOpacity style={styles.reviewBanner} onPress={() => setIsModalDismissed(false)}>
          <Text style={styles.reviewBannerText}>
            🏆 Match Finished ({gameResult.winner === 'draw' ? 'Draw' : gameResult.winner === orientation ? 'Victory' : 'Defeat'}) • Tap to Reopen Result
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.stage, isDesktop && styles.desktopStage]}>
        <View style={styles.boardColumn}>
          {/* Top Player (Opponent) */}
          <View style={[styles.playerBar, gameState?.turn === topColor && gameState?.status === 'active' && styles.activePlayerBar]}>
            <View style={styles.playerInfo}>
              {topPlayer?.avatarUrl ? (
                <Image source={{ uri: topPlayer.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: topColor === 'w' ? '#E2E8F0' : '#2D3748' }]}>
                  <Text style={[styles.avatarInitial, { color: topColor === 'w' ? '#1A202C' : '#FFFFFF' }]}>{topInitial}</Text>
                </View>
              )}
              <View style={styles.nameBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>{topName}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{topRating}</Text>
                  </View>
                </View>
                <Text style={styles.playerRoleSubtext}>
                  {topColor === 'w' ? 'White' : 'Black'} • {topPlayer?.id ? 'Online' : 'Waiting...'}
                </Text>
              </View>
            </View>
            <ClockView
              remainingMs={topColor === 'w' ? whiteDisplayMs : blackDisplayMs}
              isActive={gameState?.turn === topColor && gameState?.status === 'active'}
            />
          </View>
          <CapturedPiecesBar
            color={topColor}
            capturedPieces={topColor === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured}
            advantagePoints={topColor === 'w' ? capturedState.whiteAdvantage : capturedState.blackAdvantage}
          />

          {/* Status Alert Banner */}
          <View style={[styles.statusBanner, isInspectingHistory && styles.historyBanner]}>
            <Text style={styles.statusBannerText}>
              {isInspectingHistory
                ? `Inspecting Move ${viewIndex + 1} of ${moveHistory.length} (Click ⏭ to return to live)`
                : isMyTurn
                ? 'Your turn to move!'
                : `${topName}'s turn...`}
            </Text>
          </View>

          {/* Chess Board */}
          <ChessBoard
            game={gameEngine}
            orientation={orientation}
            onMove={submitOnlineMove}
            lastMove={displayLastMove}
            disabled={!isMyTurn || isInspectingHistory}
            displayFen={displayFen}
          />

          {/* Bottom Player (Self) */}
          <View style={[styles.playerBar, gameState?.turn === bottomColor && gameState?.status === 'active' && styles.activePlayerBar]}>
            <View style={styles.playerInfo}>
              {bottomPlayer?.avatarUrl || profile?.avatar_url ? (
                <Image
                  source={{ uri: (bottomPlayer?.avatarUrl || profile?.avatar_url)! }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: bottomColor === 'w' ? '#E2E8F0' : '#2D3748' }]}>
                  <Text style={[styles.avatarInitial, { color: bottomColor === 'w' ? '#1A202C' : '#FFFFFF' }]}>{bottomInitial}</Text>
                </View>
              )}
              <View style={styles.nameBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>{bottomName}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{bottomRating}</Text>
                  </View>
                </View>
                <Text style={styles.playerRoleSubtext}>
                  {bottomColor === 'w' ? 'White' : 'Black'} (You)
                </Text>
              </View>
            </View>
            <ClockView
              remainingMs={bottomColor === 'w' ? whiteDisplayMs : blackDisplayMs}
              isActive={gameState?.turn === bottomColor && gameState?.status === 'active'}
            />
          </View>
          <CapturedPiecesBar
            color={bottomColor}
            capturedPieces={bottomColor === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured}
            advantagePoints={bottomColor === 'w' ? capturedState.whiteAdvantage : capturedState.blackAdvantage}
          />

          {/* Scrubber Controls */}
          <View style={styles.scrubberRow}>
            <TouchableOpacity
              style={[styles.scrubberBtn, isAtStart && styles.disabledScrubberBtn]}
              onPress={handleFirstMove}
              disabled={isAtStart}
            >
              <Text style={styles.scrubberText}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scrubberBtn, isAtStart && styles.disabledScrubberBtn]}
              onPress={handleStepBack}
              disabled={isAtStart}
            >
              <Text style={styles.scrubberText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scrubberBtn, isAtEnd && styles.disabledScrubberBtn]}
              onPress={handleStepForward}
              disabled={isAtEnd}
            >
              <Text style={styles.scrubberText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scrubberBtn, isAtEnd && styles.disabledScrubberBtn]}
              onPress={handleLatestMove}
              disabled={isAtEnd}
            >
              <Text style={styles.scrubberText}>⏭</Text>
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Right Column: Move Notation Table */}
        <View style={[styles.controlColumn, isDesktop && styles.desktopControl]}>
          <View style={styles.historyPanel}>
            <Text style={styles.historyTitle}>MOVES</Text>
            <ScrollView style={styles.historyScrollView} nestedScrollEnabled>
              <View style={styles.historyTable}>
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, moveNum) => {
                  const whiteMove = moveHistory[moveNum * 2];
                  const blackMove = moveHistory[moveNum * 2 + 1];
                  const isWhiteActive = viewIndex === moveNum * 2;
                  const isBlackActive = viewIndex === moveNum * 2 + 1;

                  return (
                    <View key={moveNum} style={styles.historyRow}>
                      <Text style={styles.historyNumber}>{moveNum + 1}.</Text>
                      <TouchableOpacity
                        style={[styles.sanCell, isWhiteActive && styles.activeSanCell]}
                        onPress={() => setViewIndex(moveNum * 2)}
                      >
                        <Text style={[styles.sanText, isWhiteActive && styles.activeSanText]}>
                          {whiteMove?.san || ''}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sanCell, isBlackActive && styles.activeSanCell]}
                        onPress={() => blackMove && setViewIndex(moveNum * 2 + 1)}
                      >
                        <Text style={[styles.sanText, isBlackActive && styles.activeSanText]}>
                          {blackMove?.san || ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {moveHistory.length === 0 && (
                  <Text style={styles.emptyHistory}>No moves played yet</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
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
    padding: 12,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 960,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#262421',
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  backBtnText: {
    color: '#CCCCCC',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  resignBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#362222',
    borderWidth: 1,
    borderColor: '#7A3333',
  },
  resignBtnText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
  },
  stage: {
    width: '100%',
    maxWidth: 960,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  desktopStage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  boardColumn: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
  },
  playerBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePlayerBar: {
    backgroundColor: '#2A2824',
    borderColor: '#81B64C55',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262421',
  },
  avatarInitial: {
    fontWeight: '800',
    fontSize: 15,
  },
  nameBlock: {
    flexDirection: 'column',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
    maxWidth: 160,
  },
  ratingBadge: {
    backgroundColor: '#1E1D1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  ratingText: {
    color: '#A0AEC0',
    fontSize: 11,
    fontWeight: '700',
  },
  playerRoleSubtext: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBanner: {
    width: '100%',
    backgroundColor: '#262421',
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  historyBanner: {
    backgroundColor: '#3A2E1E',
    borderColor: '#C59B27',
  },
  statusBannerText: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 13,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
    width: '100%',
  },
  scrubberBtn: {
    backgroundColor: '#262421',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  disabledScrubberBtn: {
    opacity: 0.35,
  },
  scrubberText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  timeoutBtn: {
    backgroundColor: '#81B64C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 6,
  },
  timeoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
  },
  controlColumn: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#262421',
    borderRadius: 10,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  desktopControl: {
    maxWidth: 380,
  },
  historyPanel: {
    width: '100%',
  },
  historyTitle: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  historyScrollView: {
    maxHeight: 320,
  },
  historyTable: {
    width: '100%',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#302E2B',
  },
  historyNumber: {
    width: 32,
    color: '#718096',
    fontWeight: '700',
    fontSize: 13,
  },
  sanCell: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  activeSanCell: {
    backgroundColor: '#4A5568',
  },
  sanText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSanText: {
    color: '#F6E05E',
    fontWeight: '800',
  },
  emptyHistory: {
    color: '#718096',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  confirmCard: {
    backgroundColor: '#262421',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#3D3A34',
    alignItems: 'center',
  },
  confirmTitle: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  confirmText: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  keepPlayingBtn: {
    flex: 1,
    backgroundColor: '#81B64C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  keepPlayingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  leaveResignBtn: {
    flex: 1,
    backgroundColor: '#362222',
    borderWidth: 1,
    borderColor: '#7A3333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveResignBtnText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 14,
  },
  reviewBanner: {
    backgroundColor: '#262421',
    borderWidth: 1,
    borderColor: '#81B64C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 960,
  },
  reviewBannerText: {
    color: '#81B64C',
    fontWeight: '700',
    fontSize: 13,
  },
});

