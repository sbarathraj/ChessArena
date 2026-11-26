import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChessBoard } from '../../src/components/chess/ChessBoard';
import { ChessGame } from '../../src/domain/chess/ChessGame';
import { MoveDetails, Square, GameResult } from '../../src/domain/chess/types';
import { KnightEngine, BOT_LEVELS, BotDifficulty } from '../../src/services/engine/KnightEngine';
import { CapturedPiecesBar } from '../../src/components/chess/CapturedPiecesBar';
import { computeCapturedPieces } from '../../src/domain/chess/captured';
import { GameOverModal } from '../../src/components/chess/GameOverModal';
import { useAuth } from '../../src/services/supabase/AuthContext';

interface HistorySnapshot {
  fen: string;
  san: string;
  from: Square;
  to: Square;
}

export default function VsComputerScreen() {
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ difficulty?: string }>();
  const initialDifficulty = (params.difficulty as BotDifficulty) || 'casual';

  const [game] = useState(() => new ChessGame());
  const selectedBot = initialDifficulty;
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [statusMessage, setStatusMessage] = useState('White to move');
  const [isThinking, setIsThinking] = useState(false);

  // Game Over Modal State
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isGameOverModalVisible, setIsGameOverModalVisible] = useState(false);

  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [viewIndex, setViewIndex] = useState<number>(-1);

  const isDesktop = width >= 940;
  const activeBot = BOT_LEVELS.find((b) => b.id === selectedBot) || BOT_LEVELS[1];

  const displayFen = useMemo(() => {
    if (viewIndex >= 0 && viewIndex < history.length) {
      return history[viewIndex].fen;
    }
    return game.getFen();
  }, [viewIndex, history, game]);

  const displayLastMove = useMemo(() => {
    if (viewIndex >= 0 && viewIndex < history.length) {
      return { from: history[viewIndex].from, to: history[viewIndex].to };
    }
    return lastMove;
  }, [viewIndex, history, lastMove]);

  const capturedState = useMemo(() => {
    const activeGame = new ChessGame(displayFen);
    return computeCapturedPieces(activeGame);
  }, [displayFen]);

  const handlePlayerMove = async (move: MoveDetails) => {
    if (viewIndex !== -1) setViewIndex(-1);

    const updatedHistory: HistorySnapshot[] = [
      ...history,
      { fen: move.fenAfter, san: move.san, from: move.from, to: move.to },
    ];
    setLastMove({ from: move.from, to: move.to });
    setHistory(updatedHistory);

    const result = game.getGameResult();
    if (result.isOver) {
      setStatusMessage(result.description);
      setGameResult(result);
      setTimeout(() => setIsGameOverModalVisible(true), 400);
      return;
    }

    setIsThinking(true);
    setStatusMessage(`${activeBot.name} is thinking...`);

    // 800ms human-like hesitation pacing
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const uciHistory = updatedHistory.map((h) => `${h.from}${h.to}`);
      let engineMove = await KnightEngine.findMoveAsync(game, selectedBot, uciHistory);
      if (!engineMove) {
        const legalMoves = game.getLegalMoves();
        if (legalMoves.length > 0) {
          engineMove = legalMoves[0];
        }
      }
      if (engineMove) {
        const executed = game.makeMove(engineMove.from, engineMove.to, engineMove.promotion);
        if (executed) {
          setLastMove({ from: executed.from, to: executed.to });
          setHistory([
            ...updatedHistory,
            { fen: executed.fenAfter, san: executed.san, from: executed.from, to: executed.to },
          ]);
          const postResult = game.getGameResult();
          if (postResult.isOver) {
            setStatusMessage(postResult.description);
            setGameResult(postResult);
            // Trigger authentic Chess.com Game Over victory dialog
            setTimeout(() => setIsGameOverModalVisible(true), 400);
          } else {
            setStatusMessage(`Your turn vs ${activeBot.name}`);
          }
        }
      }
    } catch {
      try {
        const legal = game.getLegalMoves();
        if (legal.length > 0) {
          const fallback = legal[0];
          const executed = game.makeMove(fallback.from, fallback.to, fallback.promotion);
          if (executed) {
            setLastMove({ from: executed.from, to: executed.to });
            setHistory([
              ...updatedHistory,
              { fen: executed.fenAfter, san: executed.san, from: executed.from, to: executed.to },
            ]);
            setStatusMessage(`Your turn vs ${activeBot.name}`);
          }
        }
      } catch {
        setStatusMessage('White to move');
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleReset = () => {
    game.reset();
    setLastMove(null);
    setHistory([]);
    setViewIndex(-1);
    setGameResult(null);
    setIsGameOverModalVisible(false);
    setStatusMessage('White to move. Good luck!');
  };

  const handleStepBack = () => {
    if (history.length === 0) return;
    if (viewIndex === -1) {
      if (history.length > 1) {
        setViewIndex(history.length - 2);
      } else {
        setViewIndex(0);
      }
    } else if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
    }
  };

  const handleStepForward = () => {
    if (viewIndex === -1) {
      // Already at the latest live position - do not jump back to 0!
      return;
    }
    if (viewIndex >= history.length - 1) {
      setViewIndex(-1);
    } else {
      setViewIndex(viewIndex + 1);
    }
  };

  const handleFirstMove = () => {
    if (history.length > 0) {
      setViewIndex(0);
    }
  };

  const handleLatestMove = () => {
    setViewIndex(-1);
  };

  const isAtStart = history.length === 0 || viewIndex === 0;
  const isAtEnd = viewIndex === -1;

  const isInspectingHistory = viewIndex !== -1 && viewIndex < history.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Authentic Chess.com Game Over Modal */}
      <GameOverModal
        visible={isGameOverModalVisible}
        result={gameResult}
        whitePlayerName={profile?.display_name || 'You'}
        blackPlayerName={activeBot.name}
        onRematch={handleReset}
        onNewOpponent={() => router.push('/' as any)}
        onHome={() => router.replace('/' as any)}
        onClose={() => setIsGameOverModalVisible(false)}
      />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>◀ Back to Home</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{activeBot.name}</Text>
          <Text style={styles.headerSubtitle}>{activeBot.rating} ELO</Text>
        </View>
        <TouchableOpacity style={styles.resignBtn} onPress={handleReset}>
          <Text style={styles.resignBtnText}>Restart</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.stage, isDesktop && styles.desktopStage]}>
        {/* Left Column: Distraction-free Board */}
        <View style={styles.boardColumn}>
          {/* Top Player (Black Bot) Bar */}
          <View style={styles.playerBar}>
            <View style={styles.playerInfo}>
              <View style={[styles.avatarCircle, { backgroundColor: '#334155' }]}>
                <Text style={styles.avatarInitial}>🤖</Text>
              </View>
              <Text style={styles.playerName}>{activeBot.name}</Text>
              <Text style={styles.eloBadge}>{activeBot.rating} ELO</Text>
            </View>
            <CapturedPiecesBar
              color="w"
              capturedPieces={capturedState.whiteCaptured}
              advantagePoints={capturedState.blackAdvantage}
            />
          </View>

          {/* Status Alert Banner */}
          <View style={[styles.statusBanner, isInspectingHistory && styles.historyBanner]}>
            {isThinking && (
              <ActivityIndicator size="small" color="#81B64C" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.statusBannerText}>
              {isInspectingHistory
                ? `Inspecting Move ${viewIndex + 1} of ${history.length} (Click ⏭ to return to live)`
                : statusMessage}
            </Text>
          </View>

          {/* Chess Board */}
          <ChessBoard
            game={game}
            orientation="w"
            onMove={handlePlayerMove}
            lastMove={displayLastMove}
            disabled={isThinking || isInspectingHistory || (gameResult?.isOver ?? false)}
            displayFen={displayFen}
          />

          {/* Bottom Player (You White) Bar */}
          <View style={styles.playerBar}>
            <View style={styles.playerInfo}>
              <View style={[styles.avatarCircle, { backgroundColor: '#81B64C' }]}>
                <Text style={styles.avatarInitial}>W</Text>
              </View>
              <Text style={styles.playerName}>{profile?.display_name || 'You (White)'}</Text>
            </View>
            <CapturedPiecesBar
              color="b"
              capturedPieces={capturedState.blackCaptured}
              advantagePoints={capturedState.whiteAdvantage}
            />
          </View>

          {/* Move Replay Scrub Controls (⏮ ◀ ▶ ⏭) */}
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
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Column: Opponent Details & Move Notation */}
        <View style={[styles.controlColumn, isDesktop && styles.desktopControl]}>
          <View style={styles.botProfileCard}>
            <Text style={styles.profileBotName}>{activeBot.name}</Text>
            <Text style={styles.profileBotRating}>{activeBot.rating} ELO Rating</Text>
            <Text style={styles.profileBotDesc}>{activeBot.description}</Text>
          </View>

          {/* Move History Notation */}
          <View style={styles.historyPanel}>
            <Text style={styles.historyTitle}>MOVES</Text>
            <ScrollView style={styles.historyScrollView} nestedScrollEnabled>
              <View style={styles.historyTable}>
                {Array.from({ length: Math.ceil(history.length / 2) }).map((_, moveNum) => {
                  const whiteMove = history[moveNum * 2];
                  const blackMove = history[moveNum * 2 + 1];
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
                {history.length === 0 && (
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
  },
  backBtn: {
    backgroundColor: '#262421',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  backBtnText: {
    color: '#81B64C',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#81B64C',
  },
  resignBtn: {
    backgroundColor: '#302E2B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  resignBtnText: {
    color: '#999490',
    fontWeight: '700',
    fontSize: 12,
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
    paddingHorizontal: 4,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eloBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81B64C',
    backgroundColor: '#262421',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262421',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    width: '100%',
  },
  historyBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  resetBtn: {
    backgroundColor: '#81B64C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginLeft: 6,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
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
  botProfileCard: {
    backgroundColor: '#302E2B',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  profileBotName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileBotRating: {
    fontSize: 12,
    fontWeight: '800',
    color: '#81B64C',
    marginTop: 2,
  },
  profileBotDesc: {
    fontSize: 12,
    color: '#999490',
    marginTop: 8,
    lineHeight: 18,
  },
  historyPanel: {
    backgroundColor: '#302E2B',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3D3A34',
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999490',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  historyScrollView: {
    maxHeight: 240,
  },
  historyTable: {
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  historyNumber: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    color: '#66615C',
  },
  sanCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  activeSanCell: {
    backgroundColor: '#403D39',
  },
  sanText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CCCCCC',
  },
  activeSanText: {
    color: '#81B64C',
  },
  emptyHistory: {
    color: '#66615C',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
});
