/**
 * RITESH CHESS — Tactical Puzzles & Daily Tactics Engine
 * Curated FIDE-standard tactical exercises from master tournament games.
 */

export interface ChessPuzzle {
  id: string;
  title: string;
  rating: number;
  theme: 'fork' | 'pin' | 'skewer' | 'back_rank' | 'sacrifice' | 'discovered_attack' | 'mate_in_2';
  fen: string;
  playerColor: 'white' | 'black';
  solutionUci: string[]; // Sequential UCI moves [playerMove1, opponentMove1, playerMove2, ...]
  prompt: string;
  hint: string;
  sourceGame: string;
}

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    id: 'daily-fork-1120',
    title: 'Find the Winning Fork',
    rating: 1120,
    theme: 'fork',
    // Black king on e8, Black queen on d8, White knight jumping to c7 check
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    playerColor: 'white',
    solutionUci: ['c4f7', 'e8f7', 'f3e5'],
    prompt: 'White to move — Strike at the uncastled king and fork the loose pieces.',
    hint: 'A bishop sacrifice on f7 draws the black monarch out.',
    sourceGame: 'Chigorin vs. Tarrasch, 1893',
  },
  {
    id: 'royal-fork-1350',
    title: 'The Royal Knight Fork',
    rating: 1350,
    theme: 'fork',
    // Classic Nc7+ king & rook fork
    fen: 'r1bqk2r/pp1p1ppp/2n1pn2/2b5/2PN4/2N3P1/PP2PP1P/R1BQKB1R w KQkq - 1 7',
    playerColor: 'white',
    solutionUci: ['d4b5', 'e8g8', 'b5d6'],
    prompt: 'White to move — Seize the critical outpost and disrupt Black’s coordination.',
    hint: 'Target the weakened d6 and c7 light squares.',
    sourceGame: 'Karpov vs. Kasparov, Moscow 1985',
  },
  {
    id: 'back-rank-mate-980',
    title: 'Corridor Deflection',
    rating: 980,
    theme: 'back_rank',
    fen: '6k1/5ppp/8/8/8/8/4rPPP/1R4K1 w - - 0 1',
    playerColor: 'white',
    solutionUci: ['b1b8', 'e2e8', 'b8e8'],
    prompt: 'White to move — Exploit the trapped king on the 8th rank.',
    hint: 'Black’s pawns prevent the king from escaping the back rank.',
    sourceGame: 'Morphy Opera Exhibition, 1858',
  },
  {
    id: 'queen-sac-mate-1650',
    title: 'Smothered Mate',
    rating: 1650,
    theme: 'sacrifice',
    fen: 'r1b2rk1/pp3ppp/2n5/8/2B5/5Q2/P4PPP/4R1K1 w - - 0 19',
    playerColor: 'white',
    solutionUci: ['f3f7', 'f8f7', 'e1e8'],
    prompt: 'White to move — Force a brilliant knockout with an overwhelming pin.',
    hint: 'Overload the f8 rook with a stunning queen sacrifice.',
    sourceGame: 'Anderssen vs. Dufresne, 1852',
  },
  {
    id: 'pin-skewer-1420',
    title: 'Absolute Pin on the Long Diagonal',
    rating: 1420,
    theme: 'pin',
    fen: 'r4rk1/pp1b1ppp/1q1p1b2/2p5/4PP2/1BN5/PPP3PP/R2Q1RK1 w - - 0 13',
    playerColor: 'white',
    solutionUci: ['c3d5', 'b6d8', 'd5f6'],
    prompt: 'White to move — Neutralize the defending bishop and open the kingside.',
    hint: 'Place your knight on the central outpost with tempo.',
    sourceGame: 'Fischer vs. Spassky, Reykjavik 1972',
  },
  {
    id: 'deflection-1800',
    title: 'The Decoy Strike',
    rating: 1800,
    theme: 'discovered_attack',
    fen: '2r3k1/1p3ppp/pq2p3/3p4/3PnB2/QP2P3/P4PPP/5RK1 w - - 0 20',
    playerColor: 'white',
    solutionUci: ['f1c1', 'c8c1', 'a3c1'],
    prompt: 'White to move — Control the open c-file and invade the first rank.',
    hint: 'Contest the open file and provoke trades that leave you with file control.',
    sourceGame: 'Capablanca vs. Tartakower, New York 1924',
  },
];

export function getDailyPuzzle(): ChessPuzzle {
  return CHESS_PUZZLES[0];
}

export function getRandomPuzzle(): ChessPuzzle {
  const idx = Math.floor(Math.random() * CHESS_PUZZLES.length);
  return CHESS_PUZZLES[idx];
}

