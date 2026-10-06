/**
 * useSocket.ts - Custom hook for Socket.IO game connection
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, Move } from './moves';
import type { PieceType } from './chess-types';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'server_player';
  let id = localStorage.getItem('chess_player_id');
  if (!id) {
    id = 'player_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('chess_player_id', id);
  }
  return id;
}

export interface PlayerSocketInfo {
  id: string;
  socketId: string;
  playerId: string;
  name: string;
  color: 'white' | 'black';
  connected: boolean;
}

export interface SocketMoveData {
  move: Move;
  gameState?: GameState;
  moveHistory?: Move[];
  capturedPieces?: { white: PieceType[]; black: PieceType[] };
}

export interface SocketGameUpdatedData {
  gameState?: GameState;
  players?: PlayerSocketInfo[];
  status?: string;
  winner?: PlayerSocketInfo | null;
  moveHistory?: Move[];
  capturedPieces?: { white: PieceType[]; black: PieceType[] };
}

export interface SocketGameFinishedData {
  reason: string;
  winner?: PlayerSocketInfo | null;
  loser?: PlayerSocketInfo | null;
}

export interface SocketMatchFoundData {
  roomId: string;
  color: 'white' | 'black';
  timeControl: string;
  opponentName?: string;
  gameState?: GameState;
  players?: PlayerSocketInfo[];
}

export interface SocketQueueJoinedData {
  timeControl: string;
  position: number;
}

export interface MakeMovePayload {
  roomId: string;
  move: Move;
  gameState: GameState;
  moveHistory: Move[];
  capturedPieces: { white: PieceType[]; black: PieceType[] };
}

interface GameSocketHooks {
  connected: boolean;
  socketId: string | null;
  playerId: string;
  createGame: (playerName: string) => Promise<{
    success: boolean;
    roomId?: string;
    color?: 'white' | 'black';
    gameState?: GameState;
    players?: PlayerSocketInfo[];
    error?: string;
  }>;
  joinGame: (
    roomId: string,
    playerName: string
  ) => Promise<{
    success: boolean;
    roomId?: string;
    color?: 'white' | 'black';
    gameState?: GameState;
    players?: PlayerSocketInfo[];
    moveHistory?: Move[];
    capturedPieces?: { white: PieceType[]; black: PieceType[] };
    error?: string;
  }>;
  findMatch: (
    timeControl: 'bullet' | 'blitz' | 'rapid',
    playerName: string
  ) => Promise<{
    success: boolean;
    matched: boolean;
    roomId?: string;
    error?: string;
  }>;
  cancelMatch: () => void;
  onMatchFound: (callback: (data: SocketMatchFoundData) => void) => void;
  onQueueJoined: (callback: (data: SocketQueueJoinedData) => void) => void;
  makeMove: (payload: MakeMovePayload) => Promise<{ success: boolean; error?: string }>;
  syncGameState: (roomId: string, gameState: GameState, moveHistory: Move[], capturedPieces: { white: PieceType[]; black: PieceType[] }) => void;
  updateStatus: (roomId: string, status: string, winner?: string) => void;
  resign: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  reconnectToGame: (
    roomId: string,
    playerName: string
  ) => Promise<{
    success: boolean;
    roomId?: string;
    color?: 'white' | 'black';
    gameState?: GameState;
    players?: PlayerSocketInfo[];
    moveHistory?: Move[];
    capturedPieces?: { white: PieceType[]; black: PieceType[] };
    error?: string;
  }>;
  onMoveMade: (callback: (data: SocketMoveData) => void) => void;
  onGameUpdated: (callback: (data: SocketGameUpdatedData) => void) => void;
  onPlayerDisconnected: (callback: (playerId: string) => void) => void;
  onPlayerReconnected: (callback: (data: { playerId: string; gameState?: GameState; players?: PlayerSocketInfo[] }) => void) => void;
  onGameFinished: (callback: (data: SocketGameFinishedData) => void) => void;
}

export function useSocket(): GameSocketHooks {
  const socketRef = useRef<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const playerId = useRef<string>('');
  const [playerIdState, setPlayerIdState] = useState<string>('');

  useEffect(() => {
    if (!playerId.current && typeof window !== 'undefined') {
      playerId.current = getOrCreatePlayerId();
      setPlayerIdState(playerId.current);
    }
  }, []);

  useEffect(() => {
    const socketHost = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001';
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || socketHost;

    const socketInstance = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 20,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setConnected(true);
      setSocketId(socketInstance.id ?? null);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      setSocketId(null);
    });

    socketInstance.on('connect_error', () => {
      setConnected(false);
      setSocketId(null);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const ensureConnected = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current) return false;
    if (socketRef.current.connected) return true;

    socketRef.current.connect();

    return new Promise((resolve) => {
      let settled = false;

      const onConnect = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(true);
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(false);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(socketRef.current?.connected ?? false);
      }, 3500);

      const cleanup = () => {
        clearTimeout(timer);
        socketRef.current?.off('connect', onConnect);
        socketRef.current?.off('connect_error', onError);
      };

      socketRef.current?.once('connect', onConnect);
      socketRef.current?.once('connect_error', onError);
    });
  }, []);

  const createGame = useCallback(
    (playerName: string) =>
      new Promise<{
        success: boolean;
        roomId?: string;
        color?: 'white' | 'black';
        gameState?: GameState;
        players?: PlayerSocketInfo[];
        error?: string;
      }>(async (resolve) => {
        const isConnected = await ensureConnected();
        if (!isConnected || !socketRef.current) {
          resolve({
            success: false,
            error: 'Cannot connect to server. Please ensure the multiplayer server (node server.js) is running on port 3001.',
          });
          return;
        }
        socketRef.current.emit('create_game', { playerId: playerId.current, playerName }, (response: { success: boolean; error?: string }) => {
          resolve(response || { success: false, error: 'No response from server' });
        });
      }),
    [ensureConnected]
  );

  const joinGame = useCallback(
    (roomId: string, playerName: string) =>
      new Promise<{
        success: boolean;
        roomId?: string;
        color?: 'white' | 'black';
        gameState?: GameState;
        players?: PlayerSocketInfo[];
        moveHistory?: Move[];
        capturedPieces?: { white: PieceType[]; black: PieceType[] };
        error?: string;
      }>(async (resolve) => {
        const isConnected = await ensureConnected();
        if (!isConnected || !socketRef.current) {
          resolve({
            success: false,
            error: 'Cannot connect to server. Please ensure the multiplayer server (node server.js) is running on port 3001.',
          });
          return;
        }
        socketRef.current.emit('join_game', { roomId, playerId: playerId.current, playerName }, (response: { success: boolean; error?: string }) => {
          resolve(response || { success: false, error: 'No response from server' });
        });
      }),
    [ensureConnected]
  );

  const makeMove = useCallback(
    (payload: MakeMovePayload) =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Socket disconnected' });
          return;
        }
        socketRef.current.emit('make_move', payload, (response: { success: boolean; error?: string }) => {
          resolve(response || { success: false, error: 'No response from server' });
        });
      }),
    []
  );

  const syncGameState = useCallback(
    (roomId: string, gameState: GameState, moveHistory: Move[], capturedPieces: { white: PieceType[]; black: PieceType[] }) => {
      socketRef.current?.emit('game_state_sync', roomId, gameState, moveHistory, capturedPieces, (response: { success: boolean; error?: string }) => {
        if (!response?.success && response?.error) {
          console.warn('Failed to sync game state:', response.error);
        }
      });
    },
    []
  );

  const updateStatus = useCallback((roomId: string, status: string, winner?: string) => {
    socketRef.current?.emit('update_status', roomId, status, winner);
  }, []);

  const resign = useCallback(
    (roomId: string) =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Socket disconnected' });
          return;
        }
        socketRef.current.emit('resign', roomId, (response: { success: boolean; error?: string }) => {
          resolve(response || { success: false, error: 'No response from server' });
        });
      }),
    []
  );

  const reconnectToGame = useCallback(
    (roomId: string, playerName: string) =>
      new Promise<{
        success: boolean;
        roomId?: string;
        color?: 'white' | 'black';
        gameState?: GameState;
        players?: PlayerSocketInfo[];
        moveHistory?: Move[];
        capturedPieces?: { white: PieceType[]; black: PieceType[] };
        error?: string;
      }>(async (resolve) => {
        const isConnected = await ensureConnected();
        if (!isConnected || !socketRef.current) {
          resolve({ success: false, error: 'Socket disconnected' });
          return;
        }
        socketRef.current.emit('reconnect_to_game', { roomId, playerId: playerId.current, playerName }, (response: { success: boolean; error?: string }) => {
          resolve(response || { success: false, error: 'No response from server' });
        });
      }),
    [ensureConnected]
  );

  const onMoveMade = useCallback((callback: (data: SocketMoveData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('move_made');
      socketRef.current.on('move_made', callback);
    }
  }, []);

  const onGameUpdated = useCallback((callback: (data: SocketGameUpdatedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('game_updated');
      socketRef.current.on('game_updated', callback);
    }
  }, []);

  const onPlayerDisconnected = useCallback((callback: (playerId: string) => void) => {
    if (socketRef.current) {
      socketRef.current.off('player_disconnected');
      socketRef.current.on('player_disconnected', callback);
    }
  }, []);

  const onPlayerReconnected = useCallback(
    (callback: (data: { playerId: string; gameState?: GameState; players?: PlayerSocketInfo[] }) => void) => {
      if (socketRef.current) {
        socketRef.current.off('player_reconnected');
        socketRef.current.on('player_reconnected', callback);
      }
    },
    []
  );

  const onGameFinished = useCallback((callback: (data: SocketGameFinishedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('game_finished');
      socketRef.current.on('game_finished', callback);
    }
  }, []);

  const findMatch = useCallback(
    (timeControl: 'bullet' | 'blitz' | 'rapid', playerName: string) =>
      new Promise<{ success: boolean; matched: boolean; roomId?: string; error?: string }>(async (resolve) => {
        const isConnected = await ensureConnected();
        if (!isConnected || !socketRef.current) {
          resolve({ success: false, matched: false, error: 'Socket disconnected' });
          return;
        }
        socketRef.current.emit(
          'find_match',
          { timeControl, playerId: playerId.current, playerName },
          (response: { success: boolean; matched: boolean; roomId?: string; error?: string }) => {
            resolve(response || { success: false, matched: false, error: 'No response from server' });
          }
        );
      }),
    [ensureConnected]
  );

  const cancelMatch = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('cancel_match');
    }
  }, []);

  const onMatchFound = useCallback((callback: (data: SocketMatchFoundData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('match_found');
      socketRef.current.on('match_found', callback);
    }
  }, []);

  const onQueueJoined = useCallback((callback: (data: SocketQueueJoinedData) => void) => {
    if (socketRef.current) {
      socketRef.current.off('queue_joined');
      socketRef.current.on('queue_joined', callback);
    }
  }, []);

  return {
    connected,
    socketId,
    playerId: playerIdState,
    createGame,
    joinGame,
    findMatch,
    cancelMatch,
    makeMove,
    syncGameState,
    updateStatus,
    resign,
    reconnectToGame,
    onMoveMade,
    onGameUpdated,
    onPlayerDisconnected,
    onPlayerReconnected,
    onGameFinished,
    onMatchFound,
    onQueueJoined,
  };
}
