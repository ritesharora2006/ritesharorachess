import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createInitialState, applyMove, getLegalMovesForSquare, isCheckmate, isStalemate, isThreefoldRepetition, isFiveMoveRule, Move, GameState } from './src/lib/moves';
import type { PieceType } from './src/lib/chess-types';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Store active games
const games = new Map<string, GameRoom>();

interface PlayerSocketInfo {
  playerId: string;
  socketId: string;
  color: 'white' | 'black';
  name: string;
  connected: boolean;
  timeRemainingMs: number;
}

const TIME_CONTROLS = {
  bullet: { baseMs: 1 * 60 * 1000, incMs: 0 },
  blitz: { baseMs: 3 * 60 * 1000, incMs: 2000 },
  rapid: { baseMs: 10 * 60 * 1000, incMs: 0 },
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Matchmaking Pools
const matchmakingQueues: Record<string, { socketId: string; playerId: string; playerName: string }[]> = {
  bullet: [],
  blitz: [],
  rapid: [],
};

function removeFromAllQueues(socketId: string) {
  for (const pool of Object.values(matchmakingQueues)) {
    const idx = pool.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      pool.splice(idx, 1);
    }
  }
}

class GameRoom {
  roomId: string;
  creatorPlayerId: string;
  players: PlayerSocketInfo[];
  gameState: GameState;
  moveHistory: Move[];
  capturedPieces: { white: PieceType[]; black: PieceType[] };
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerSocketInfo | null;
  drawOffered: boolean;
  
  timeControl: 'bullet' | 'blitz' | 'rapid';
  lastMoveTimestamp: number | null;
  
  fenHistory: string[];

  constructor(roomId: string, creatorSocketId: string, creatorPlayerId: string, creatorName: string, timeControl: 'bullet' | 'blitz' | 'rapid' = 'blitz') {
    this.roomId = roomId;
    this.creatorPlayerId = creatorPlayerId;
    this.timeControl = timeControl;
    const baseTime = TIME_CONTROLS[timeControl].baseMs;
    
    this.players = [
      {
        playerId: creatorPlayerId,
        socketId: creatorSocketId,
        color: 'white',
        name: creatorName || 'Player 1',
        connected: true,
        timeRemainingMs: baseTime,
      },
    ];
    this.gameState = createInitialState();
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.createdAt = Date.now();
    this.status = 'waiting';
    this.winner = null;
    this.drawOffered = false;
    this.lastMoveTimestamp = null;
    this.fenHistory = [];
  }

  addPlayer(socketId: string, playerId: string, name: string) {
    const existing = this.players.find((p) => p.playerId === playerId);
    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      if (name) existing.name = name;
      if (this.players.length === 2 && this.status === 'waiting') {
        this.status = 'playing';
        this.lastMoveTimestamp = Date.now();
      }
      return true;
    }

    if (this.players.length >= 2) return false;

    const baseTime = TIME_CONTROLS[this.timeControl].baseMs;
    
    // Auto-assign remaining color
    const takenColor = this.players[0].color;
    const assignedColor = takenColor === 'white' ? 'black' : 'white';

    this.players.push({
      playerId,
      socketId,
      color: assignedColor,
      name: name || 'Player 2',
      connected: true,
      timeRemainingMs: baseTime,
    });
    
    this.status = 'playing';
    this.lastMoveTimestamp = Date.now();
    return true;
  }

  isFull() {
    return this.players.length >= 2;
  }

  getPlayerBySocketId(socketId: string) {
    return this.players.find(p => p.socketId === socketId);
  }

  updateClocks() {
    if (this.status !== 'playing' || !this.lastMoveTimestamp) return;
    const now = Date.now();
    const elapsed = now - this.lastMoveTimestamp;
    
    const currentPlayerTurn = this.gameState.turn;
    const activePlayer = this.players.find(p => p.color === currentPlayerTurn);
    
    if (activePlayer) {
      activePlayer.timeRemainingMs -= elapsed;
      if (activePlayer.timeRemainingMs <= 0) {
        activePlayer.timeRemainingMs = 0;
        this.status = 'finished';
        this.winner = this.players.find(p => p.color !== currentPlayerTurn) || null;
      }
    }
    this.lastMoveTimestamp = now;
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Create Game
  socket.on('create_game', (payload, callback) => {
    try {
      const { playerId, playerName, timeControl = 'blitz' } = typeof payload === 'object' ? payload : { playerName: payload, playerId: socket.id, timeControl: 'blitz' };
      
      let roomId = generateRoomCode();
      while (games.has(roomId)) {
        roomId = generateRoomCode();
      }

      const game = new GameRoom(roomId, socket.id, playerId, playerName, timeControl);
      games.set(roomId, game);

      socket.join(roomId);

      if (typeof callback === 'function') callback({
        success: true,
        roomId,
        color: game.players[0].color,
        gameState: game.gameState,
        players: game.players,
      });
      console.log(`[Game Created] Room: ${roomId} by ${playerName}`);
    } catch (error: any) {
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 2. Join Game
  socket.on('join_game', (...args: any[]) => {
    try {
      const payload = args[0];
      const callback = args.find((a) => typeof a === 'function');
      const parsedPayload =
        typeof payload === 'object' && payload !== null
          ? payload
          : { roomId: args[0], playerId: socket.id, playerName: args[1] };
      const { roomId: rawRoomId, playerId, playerName } = parsedPayload;
      const roomId = (rawRoomId || '').trim().toUpperCase();
      const game = games.get(roomId);

      if (!game) {
        if (typeof callback === 'function') callback({ success: false, error: `Room "${roomId}" not found.` });
        return;
      }

      const existingPlayer = game.players.find((p) => p.playerId === playerId);

      if (game.isFull() && !existingPlayer) {
        if (typeof callback === 'function') callback({ success: false, error: `Room "${roomId}" is full.` });
        return;
      }

      game.addPlayer(socket.id, playerId, playerName);
      socket.join(roomId);

      const currentPlayer = game.players.find((p) => p.playerId === playerId);

      io.to(roomId).emit('game_updated', {
        gameState: game.gameState,
        players: game.players,
        status: game.status,
        moveHistory: game.moveHistory,
        capturedPieces: game.capturedPieces,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomId,
          color: currentPlayer ? currentPlayer.color : 'black',
          gameState: game.gameState,
          players: game.players,
          moveHistory: game.moveHistory,
          capturedPieces: game.capturedPieces,
        });
      }
    } catch (error: any) {
      const callback = args.find((a) => typeof a === 'function');
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 3. Make Move (Server Authoritative)
  socket.on('make_move', (...args: any[]) => {
    const callback = args.find((a) => typeof a === 'function');
    try {
      const payload = args[0];
      let roomId: string;
      let move: Move;
      if (typeof payload === 'object' && payload !== null && payload.move) {
        roomId = payload.roomId;
        move = payload.move;
      } else {
        roomId = args[0];
        move = args[1];
      }
      
      const game = games.get(roomId);
      
      if (!game) {
        if (typeof callback === 'function') callback({ success: false, error: 'Game room not found' });
        return;
      }

      if (game.status !== 'playing') {
        if (typeof callback === 'function') callback({ success: false, error: 'Game is not active' });
        return;
      }

      const player = game.getPlayerBySocketId(socket.id);
      if (!player) {
        if (typeof callback === 'function') callback({ success: false, error: 'Not a player in this game' });
        return;
      }

      // Check Turn
      if (player.color !== game.gameState.turn) {
        if (typeof callback === 'function') callback({ success: false, error: 'Not your turn' });
        return;
      }

      game.updateClocks();
      if ((game.status as string) === 'finished') {
        // Clock ran out
        io.to(roomId).emit('game_finished', { reason: 'timeout', winner: game.winner, loser: player });
        if (typeof callback === 'function') callback({ success: false, error: 'Time out' });
        return;
      }

      // Validate Move
      const legalMoves = getLegalMovesForSquare(game.gameState, move.from);
      const isLegal = legalMoves.some(m => m.to === move.to && (m.promotion === move.promotion || (!m.promotion && !move.promotion)));

      if (!isLegal) {
        // Sync client back to server state
        socket.emit('game_updated', {
          gameState: game.gameState,
          players: game.players,
          status: game.status,
          moveHistory: game.moveHistory,
          capturedPieces: game.capturedPieces,
        });
        if (typeof callback === 'function') callback({ success: false, error: 'Illegal move' });
        return;
      }

      // Apply Move
      const pieceToMove = game.gameState.board[move.from];
      const targetPiece = game.gameState.board[move.to];
      
      if (targetPiece) {
         game.capturedPieces[player.color].push(targetPiece.type);
      } else if (pieceToMove?.type === 'pawn' && move.to === game.gameState.epSquare) {
         game.capturedPieces[player.color].push('pawn');
      }

      game.gameState = applyMove(game.gameState, move);
      game.moveHistory.push(move);
      
      // Add increment
      player.timeRemainingMs += TIME_CONTROLS[game.timeControl].incMs;

      // Check Game End Conditions
      let gameFinished = false;
      let reason = '';
      
      if (isCheckmate(game.gameState)) {
        game.status = 'finished';
        game.winner = player;
        gameFinished = true;
        reason = 'checkmate';
      } else if (isStalemate(game.gameState)) {
        game.status = 'finished';
        gameFinished = true;
        reason = 'stalemate';
      } else if (isFiveMoveRule(game.gameState)) {
        game.status = 'finished';
        gameFinished = true;
        reason = 'fifty-move rule';
      }

      io.to(roomId).emit('move_made', {
        move,
        gameState: game.gameState,
        moveHistory: game.moveHistory,
        capturedPieces: game.capturedPieces,
        players: game.players, // Sync clocks
      });

      if (gameFinished) {
        io.to(roomId).emit('game_finished', {
          reason,
          winner: game.winner,
          loser: game.players.find(p => p.color !== game.winner?.color),
        });
      }

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 4. Game State Sync (Now strictly server authoritative - forces client to sync)
  socket.on('game_state_sync', (roomId, callback) => {
    try {
      const game = games.get(roomId);
      if (!game) {
        if (typeof callback === 'function') callback({ success: false, error: 'Game not found' });
        return;
      }
      
      socket.emit('game_updated', {
        gameState: game.gameState,
        players: game.players,
        status: game.status,
        moveHistory: game.moveHistory,
        capturedPieces: game.capturedPieces,
      });

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 5. Resign
  socket.on('resign', (roomId, callback) => {
    try {
      const game = games.get(roomId);
      if (!game) return;

      const player = game.getPlayerBySocketId(socket.id);
      if (!player) return;

      const winner = game.players.find((p) => p.socketId !== socket.id);

      game.status = 'finished';
      game.winner = winner || null;

      io.to(roomId).emit('game_finished', {
        reason: 'resignation',
        winner: winner,
        loser: player,
      });

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {}
  });

  // 6. Reconnect To Game
  socket.on('reconnect_to_game', (payload, callback) => {
    try {
      const { roomId: rawRoomId, playerId, playerName } = typeof payload === 'object' ? payload : { roomId: payload };
      const roomId = (rawRoomId || '').trim().toUpperCase();
      const game = games.get(roomId);

      if (!game) {
        if (typeof callback === 'function') callback({ success: false, error: 'Game room not found' });
        return;
      }

      let player = game.players.find((p) => p.playerId === playerId || p.socketId === socket.id);

      if (!player && game.players.length < 2) {
        game.addPlayer(socket.id, playerId, playerName);
        player = game.players.find((p) => p.playerId === playerId);
      } else if (player) {
        player.socketId = socket.id;
        player.connected = true;
      }

      socket.join(roomId);

      io.to(roomId).emit('player_reconnected', {
        playerId: player ? player.playerId : socket.id,
        gameState: game.gameState,
        players: game.players,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomId,
          color: player ? player.color : 'white',
          gameState: game.gameState,
          players: game.players,
          moveHistory: game.moveHistory,
          capturedPieces: game.capturedPieces,
        });
      }
    } catch (error: any) {
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 7. Instant Matchmaking
  socket.on('find_match', (payload, callback) => {
    try {
      const { timeControl = 'blitz', playerId, playerName } = payload || {};
      const pool = matchmakingQueues[timeControl] || matchmakingQueues.blitz;

      removeFromAllQueues(socket.id);

      const opponent = pool.shift();
      if (opponent && opponent.socketId !== socket.id) {
        let roomId = 'ARENA-' + generateRoomCode();
        while (games.has(roomId)) roomId = 'ARENA-' + generateRoomCode();

        const isCreatorWhite = Math.random() < 0.5;
        const whitePlayer = isCreatorWhite
          ? { id: socket.id, pid: playerId, name: playerName || 'Player 1' }
          : { id: opponent.socketId, pid: opponent.playerId, name: opponent.playerName || 'Player 2' };
        const blackPlayer = isCreatorWhite
          ? { id: opponent.socketId, pid: opponent.playerId, name: opponent.playerName || 'Player 2' }
          : { id: socket.id, pid: playerId, name: playerName || 'Player 1' };

        const game = new GameRoom(roomId, whitePlayer.id, whitePlayer.pid, whitePlayer.name, timeControl as any);
        game.addPlayer(blackPlayer.id, blackPlayer.pid, blackPlayer.name);
        games.set(roomId, game);

        socket.join(roomId);
        io.sockets.sockets.get(opponent.socketId)?.join(roomId);

        const matchData = {
          roomId,
          timeControl,
          gameState: game.gameState,
          players: game.players,
        };

        socket.emit('match_found', { ...matchData, color: isCreatorWhite ? 'white' : 'black', opponentName: opponent.playerName });
        io.to(opponent.socketId).emit('match_found', { ...matchData, color: isCreatorWhite ? 'black' : 'white', opponentName: playerName });

        if (typeof callback === 'function') callback({ success: true, matched: true, roomId });
      } else {
        pool.push({ socketId: socket.id, playerId, playerName: playerName || 'Player' });
        if (typeof callback === 'function') callback({ success: true, matched: false, queueLength: pool.length });
        socket.emit('queue_joined', { timeControl, position: pool.length });
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('cancel_match', (callback) => {
    removeFromAllQueues(socket.id);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 8. Disconnect
  socket.on('disconnect', () => {
    removeFromAllQueues(socket.id);
    for (const [roomId, game] of games.entries()) {
      const player = game.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.connected = false;
        io.to(roomId).emit('player_disconnected', player.playerId);
      }
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

app.get('/api/game/:roomId', (req: Request, res: Response) => {
  const rawId = req.params.roomId;
  const roomId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').toUpperCase();
  const game = games.get(roomId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({
    roomId: game.roomId,
    status: game.status,
    players: game.players,
    gameState: game.gameState,
    moveHistory: game.moveHistory,
    capturedPieces: game.capturedPieces,
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Chess Game Server (Server-Authoritative) running on port ${PORT}`);
});

