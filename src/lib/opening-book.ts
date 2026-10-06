/**
 * Curated master chess opening book
 * Keys are normalized FENs (piece placement + active color + castling rights).
 * Values are array of weighted UCI candidate moves.
 */

interface BookEntry {
  move: string; // UCI move, e.g. 'e7e5'
  weight: number;
}

export const OPENING_BOOK: Record<string, BookEntry[]> = {
  // 0. Starting position (White)
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': [
    { move: 'e2e4', weight: 45 },
    { move: 'd2d4', weight: 35 },
    { move: 'g1f3', weight: 12 },
    { move: 'c2c4', weight: 8 },
  ],

  // 1. After 1. e4 (Black responses)
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': [
    { move: 'c7c5', weight: 40 }, // Sicilian Defense
    { move: 'e7e5', weight: 35 }, // Open Game
    { move: 'e7e6', weight: 15 }, // French Defense
    { move: 'c7c6', weight: 10 }, // Caro-Kann Defense
  ],

  // 1. After 1. d4 (Black responses)
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq': [
    { move: 'g8f6', weight: 50 }, // Indian Defense
    { move: 'd7d5', weight: 40 }, // Queen's Gambit Declined / Slav setup
    { move: 'e7e6', weight: 10 }, // Nimzo/Bogo/French setup
  ],

  // 1. After 1. Nf3 (Black responses)
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq': [
    { move: 'd7d5', weight: 50 },
    { move: 'g8f6', weight: 35 },
    { move: 'c7c5', weight: 15 },
  ],

  // 1. After 1. c4 (Black responses)
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq': [
    { move: 'e7e5', weight: 45 }, // King's English
    { move: 'c7c5', weight: 30 }, // Symmetrical English
    { move: 'g8f6', weight: 25 }, // Anglo-Indian
  ],

  // 2. Open Game: 1. e4 e5 2. Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    { move: 'b8c6', weight: 80 }, // Main line
    { move: 'g8f6', weight: 20 }, // Petrov Defense
  ],

  // 2. Open Game: 1. e4 e5 2. Bc4
  'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq': [
    { move: 'g8f6', weight: 60 },
    { move: 'b8c6', weight: 40 },
  ],

  // 2. Open Game: 1. e4 e5 2. f4 (King's Gambit)
  'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq': [
    { move: 'e5f4', weight: 65 }, // King's Gambit Accepted
    { move: 'd7d5', weight: 35 }, // Falkbeer Countergambit
  ],

  // 2. Open Game: 1. e4 e5 2. d4 (Center Game)
  'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq': [
    { move: 'e5d4', weight: 95 },
  ],

  // 3. Italian/Ruy Lopez: 1. e4 e5 2. Nf3 Nc6 3. Bc4
  'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq': [
    { move: 'f8c5', weight: 55 }, // Giuoco Piano
    { move: 'g8f6', weight: 45 }, // Two Knights Defense
  ],

  // 3. Italian/Ruy Lopez: 1. e4 e5 2. Nf3 Nc6 3. Bb5
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq': [
    { move: 'a7a6', weight: 75 }, // Morphy Defense
    { move: 'g8f6', weight: 25 }, // Berlin Defense
  ],

  // 3. Scotch Game: 1. e4 e5 2. Nf3 Nc6 3. d4
  'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq': [
    { move: 'e5d4', weight: 95 },
  ],

  // 2. Sicilian: 1. e4 c5 2. Nf3
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    { move: 'd7d6', weight: 45 }, // Classical / Najdorf / Dragon
    { move: 'e7e6', weight: 30 }, // French Sicilian / Kan / Taimanov
    { move: 'b8c6', weight: 25 }, // Open Sicilian
  ],

  // 2. Sicilian: 1. e4 c5 2. Nc3 (Closed Sicilian)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq': [
    { move: 'b8c6', weight: 50 },
    { move: 'd7d6', weight: 30 },
    { move: 'e7e6', weight: 20 },
  ],

  // 3. Open Sicilian: 1. e4 c5 2. Nf3 d6 3. d4
  'rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq': [
    { move: 'c5d4', weight: 98 },
  ],

  // 2. French: 1. e4 e6 2. d4
  'rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq': [
    { move: 'd7d5', weight: 95 },
  ],

  // 2. Caro-Kann: 1. e4 c6 2. d4
  'rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq': [
    { move: 'd7d5', weight: 95 },
  ],

  // 2. QGD: 1. d4 d5 2. c4
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    { move: 'e7e6', weight: 50 }, // Queen's Gambit Declined
    { move: 'c7c6', weight: 35 }, // Slav Defense
    { move: 'd5c4', weight: 15 }, // Queen's Gambit Accepted
  ],

  // 2. Indian: 1. d4 Nf6 2. c4
  'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    { move: 'e7e6', weight: 50 }, // Nimzo/Queen's Indian
    { move: 'g7g6', weight: 45 }, // King's Indian / Grunfeld
    { move: 'c7c5', weight: 5 },  // Benoni
  ],

  // 2. Indian: 1. d4 Nf6 2. Nf3
  'rnbqkb1r/pppppppp/5n2/8/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq': [
    { move: 'd7d5', weight: 40 },
    { move: 'e7e6', weight: 35 },
    { move: 'g7g6', weight: 25 },
  ],

  // 3. King's Indian: 1. d4 Nf6 2. c4 g6 3. Nc3
  'rnbqkb1r/pppppp1p/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq': [
    { move: 'f8g7', weight: 70 },
    { move: 'd7d5', weight: 30 }, // Grunfeld Defense
  ],

  // 3. Nimzo-Indian setup: 1. d4 Nf6 2. c4 e6 3. Nc3
  'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq': [
    { move: 'f8b4', weight: 75 }, // Nimzo-Indian Defense
    { move: 'd7d5', weight: 25 }, // Queen's Gambit Declined transposition
  ],
};

/**
 * Given a full FEN, normalize to piece placement + active color + castling
 */
export function getBookKey(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  return `${parts[0]} ${parts[1]} ${parts[2]}`;
}

/**
 * Returns a weighted master opening move if present in book, or null.
 */
export function getBookMove(fen: string): string | null {
  const key = getBookKey(fen);
  const entries = OPENING_BOOK[key];
  if (!entries || entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of entries) {
    if (random < entry.weight) {
      return entry.move;
    }
    random -= entry.weight;
  }

  return entries[0].move;
}
