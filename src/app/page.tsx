'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense, useSyncExternalStore } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { playerNameStore } from '@/lib/playerName';
import {
  createInitialState,
  getLegalMovesForSquare,
  applyMove,
  getAllLegalMoves,
  isStalemate,
  isCheckmate,
  isFiveMoveRule,
  isKingInCheck,
  type Move,
  type GameState,
} from '@/lib/moves';
import { getAIMove, cancelAIMove, evaluateBoard } from '@/lib/ai';
import { toStandardFEN } from '@/lib/stockfish-engine';
import type { Square, PieceType } from '@/lib/chess-types';
import { formatMoveHistory, generatePgn } from '@/lib/notation';
import { useSocket } from '@/lib/useSocket';
import GameLobby from '@/components/lobby/GameLobby';
import CinematicIntro from '@/components/intro/CinematicIntro';
import Navbar from '@/components/ui/Navbar';
import PlayerCard from '@/components/game/PlayerCard';
import ChessBoard from '@/components/game/ChessBoard';
import EvaluationBar from '@/components/game/EvaluationBar';
import MoveHistoryPanel from '@/components/game/MoveHistoryPanel';
import GameControls from '@/components/game/GameControls';
import gameStyles from '@/components/game/Game.module.css';
import PawnPromotionModal from '@/components/PawnPromotionModal';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import GameInvite from '@/components/GameInvite';
import SettingsModal from '@/components/lobby/SettingsModal';
import { DEFAULT_BOARD_THEME, BOARD_THEME_STORAGE_KEY, getBoardTheme, type BoardThemeId } from '@/lib/boardThemes';
import { DEFAULT_ATMOSPHERE_THEME, ATMOSPHERE_THEME_STORAGE_KEY, getAtmosphereTheme, type AtmosphereThemeId } from '@/lib/atmosphere-themes';
import AtmosphereBackdrop from '@/components/ui/AtmosphereBackdrop';
import { analyzeGame, type GameReviewReport } from '@/lib/game-analysis';
import GameReviewModal from '@/components/game/GameReviewModal';
import ProfileModal from '@/components/lobby/ProfileModal';
import { playSound } from '@/lib/sound-effects';
import type { BotPersona } from '@/lib/bot-personas';
import type { TimeControlId } from '@/components/lobby/QuickMatchModal';

type GameMode = 'local' | 'friend' | 'ai' | null;
type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'timeout';

interface GameEndResult {
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'timeout';
  winner: 'white' | 'black' | 'draw';
  loser?: 'white' | 'black';
  details: string;
}

const INITIAL_TIME = 15 * 60; // 15 minutes in seconds

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

const CAPTURED_SYMBOLS: Record<string, string> = {
  'white-pawn': '♙',
  'white-knight': '♘',
  'white-bishop': '♗',
  'white-rook': '♖',
  'white-queen': '♕',
  'black-pawn': '♟',
  'black-knight': '♞',
  'black-bishop': '♝',
  'black-rook': '♜',
  'black-queen': '♛',
};

function playAudio(type: 'move' | 'capture' | 'check' | 'endgame' | 'lowtime') {
  playSound(type, 'wood');
}

function calculateGameStatus(state: GameState): GameStatus {
  if (isCheckmate(state)) return 'checkmate';
  if (isStalemate(state) || isFiveMoveRule(state)) return 'stalemate';
  const inCheck = isKingInCheck(state.board, state.turn);
  return inCheck ? 'check' : 'playing';
}

function ChessGame() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomIdParam = (params?.roomId as string | undefined) || searchParams?.get('room') || searchParams?.get('roomId') || undefined;

  // Sound and User State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const playerName = useSyncExternalStore(
    playerNameStore.subscribe,
    playerNameStore.get,
    playerNameStore.getServerSnapshot
  );
  const setPlayerName = (name: string) => playerNameStore.set(name);
  const [opponentName, setOpponentName] = useState<string>('Opponent');

  // Game Mode
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [aiDifficulty, setAiDifficulty] = useState<number>(3);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [connectedBanner, setConnectedBanner] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<Square>>(new Set());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [gameEndResult, setGameEndResult] = useState<GameEndResult | null>(null);
  const [moveList, setMoveList] = useState<Move[]>([]);
  const [gameStatesHistory, setGameStatesHistory] = useState<GameState[]>([createInitialState()]);

  // Timers
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [gameActive, setGameActive] = useState(false);

  // UI State
  const [showPawnPromotion, setShowPawnPromotion] = useState(false);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ type: 'resign' | 'newgame' | null }>({ type: null });
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(DEFAULT_BOARD_THEME);
  const [atmosphereTheme, setAtmosphereTheme] = useState<AtmosphereThemeId>(DEFAULT_ATMOSPHERE_THEME);

  // Load saved preferences on client mount without causing SSR hydration mismatch
  useEffect(() => {
    try {
      const savedAtmosphere = localStorage.getItem(ATMOSPHERE_THEME_STORAGE_KEY) as AtmosphereThemeId | null;
      if (savedAtmosphere) {
        const validTheme = getAtmosphereTheme(savedAtmosphere).id;
        setAtmosphereTheme(validTheme);
        document.documentElement.setAttribute('data-atmosphere', validTheme);
      }
      const savedBoard = localStorage.getItem(BOARD_THEME_STORAGE_KEY) as BoardThemeId | null;
      if (savedBoard) {
        setBoardTheme(getBoardTheme(savedBoard).id);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleAtmosphereTheme = (theme: AtmosphereThemeId) => {
    setAtmosphereTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ATMOSPHERE_THEME_STORAGE_KEY, theme);
      document.documentElement.setAttribute('data-atmosphere', theme);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-atmosphere', atmosphereTheme);
    }
  }, [atmosphereTheme]);

  const [dismissedResult, setDismissedResult] = useState(false);

  // Cinematic Broadcast Intro Animation State (plays on initial landing, smooth dissolve into lobby)
  const [showIntro, setShowIntro] = useState<boolean>(!roomIdParam);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setGameMode(null);
    setShowIntro(true);
  }, []);

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isAiThinking = gameMode === 'ai' && gameState.turn !== playerColor && gameActive && (status === 'playing' || status === 'check');

  const handleBoardTheme = (theme: BoardThemeId) => {
    setBoardTheme(theme);
    localStorage.setItem(BOARD_THEME_STORAGE_KEY, theme);
  };

  // Game Review & Matchmaking State
  const [reviewReport, setReviewReport] = useState<GameReviewReport | null>(null);
  const [isAnalyzingGame, setIsAnalyzingGame] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [, setActiveBotPersona] = useState<BotPersona | null>(null);

  // Multiplayer Hook
  const socket = useSocket();
  const hasInitializedRef = useRef(false);

  // Listen for match_found from live arena
  useEffect(() => {
    socket.onMatchFound((data: { roomId: string; color: 'white' | 'black'; opponentName?: string; gameState?: GameState }) => {
      setIsSearchingQuickMatch(false);
      setRoomId(data.roomId);
      setGameMode('friend');
      setPlayerColor(data.color);
      setOpponentName(data.opponentName || 'Opponent');
      setOpponentConnected(true);
      setGameActive(true);
      if (data.gameState) setGameState(data.gameState);
      setConnectedBanner(`⚔ Matched with ${data.opponentName || 'Opponent'}! Good luck.`);
      setTimeout(() => setConnectedBanner(null), 4000);
    });
  }, [socket]);

  // Captured Pieces
  const [capturedPieces, setCapturedPieces] = useState<{
    white: PieceType[];
    black: PieceType[];
  }>({ white: [], black: [] });

  const playAudioEffect = useCallback(
    (type: 'move' | 'capture' | 'check' | 'endgame' | 'lowtime') => {
      if (soundEnabled) {
        playAudio(type);
      }
    },
    [soundEnabled]
  );

  // Handle URL direct room link
  useEffect(() => {
    if (roomIdParam && !hasInitializedRef.current && socket.connected) {
      hasInitializedRef.current = true;
      const savedName = localStorage.getItem('playerName') || 'Ritesh';
      setPlayerName(savedName);

      socket.joinGame(roomIdParam.toUpperCase(), savedName).then((result) => {
        if (result.success && result.roomId) {
          setGameMode('friend');
          setRoomId(result.roomId);
          setPlayerColor(result.color || 'black');
          setBoardFlipped(result.color === 'black');
          if (result.gameState) setGameState(result.gameState);
          if (result.moveHistory) setMoveList(result.moveHistory);
          if (result.capturedPieces) setCapturedPieces(result.capturedPieces);
          if (result.players && result.players.length === 2) {
            setGameActive(true);
            setOpponentConnected(true);
            const opponent = result.players.find((p) => p.playerId !== socket.playerId);
            if (opponent) setOpponentName(opponent.name);
          }
        }
      });
    }
  }, [roomIdParam, socket.connected, socket]);

  // Socket event listeners
  useEffect(() => {
    socket.onMoveMade((data) => {
      if (data.gameState) {
        setGameState(data.gameState);
        if (data.moveHistory) setMoveList(data.moveHistory);
        if (data.capturedPieces) setCapturedPieces(data.capturedPieces);
        if (data.move) setLastMove({ from: data.move.from, to: data.move.to });

        const newStatus = calculateGameStatus(data.gameState);
        setStatus(newStatus);

        if (newStatus === 'checkmate') {
          const winner = data.gameState.turn === 'white' ? 'black' : 'white';
          setGameEndResult({
            reason: 'checkmate',
            winner,
            details: 'Victory by Checkmate',
          });
          playAudioEffect('endgame');
          setGameActive(false);
        } else if (newStatus === 'stalemate' || newStatus === 'draw') {
          setGameEndResult({
            reason: newStatus,
            winner: 'draw',
            details: newStatus === 'stalemate' ? 'Stalemate' : 'Match ended in a draw',
          });
          playAudioEffect('endgame');
          setGameActive(false);
        } else if (newStatus === 'check') {
          playAudioEffect('check');
        } else {
          playAudioEffect('move');
        }
      }
    });

    socket.onGameUpdated((data) => {
      if (data.gameState) setGameState(data.gameState);
      if (data.moveHistory) setMoveList(data.moveHistory);
      if (data.capturedPieces) setCapturedPieces(data.capturedPieces);

      if (data.players && data.players.length === 2) {
        setGameActive(true);
        setOpponentConnected(true);

        const me = data.players.find(
          (p) => p.playerId === socket.playerId || p.socketId === socket.socketId || p.name === playerName
        );
        const opponent = data.players.find((p) => p !== me);

        if (me && me.color) {
          setPlayerColor(me.color);
          setBoardFlipped(me.color === 'black');
        }
        if (opponent) {
          setOpponentName(opponent.name);
        }

        setConnectedBanner(`PLAYER 2 CONNECTED ✓ (${opponent ? opponent.name : 'Opponent'})`);
        setTimeout(() => setConnectedBanner(null), 3000);
      }
    });

    socket.onPlayerDisconnected(() => {
      setOpponentConnected(false);
    });

    socket.onPlayerReconnected((data) => {
      setOpponentConnected(true);
      if (data.gameState) setGameState(data.gameState);
    });

    socket.onGameFinished((data) => {
      setGameActive(false);
      if (data.reason === 'resignation') {
        const winningColor = data.winner ? data.winner.color : (playerColor === 'white' ? 'black' : 'white');
        const resigningColor = winningColor === 'white' ? 'black' : 'white';
        setStatus('resignation');
        setGameEndResult({
          reason: 'resignation',
          winner: winningColor,
          loser: resigningColor,
          details: `${resigningColor.charAt(0).toUpperCase() + resigningColor.slice(1)} Resigned`,
        });
      } else if (data.reason === 'timeout') {
        const winningColor = data.winner ? data.winner.color : (playerColor === 'white' ? 'black' : 'white');
        const timedOutColor = winningColor === 'white' ? 'black' : 'white';
        setStatus('timeout');
        setGameEndResult({
          reason: 'timeout',
          winner: winningColor,
          loser: timedOutColor,
          details: `${timedOutColor.charAt(0).toUpperCase() + timedOutColor.slice(1)} Timed Out`,
        });
      } else if (data.reason === 'checkmate') {
        const winningColor = data.winner ? data.winner.color : (gameState.turn === 'white' ? 'black' : 'white');
        setStatus('checkmate');
        setGameEndResult({
          reason: 'checkmate',
          winner: winningColor,
          details: 'Victory by Checkmate',
        });
      } else {
        const reason = data.reason === 'stalemate' ? 'stalemate' : 'draw';
        setStatus(reason);
        setGameEndResult({
          reason,
          winner: 'draw',
          details: reason === 'stalemate' ? 'Stalemate' : 'Match ended in a draw',
        });
      }
      playAudioEffect('endgame');
    });
  }, [socket, playerName, playerColor, gameState.turn, playAudioEffect]);

  // Clock tick
  useEffect(() => {
    const isClockRunning =
      gameActive &&
      (status === 'playing' || status === 'check') &&
      (gameMode !== 'friend' || opponentConnected);

    if (!isClockRunning) return;

    const timer = setInterval(() => {
      if (gameState.turn === 'white') {
        setWhiteTime((t) => {
          const newTime = Math.max(0, t - 1);
          if (newTime <= 10 && newTime > 0) {
            playAudioEffect('lowtime');
          }
          if (newTime === 0) {
            setGameActive(false);
            setStatus('timeout');
            setGameEndResult({
              reason: 'timeout',
              winner: 'black',
              loser: 'white',
              details: 'White Timed Out',
            });
            playAudioEffect('endgame');
          }
          return newTime;
        });
      } else {
        setBlackTime((t) => {
          const newTime = Math.max(0, t - 1);
          if (newTime <= 10 && newTime > 0) {
            playAudioEffect('lowtime');
          }
          if (newTime === 0) {
            setGameActive(false);
            setStatus('timeout');
            setGameEndResult({
              reason: 'timeout',
              winner: 'white',
              loser: 'black',
              details: 'Black Timed Out',
            });
            playAudioEffect('endgame');
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, status, gameState.turn, opponentConnected, gameMode, playAudioEffect]);

  const trackCapturedPiece = useCallback((move: Move, oldState: GameState): { isCapture: boolean; updatedCaptures: { white: PieceType[]; black: PieceType[] } } => {
    const movingPiece = oldState.board[move.from];
    if (!movingPiece) return { isCapture: false, updatedCaptures: capturedPieces };

    let captured: { type: PieceType; color: 'white' | 'black' } | null = null;

    if (movingPiece.type === 'pawn' && move.to === oldState.epSquare) {
      const epSq = move.to + (movingPiece.color === 'white' ? 8 : -8);
      captured = oldState.board[epSq];
    } else {
      captured = oldState.board[move.to];
    }

    if (captured) {
      const updatedCaptures = {
        ...capturedPieces,
        [movingPiece.color]: [...capturedPieces[movingPiece.color], captured.type],
      };
      setCapturedPieces(updatedCaptures);
      return { isCapture: true, updatedCaptures };
    }
    return { isCapture: false, updatedCaptures: capturedPieces };
  }, [capturedPieces]);

  const executeMove = useCallback(
    (move: Move) => {
      const { isCapture, updatedCaptures } = trackCapturedPiece(move, gameState);
      const newState = applyMove(gameState, move);
      const newMoveList = [...moveList, move];

      setGameStatesHistory((prev) => [...prev, newState]);
      setMoveList(newMoveList);
      setGameState(newState);
      setSelectedSquare(null);
      setHighlightedSquares(new Set());
      setLastMove({ from: move.from, to: move.to });

      const newStatus = calculateGameStatus(newState);
      setStatus(newStatus);

      if (newStatus === 'checkmate') {
        const winner = newState.turn === 'white' ? 'black' : 'white';
        setGameEndResult({
          reason: 'checkmate',
          winner,
          details: 'Victory by Checkmate',
        });
        playAudioEffect('endgame');
        setGameActive(false);
      } else if (newStatus === 'stalemate' || newStatus === 'draw') {
        setGameEndResult({
          reason: newStatus,
          winner: 'draw',
          details: newStatus === 'stalemate' ? 'Stalemate' : 'Match ended in a draw',
        });
        playAudioEffect('endgame');
        setGameActive(false);
      } else if (newStatus === 'check') {
        playAudioEffect('check');
      } else {
        playAudioEffect('move');
      }

      if (gameMode === 'friend' && roomId) {
        socket.makeMove({
          roomId,
          move,
          gameState: newState,
          moveHistory: newMoveList,
          capturedPieces: updatedCaptures,
        });
      }
    },
    [gameState, moveList, gameMode, roomId, socket, playAudioEffect, trackCapturedPiece]
  );

  // AI move triggering (asynchronous, non-blocking Web Worker)
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      gameState.turn !== playerColor &&
      gameActive &&
      (status === 'playing' || status === 'check')
    ) {
      const abortController = new AbortController();
      let isCurrent = true;

      getAIMove(gameState, aiDifficulty, abortController.signal)
        .then((aiMove) => {
          if (
            isCurrent &&
            !abortController.signal.aborted &&
            aiMove &&
            gameActive &&
            gameMode === 'ai'
          ) {
            executeMove(aiMove);
          }
        })
        .catch((err) => {
          console.warn('AI move error:', err);
        });

      return () => {
        isCurrent = false;
        abortController.abort();
        cancelAIMove();
      };
    }
  }, [gameState, playerColor, gameActive, gameMode, status, aiDifficulty, executeMove]);

  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (isAiThinking || (status !== 'playing' && status !== 'check')) return;
      if (gameMode === 'friend' && !opponentConnected) return;
      if (gameMode !== 'local' && gameState.turn !== playerColor) return;

      const piece = gameState.board[sq];

      // Select friendly piece
      if (piece && piece.color === (gameMode === 'local' ? gameState.turn : playerColor)) {
        setSelectedSquare(sq);
        const moves = getLegalMovesForSquare(gameState, sq);
        setHighlightedSquares(new Set(moves.map((m) => m.to)));
        return;
      }

      // Move piece if square selected
      if (selectedSquare !== null) {
        const moves = getLegalMovesForSquare(gameState, selectedSquare);
        const matchingMoves = moves.filter((m) => m.to === sq);

        if (matchingMoves.length > 0) {
          if (matchingMoves.some((m) => m.promotion)) {
            setPendingPromotionMove({ from: selectedSquare, to: sq });
            setShowPawnPromotion(true);
            return;
          }
          executeMove(matchingMoves[0]);
        } else {
          setSelectedSquare(null);
          setHighlightedSquares(new Set());
        }
      }
    },
    [gameState, selectedSquare, isAiThinking, status, gameMode, playerColor, opponentConnected, executeMove]
  );

  const handlePawnPromotion = (piece: PieceType) => {
    if (pendingPromotionMove) {
      const move: Move = {
        from: pendingPromotionMove.from,
        to: pendingPromotionMove.to,
        promotion: piece,
      };
      executeMove(move);
      setPendingPromotionMove(null);
      setShowPawnPromotion(false);
    }
  };

  const handleNewGame = () => {
    cancelAIMove();
    setShowConfirm({ type: null });
    setDismissedResult(false);
    setGameState(createInitialState());
    setSelectedSquare(null);
    setHighlightedSquares(new Set());
    setLastMove(null);
    setStatus('playing');
    setGameEndResult(null);
    setMoveList([]);
    setGameStatesHistory([createInitialState()]);
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setCapturedPieces({ white: [], black: [] });
    setGameActive(true);
  };

  const handleResign = () => {
    cancelAIMove();
    setShowConfirm({ type: null });
    const resigningColor = gameMode === 'local' ? gameState.turn : playerColor;
    const winningColor = resigningColor === 'white' ? 'black' : 'white';

    if (gameMode === 'friend' && roomId) {
      socket.resign(roomId);
    }
    setStatus('resignation');
    setGameEndResult({
      reason: 'resignation',
      winner: winningColor,
      loser: resigningColor,
      details: `${resigningColor.charAt(0).toUpperCase() + resigningColor.slice(1)} Resigned`,
    });
    setGameActive(false);
    setDismissedResult(false);
    playAudioEffect('endgame');
  };

  const handleGameModeSelect = async (mode: 'local' | 'friend' | 'create' | 'ai', difficulty?: number) => {
    cancelAIMove();
    const name = localStorage.getItem('playerName') || 'Ritesh';
    setPlayerName(name);
    setDismissedResult(false);

    if (difficulty) setAiDifficulty(difficulty);

    if (mode === 'local') {
      setGameMode('local');
      setGameActive(true);
      setPlayerColor('white');
      setBoardFlipped(false);
      setOpponentName('Friend');
    } else if (mode === 'ai') {
      setGameMode('ai');
      setGameActive(true);
      setPlayerColor('white');
      setBoardFlipped(false);
      setOpponentName(`AI Bot (${difficulty === 1 ? 'Easy' : difficulty === 5 ? 'Hard' : 'Med'})`);
    } else if (mode === 'create') {
      setIsJoining(true);
      const result = await socket.createGame(name);
      setIsJoining(false);
      if (result.success && result.roomId) {
        setGameMode('friend');
        setRoomId(result.roomId);
        setPlayerColor('white');
        setBoardFlipped(false);
        setOpponentConnected(false);
        setGameActive(false);
        setOpponentName('Waiting...');
      } else {
        alert(result.error || 'Failed to create game room.');
      }
    }
  };

  const handleJoinWithCode = async (code: string, name: string): Promise<{ success: boolean; error?: string }> => {
    setPlayerName(name);

    const result = await socket.joinGame(code, name);

    if (result.success && result.roomId) {
      setGameMode('friend');
      setRoomId(result.roomId);
      setPlayerColor(result.color || 'black');
      setBoardFlipped(result.color === 'black');
      if (result.gameState) setGameState(result.gameState);
      if (result.moveHistory) setMoveList(result.moveHistory);
      if (result.capturedPieces) setCapturedPieces(result.capturedPieces);
      if (result.players && result.players.length === 2) {
        setGameActive(true);
        setOpponentConnected(true);
        const opponent = result.players.find((p) => p.playerId !== socket.playerId);
        if (opponent) setOpponentName(opponent.name);
      }
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Unable to join game.' };
    }
  };

  const handleQuickMatch = async (timeControl: TimeControlId) => {
    setIsSearchingQuickMatch(true);
    const res = await socket.findMatch(timeControl, playerName);
    if (res.matched && res.roomId) {
      setIsSearchingQuickMatch(false);
      setRoomId(res.roomId);
      setGameMode('friend');
    }
  };

  const handleCancelQuickMatch = () => {
    socket.cancelMatch();
    setIsSearchingQuickMatch(false);
  };

  const handleSelectBotPersona = (bot: BotPersona) => {
    setActiveBotPersona(bot);
    setOpponentName(`${bot.name} (${bot.rating})`);
    setAiDifficulty(bot.skillLevel);
    handleGameModeSelect('ai', bot.skillLevel);
  };

  const handleStartGameReview = async () => {
    if (moveList.length === 0) return;
    setIsAnalyzingGame(true);
    setShowReviewModal(true);
    setAnalysisProgress({ current: 0, total: moveList.length });

    try {
      const whiteName = playerColor === 'white' ? playerName : opponentName;
      const blackName = playerColor === 'black' ? playerName : opponentName;
      const resultStr =
        gameEndResult?.winner === 'white'
          ? '1-0'
          : gameEndResult?.winner === 'black'
          ? '0-1'
          : gameEndResult?.winner === 'draw' || status === 'draw' || status === 'stalemate'
          ? '1/2-1/2'
          : status === 'checkmate'
          ? gameState.turn === 'white'
            ? '0-1'
            : '1-0'
          : '*';

      const report = await analyzeGame(moveList, {
        whiteName,
        blackName,
        result: resultStr,
        onProgress: (cur, tot) => setAnalysisProgress({ current: cur, total: tot }),
      });

      setReviewReport(report);
    } catch (err) {
      console.warn('Game analysis error:', err);
    } finally {
      setIsAnalyzingGame(false);
    }
  };

  const handleUndo = () => {
    cancelAIMove();
    if (gameStatesHistory.length <= 1 || moveList.length === 0) return;

    const stepCount = gameMode === 'ai' && gameStatesHistory.length > 2 ? 2 : 1;
    const newHistory = gameStatesHistory.slice(0, -stepCount);
    const newMoveList = moveList.slice(0, -stepCount);
    const previousState = newHistory[newHistory.length - 1];

    setGameStatesHistory(newHistory);
    setMoveList(newMoveList);
    setGameState(previousState);
    setSelectedSquare(null);
    setHighlightedSquares(new Set());
    setGameEndResult(null);

    const previousMove = newMoveList[newMoveList.length - 1];
    setLastMove(
      previousMove
        ? { from: previousMove.from, to: previousMove.to }
        : null
    );

    setStatus(calculateGameStatus(previousState));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameStatusMessage = (): string => {
    if (gameMode === 'friend' && !opponentConnected) {
      return 'Waiting for opponent to connect...';
    }
    if (status === 'resignation') {
      const winnerName = gameEndResult?.winner === 'white' ? 'White' : 'Black';
      const loserName = gameEndResult?.loser === 'white' ? 'White' : 'Black';
      return `🏆 ${winnerName.toUpperCase()} WINS — ${loserName.toUpperCase()} RESIGNED`;
    }
    if (status === 'timeout') {
      const winnerName = gameEndResult?.winner === 'white' ? 'White' : 'Black';
      return `🏆 ${winnerName.toUpperCase()} WINS ON TIME`;
    }
    if (status === 'checkmate') {
      const winner = gameState.turn === 'white' ? 'Black' : 'White';
      return `🏆 ${winner.toUpperCase()} WINS BY CHECKMATE!`;
    }
    if (status === 'stalemate') return '🤝 STALEMATE';
    if (status === 'draw') return '🤝 GAME DRAWN';
    if (isAiThinking) return `🤖 AI Computer is calculating...`;
    if (status === 'check') return `⚠️ ${gameState.turn.toUpperCase()} IS IN CHECK!`;
    return `${gameState.turn.toUpperCase()}'S TURN`;
  };

  // Material evaluation calculation
  const evalScoreCentipawns = useMemo(() => {
    return Math.round(evaluateBoard(gameState));
  }, [gameState]);

  const whiteCapturedValue = capturedPieces.white.reduce((acc, p) => acc + PIECE_VALUES[p], 0);
  const blackCapturedValue = capturedPieces.black.reduce((acc, p) => acc + PIECE_VALUES[p], 0);
  const whiteMaterialLead = whiteCapturedValue - blackCapturedValue;

  const capturedFor = (byColor: 'white' | 'black') =>
    capturedPieces[byColor].map((p) => ({
      type: p,
      symbol: CAPTURED_SYMBOLS[`${byColor === 'white' ? 'black' : 'white'}-${p}`] ?? '',
    }));

  const standardRanks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const standardFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const rankLabels = boardFlipped ? [...standardRanks].reverse() : standardRanks;
  const fileLabels = boardFlipped ? [...standardFiles].reverse() : standardFiles;

  const moveHistory = formatMoveHistory(moveList, gameStatesHistory);
  const lastMoveIndex = moveList.length - 1;

  // Top and Bottom Player determination for cards
  const topPlayerIsWhite = boardFlipped;
  const topPlayerName = topPlayerIsWhite
    ? gameMode === 'friend' ? (playerColor === 'white' ? playerName : opponentName) : 'Player 1'
    : gameMode === 'friend' ? (playerColor === 'black' ? playerName : opponentName) : (gameMode === 'ai' ? opponentName : 'Player 2');

  const topPlayerRating = topPlayerIsWhite ? '1450' : '1398';
  const topPlayerTime = topPlayerIsWhite ? whiteTime : blackTime;
  const topPlayerColor = topPlayerIsWhite ? 'white' : 'black';

  const bottomPlayerIsWhite = !boardFlipped;
  const bottomPlayerName = bottomPlayerIsWhite
    ? gameMode === 'friend' ? (playerColor === 'white' ? playerName : opponentName) : playerName
    : gameMode === 'friend' ? (playerColor === 'black' ? playerName : opponentName) : playerName;

  const bottomPlayerRating = bottomPlayerIsWhite ? '1450' : '1398';
  const bottomPlayerTime = bottomPlayerIsWhite ? whiteTime : blackTime;
  const bottomPlayerColor = bottomPlayerIsWhite ? 'white' : 'black';

  // Render Lobby when no mode is active
  if (gameMode === null) {
    return (
      <>
        {showIntro && (
          <CinematicIntro
            onComplete={handleIntroComplete}
            soundEnabled={soundEnabled}
          />
        )}
        <AtmosphereBackdrop theme={atmosphereTheme} />
        <GameLobby
          onSelectMode={handleGameModeSelect}
          onJoinWithCode={handleJoinWithCode}
          onQuickMatch={handleQuickMatch}
          isSearchingMatch={isSearchingQuickMatch}
          onCancelQuickMatch={handleCancelQuickMatch}
          onSelectBotPersona={handleSelectBotPersona}
          isLoading={isJoining}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          boardTheme={boardTheme}
          onBoardTheme={handleBoardTheme}
          atmosphereTheme={atmosphereTheme}
          onAtmosphereTheme={handleAtmosphereTheme}
          onReplayIntro={handleReplayIntro}
        />
      </>
    );
  }

  return (
    <div className={gameStyles.gamePage}>
      <AtmosphereBackdrop theme={atmosphereTheme} />
      <Navbar
        onHome={() => {
          setGameMode(null);
          setRoomId(null);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onSettings={() => setShowSettings(true)}
        onOpenProfile={() => setShowProfile(true)}
        playerName={playerName}
        leftSlot={
          <button
            className="btn"
            onClick={() => {
              setGameMode(null);
              setRoomId(null);
            }}
          >
            ← Lobby
          </button>
        }
      />

      <main className={gameStyles.gameMain}>
        {/* Connected Success Notification Banner */}
        {connectedBanner && <div className={gameStyles.banner}>{connectedBanner}</div>}

        <div className={gameStyles.gameArea}>
          {/* Board Column */}
          <div className={gameStyles.boardColumn}>
            <PlayerCard
              name={topPlayerName}
              rating={topPlayerRating}
              color={topPlayerColor}
              time={topPlayerTime}
              active={gameState.turn === topPlayerColor && gameActive}
              captured={capturedFor(topPlayerColor)}
              materialLead={topPlayerColor === 'white' ? (whiteMaterialLead > 0 ? whiteMaterialLead : null) : whiteMaterialLead < 0 ? Math.abs(whiteMaterialLead) : null}
              formatTime={formatTime}
            />

            <div className={gameStyles.boardArenaRow}>
              <EvaluationBar
                scoreCentipawns={evalScoreCentipawns}
                boardFlipped={boardFlipped}
              />
              <ChessBoard
                gameState={gameState}
                boardFlipped={boardFlipped}
                selectedSquare={selectedSquare}
                highlightedSquares={highlightedSquares}
                lastMove={lastMove}
                status={status}
                onSquareClick={handleSquareClick}
                rankLabels={rankLabels}
                fileLabels={fileLabels}
                theme={getBoardTheme(boardTheme)}
              />
            </div>

            <PlayerCard
              name={bottomPlayerName}
              rating={bottomPlayerRating}
              color={bottomPlayerColor}
              time={bottomPlayerTime}
              active={gameState.turn === bottomPlayerColor && gameActive}
              captured={capturedFor(bottomPlayerColor)}
              materialLead={bottomPlayerColor === 'white' ? (whiteMaterialLead > 0 ? whiteMaterialLead : null) : whiteMaterialLead < 0 ? Math.abs(whiteMaterialLead) : null}
              formatTime={formatTime}
            />
          </div>

          {/* Side Panel */}
          <div className={gameStyles.sidePanel}>
            <GameControls
              statusMessage={getGameStatusMessage()}
              statusKind={
                status === 'checkmate' || status === 'draw' || status === 'stalemate' || status === 'resignation' || status === 'timeout'
                  ? 'end'
                  : status === 'check'
                    ? 'check'
                    : 'normal'
              }
              canNewGame={gameMode !== 'friend'}
              canUndo={moveList.length > 0 && gameMode !== 'friend'}
              canResign={gameActive && (status === 'playing' || status === 'check')}
              onNewGame={() => setShowConfirm({ type: 'newgame' })}
              onUndo={handleUndo}
              onFlipBoard={() => setBoardFlipped((prev) => !prev)}
              onResign={() => setShowConfirm({ type: 'resign' })}
              onToggleFullscreen={handleToggleFullscreen}
            />

            <MoveHistoryPanel
              moveHistory={moveHistory}
              lastMoveIndex={lastMoveIndex}
              totalMoves={moveList.length}
              onSelectMoveIndex={(idx) => {
                if (gameStatesHistory[idx + 1]) {
                  setGameState(gameStatesHistory[idx + 1]);
                  const m = moveList[idx];
                  if (m) setLastMove({ from: m.from, to: m.to });
                }
              }}
              onFirstMove={() => {
                if (gameStatesHistory[0]) {
                  setGameState(gameStatesHistory[0]);
                  setLastMove(null);
                }
              }}
              onPrevMove={handleUndo}
              onNextMove={() => {
                if (lastMoveIndex < moveList.length - 1 && gameStatesHistory[lastMoveIndex + 2]) {
                  setGameState(gameStatesHistory[lastMoveIndex + 2]);
                  const m = moveList[lastMoveIndex + 1];
                  if (m) setLastMove({ from: m.from, to: m.to });
                }
              }}
              onLastMove={() => {
                const latest = gameStatesHistory[gameStatesHistory.length - 1];
                if (latest) {
                  setGameState(latest);
                  const m = moveList[moveList.length - 1];
                  if (m) setLastMove({ from: m.from, to: m.to });
                }
              }}
              onFlipBoard={() => setBoardFlipped((prev) => !prev)}
              onCopyPgn={() => {
                const pgn = generatePgn(moveList, gameStatesHistory, {
                  white: playerColor === 'white' ? playerName : opponentName,
                  black: playerColor === 'black' ? playerName : opponentName,
                  result:
                    gameEndResult?.winner === 'white'
                      ? '1-0'
                      : gameEndResult?.winner === 'black'
                      ? '0-1'
                      : gameEndResult?.winner === 'draw' || status === 'draw' || status === 'stalemate'
                      ? '1/2-1/2'
                      : status === 'checkmate'
                      ? gameState.turn === 'white'
                        ? '0-1'
                        : '1-0'
                      : '*',
                });
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(pgn).catch(() => {});
                }
              }}
              onCopyFen={() => {
                const fen = toStandardFEN(gameState);
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(fen).catch(() => {});
                }
              }}
            />
          </div>
        </div>

        {/* Tournament Game End Modal */}
        {!dismissedResult && (status === 'checkmate' || status === 'draw' || status === 'stalemate' || status === 'resignation' || status === 'timeout') && (
          <div className={gameStyles.resultOverlay} role="dialog" aria-modal="true" aria-label="Game Result">
            <div className={gameStyles.resultModal}>
              <div className={gameStyles.resultTrophy}>
                {status === 'draw' || status === 'stalemate' ? '🤝' : '🏆'}
              </div>
              <h2 className={gameStyles.resultTitle}>
                {status === 'draw' || status === 'stalemate' || gameEndResult?.winner === 'draw'
                  ? (status === 'stalemate' ? 'STALEMATE' : 'GAME DRAWN')
                  : `${(gameEndResult?.winner || (gameState.turn === 'white' ? 'black' : 'white')).toUpperCase()} WINS!`}
              </h2>
              <p className={gameStyles.resultSubtitle}>
                {gameEndResult?.details ||
                  (status === 'checkmate'
                    ? 'Victory by Checkmate'
                    : status === 'resignation'
                    ? 'Victory by Resignation'
                    : status === 'timeout'
                    ? 'Victory on Time'
                    : status === 'stalemate'
                    ? 'Stalemate'
                    : 'Match ended in a draw')}
              </p>

              <div className={gameStyles.resultStats}>
                <div className={gameStyles.resultStatItem}>
                  <span className={gameStyles.resultStatLabel}>Total Moves</span>
                  <span className={gameStyles.resultStatVal}>{moveList.length}</span>
                </div>
                <div className={gameStyles.resultStatItem}>
                  <span className={gameStyles.resultStatLabel}>Ending Reason</span>
                  <span className={gameStyles.resultStatVal} style={{ textTransform: 'capitalize' }}>
                    {status === 'resignation' ? 'Resignation' : status === 'timeout' ? 'Time Out' : status}
                  </span>
                </div>
              </div>

              <div className={gameStyles.resultActions}>
                {moveList.length > 0 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={handleStartGameReview}
                    style={{
                      background: 'var(--brass-burnished, #c29b48)',
                      color: '#0d1017',
                      fontWeight: 700,
                      border: '1px solid var(--brass-burnished, #c29b48)',
                    }}
                  >
                    📊 Game Review & Accuracy
                  </button>
                )}
                {gameMode !== 'friend' && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleNewGame}
                  >
                    🎮 Play Again
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setGameMode(null);
                    setRoomId(null);
                    setDismissedResult(true);
                  }}
                >
                  ← Return to Lobby
                </button>
                <button
                  type="button"
                  className="btn text-btn"
                  onClick={() => setDismissedResult(true)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}
                >
                  Review Board
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Online Match Waiting Invite Modal */}
        {gameMode === 'friend' && !opponentConnected && roomId && (
          <GameInvite
            roomId={roomId}
            playerName={playerName}
            onCopyLink={() => {}}
            waitingForOpponent={true}
            onCancel={() => {
              setGameMode(null);
              setRoomId(null);
            }}
          />
        )}

        {/* Pawn Promotion Modal */}
        {showPawnPromotion && (
          <PawnPromotionModal color={gameState.turn} onSelect={handlePawnPromotion} />
        )}

        {showSettings && (
          <SettingsModal
            tempName={playerName}
            onTempName={setPlayerName}
            onSave={() => setShowSettings(false)}
            onClose={() => setShowSettings(false)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            boardTheme={boardTheme}
            onBoardTheme={handleBoardTheme}
            atmosphereTheme={atmosphereTheme}
            onAtmosphereTheme={handleAtmosphereTheme}
            onReplayIntro={handleReplayIntro}
          />
        )}

        {/* Confirmation Dialog */}
        {showConfirm.type === 'resign' && (
          <ConfirmationDialog
            title="Resign Game"
            message="Are you sure you want to resign this game?"
            confirmText="Resign"
            confirmColor="danger"
            onConfirm={handleResign}
            onCancel={() => setShowConfirm({ type: null })}
          />
        )}

        {showConfirm.type === 'newgame' && (
          <ConfirmationDialog
            title="Start New Game"
            message="Are you sure you want to start a new game? Current board progress will reset."
            confirmText="Start New"
            onConfirm={handleNewGame}
            onCancel={() => setShowConfirm({ type: null })}
          />
        )}

        {/* Post-Game Review & Accuracy Modal */}
        {showReviewModal && (
          <GameReviewModal
            report={reviewReport}
            isAnalyzing={isAnalyzingGame}
            progress={analysisProgress}
            onClose={() => setShowReviewModal(false)}
            whitePlayerName={playerColor === 'white' ? playerName : opponentName}
            blackPlayerName={playerColor === 'black' ? playerName : opponentName}
            gameResult={
              gameEndResult?.winner === 'white'
                ? '1-0'
                : gameEndResult?.winner === 'black'
                ? '0-1'
                : gameEndResult?.winner === 'draw' || status === 'draw' || status === 'stalemate'
                ? '1/2-1/2'
                : status === 'checkmate'
                ? gameState.turn === 'white'
                  ? '0-1'
                  : '1-0'
                : '*'
            }
            onSelectMove={(idx) => {
              if (gameStatesHistory[idx + 1]) {
                setGameState(gameStatesHistory[idx + 1]);
                setShowReviewModal(false);
              }
            }}
          />
        )}

        {showProfile && (
          <ProfileModal playerName={playerName} onClose={() => setShowProfile(false)} />
        )}
      </main>
    </div>
  );
}

export default function ChessPage() {
  return (
    <Suspense fallback={<div className="container" style={{ color: '#d9a928' }}>Loading Ritesh Chess Arena...</div>}>
      <ChessGame />
    </Suspense>
  );
}
