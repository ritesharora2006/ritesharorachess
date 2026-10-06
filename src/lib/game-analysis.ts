/**
 * RITESH CHESS — Game Analysis & Move Classification Engine
 * Computes CAPS Accuracy %, Centipawn Evaluation Curves,
 * Move Classifications (Brilliant, Best, Blunder, etc.), and PGN generation.
 */

import { stockfishEngine, toStandardFEN } from './stockfish-engine';
import {
  createInitialState,
  applyMove,
  type GameState,
  type Move,
} from './moves';
import type { PieceColor, Square } from './chess-types';
import { squareToAlgebraic } from './chess-types';
import { moveToAlgebraic } from './notation';

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win'
  | 'book';

export interface AnalyzedMove {
  index: number;
  moveNumber: number;
  color: PieceColor;
  san: string;
  from: Square;
  to: Square;
  fenBefore: string;
  fenAfter: string;
  classification: MoveClassification;
  scoreCp: number; // in centipawns from White's perspective
  winRate: number; // 0 to 100% win rate for White
  winRateDelta: number; // Loss in player's win rate percentage
  bestMoveSan?: string;
  bestMoveUci?: string;
  comment?: string;
}

export interface EvalGraphPoint {
  moveIndex: number;
  scoreCp: number;
  winRate: number;
}

export interface GameReviewReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: Record<MoveClassification, number>;
  blackStats: Record<MoveClassification, number>;
  moves: AnalyzedMove[];
  evalGraph: EvalGraphPoint[];
  pgn: string;
  summaryText: string;
}

/**
 * Standard logistic win probability curve based on centipawn advantage.
 * At 0 cp -> 50%
 * At +300 cp (up a minor piece) -> ~75%
 * At +600 cp (up a rook) -> ~90%
 * At +1000 cp -> 98%
 */
export function centipawnsToWinRate(cp: number): number {
  const clamped = Math.max(-1500, Math.min(1500, cp));
  return 100 / (1 + Math.exp(-0.00368208 * clamped));
}

/**
 * CAPS accuracy formula per move:
 * Converts win rate loss to a 0-100% accuracy score.
 */
function calculateMoveAccuracy(winRateLoss: number): number {
  if (winRateLoss <= 0) return 100;
  const raw = 103.1668 * Math.exp(-0.04354 * winRateLoss) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

/**
 * Classify a move given the player's win rate before the move and after the move.
 */
function classifyMove(
  winRateLoss: number,
  prevWinRate: number,
  isBestMove: boolean,
  isPieceSacrifice: boolean
): MoveClassification {
  if (isBestMove) {
    if (isPieceSacrifice && prevWinRate >= 65) {
      return 'brilliant';
    }
    return 'best';
  }

  if (winRateLoss <= 2.0) {
    return 'excellent';
  }
  if (winRateLoss <= 6.5) {
    return 'good';
  }
  if (winRateLoss <= 14.0) {
    return 'inaccuracy';
  }
  if (winRateLoss <= 28.0) {
    return 'mistake';
  }

  // Major loss (>28%)
  if (prevWinRate >= 80) {
    return 'missed_win';
  }
  return 'blunder';
}

function emptyStats(): Record<MoveClassification, number> {
  return {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0,
    book: 0,
  };
}

export interface AnalyzeGameOptions {
  depth?: number;
  movetimeMs?: number;
  onProgress?: (current: number, total: number) => void;
  whiteName?: string;
  blackName?: string;
  result?: string;
}

/**
 * Replays full move history through Stockfish to produce an archival Game Review.
 */
export async function analyzeGame(
  moves: Move[],
  options: AnalyzeGameOptions = {}
): Promise<GameReviewReport> {
  const depth = options.depth ?? 10;
  const movetimeMs = options.movetimeMs ?? 200;
  const onProgress = options.onProgress;

  const analyzedMoves: AnalyzedMove[] = [];
  const evalGraph: EvalGraphPoint[] = [];

  const whiteStats = emptyStats();
  const blackStats = emptyStats();

  let whiteAccSum = 0;
  let whiteMoveCount = 0;
  let blackAccSum = 0;
  let blackMoveCount = 0;

  // Replay state
  let currentState: GameState = createInitialState();

  evalGraph.push({
    moveIndex: 0,
    scoreCp: 0,
    winRate: 50,
  });

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const color = currentState.turn;
    const piece = currentState.board[move.from];
    const target = currentState.board[move.to];
    const san = moveToAlgebraic(currentState, move);
    const fromAlg = squareToAlgebraic(move.from);
    const toAlg = squareToAlgebraic(move.to);
    const fenBefore = toStandardFEN(currentState);

    // Evaluate position before move
    const beforeEval = await stockfishEngine.evaluate(fenBefore, depth, movetimeMs);
    const scoreFromTurn = beforeEval.scoreCp;
    // Normalize to White's perspective
    const evalBeforeWhiteCp = color === 'white' ? scoreFromTurn : -scoreFromTurn;

    // Apply move
    currentState = applyMove(currentState, move);
    const fenAfter = toStandardFEN(currentState);

    // Evaluate position after move
    const afterEval = await stockfishEngine.evaluate(fenAfter, depth, movetimeMs);
    const afterScoreFromNextTurn = afterEval.scoreCp;
    // Since turn changed, White's perspective is:
    const evalAfterWhiteCp = color === 'white' ? -afterScoreFromNextTurn : afterScoreFromNextTurn;

    // Calculate win rates
    const whiteWinRateBefore = centipawnsToWinRate(evalBeforeWhiteCp);
    const whiteWinRateAfter = centipawnsToWinRate(evalAfterWhiteCp);

    const playerWinRateBefore = color === 'white' ? whiteWinRateBefore : 100 - whiteWinRateBefore;
    const playerWinRateAfter = color === 'white' ? whiteWinRateAfter : 100 - whiteWinRateAfter;
    const winRateLoss = Math.max(0, playerWinRateBefore - playerWinRateAfter);

    const isBestMove =
      beforeEval.bestMove !== null &&
      beforeEval.bestMove.startsWith(`${fromAlg}${toAlg}`.toLowerCase());

    const isSacrifice =
      piece && (piece.type === 'queen' || piece.type === 'rook')
        ? !target
        : false;

    const classification = classifyMove(
      winRateLoss,
      playerWinRateBefore,
      isBestMove,
      isSacrifice
    );

    const moveAcc = calculateMoveAccuracy(winRateLoss);
    if (color === 'white') {
      whiteStats[classification]++;
      whiteAccSum += moveAcc;
      whiteMoveCount++;
    } else {
      blackStats[classification]++;
      blackAccSum += moveAcc;
      blackMoveCount++;
    }

    evalGraph.push({
      moveIndex: i + 1,
      scoreCp: evalAfterWhiteCp,
      winRate: Math.round(whiteWinRateAfter * 10) / 10,
    });

    analyzedMoves.push({
      index: i,
      moveNumber: Math.floor(i / 2) + 1,
      color,
      san: san || `${fromAlg}-${toAlg}`,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter,
      classification,
      scoreCp: evalAfterWhiteCp,
      winRate: Math.round(whiteWinRateAfter * 10) / 10,
      winRateDelta: Math.round(winRateLoss * 10) / 10,
      bestMoveUci: beforeEval.bestMove ?? undefined,
    });

    if (onProgress) {
      onProgress(i + 1, moves.length);
    }
  }

  const whiteAccuracy =
    whiteMoveCount > 0 ? Math.round((whiteAccSum / whiteMoveCount) * 10) / 10 : 100;
  const blackAccuracy =
    blackMoveCount > 0 ? Math.round((blackAccSum / blackMoveCount) * 10) / 10 : 100;

  // Generate PGN
  const whitePlayer = options.whiteName || 'White';
  const blackPlayer = options.blackName || 'Black';
  const resultStr = options.result || '*';
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');

  let pgn = `[Event "Ritesh Chess Championship Match"]\n`;
  pgn += `[Site "Ritesh Chess Online"]\n`;
  pgn += `[Date "${dateStr}"]\n`;
  pgn += `[Round "1"]\n`;
  pgn += `[White "${whitePlayer}"]\n`;
  pgn += `[Black "${blackPlayer}"]\n`;
  pgn += `[Result "${resultStr}"]\n`;
  pgn += `[WhiteAccuracy "${whiteAccuracy}%"]\n`;
  pgn += `[BlackAccuracy "${blackAccuracy}%"]\n\n`;

  for (let i = 0; i < analyzedMoves.length; i++) {
    const m = analyzedMoves[i];
    if (m.color === 'white') {
      pgn += `${m.moveNumber}. ${m.san} `;
    } else {
      pgn += `${m.san} `;
    }
  }
  pgn += `${resultStr}\n`;

  const summaryText =
    whiteAccuracy > blackAccuracy
      ? `${whitePlayer} played with higher precision (${whiteAccuracy}% vs ${blackAccuracy}%).`
      : blackAccuracy > whiteAccuracy
      ? `${blackPlayer} capitalized on tactical inaccuracies (${blackAccuracy}% vs ${whiteAccuracy}%).`
      : `Both players matched precision with equal accuracy (${whiteAccuracy}%).`;

  return {
    whiteAccuracy,
    blackAccuracy,
    whiteStats,
    blackStats,
    moves: analyzedMoves,
    evalGraph,
    pgn,
    summaryText,
  };
}
