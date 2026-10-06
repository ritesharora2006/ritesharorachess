import { createInitialState, applyMove, type GameState } from './moves';
import { algebraicToSquare } from './chess-types';

export interface ExhibitionMove {
  from: string;
  to: string;
  san: string;
  comment: string;
  eval: string;
  badge?: 'Brilliant' | 'Great Move' | 'Sacrifice' | 'Checkmate' | 'Book';
}

export interface ExhibitionGame {
  id: string;
  name: string;
  shortName: string;
  year: number;
  location: string;
  white: string;
  black: string;
  result: string;
  opening: string;
  moves: ExhibitionMove[];
}

export const EXHIBITION_GAMES: ExhibitionGame[] = [
  {
    id: 'opera-1858',
    name: "Paul Morphy's Opera Game",
    shortName: 'Opera Game',
    year: 1858,
    location: 'Paris Opera House',
    white: 'Paul Morphy',
    black: 'Duke & Count',
    result: '1-0',
    opening: 'Philidor Defence',
    moves: [
      { from: 'e2', to: 'e4', san: '1. e4', comment: "Open Game: Morphy controls the central squares immediately.", eval: '+0.25', badge: 'Book' },
      { from: 'e7', to: 'e5', san: '1... e5', comment: 'Classical response contesting the central d4 square.', eval: '+0.25', badge: 'Book' },
      { from: 'g1', to: 'f3', san: '2. Nf3', comment: 'Developing the king knight while directly targeting e5.', eval: '+0.32', badge: 'Book' },
      { from: 'd7', to: 'd6', san: '2... d6', comment: 'Philidor Defence — solid but restricts the dark-squared bishop.', eval: '+0.45', badge: 'Book' },
      { from: 'd2', to: 'd4', san: '3. d4', comment: 'Immediate central strike challenging Black’s pawn wedge.', eval: '+0.55' },
      { from: 'c8', to: 'g4', san: '3... Bg4', comment: 'Aggressive pin, but surrenders tempo after central liquidation.', eval: '+0.70' },
      { from: 'd4', to: 'e5', san: '4. dxe5', comment: 'Opening the d-file to exploit Black’s tactical vulnerability.', eval: '+0.85' },
      { from: 'g4', to: 'f3', san: '4... Bxf3', comment: 'Black parts with the bishop pair to relieve central tension.', eval: '+1.05' },
      { from: 'd1', to: 'f3', san: '5. Qxf3', comment: 'Recapture developing the Queen with active board presence.', eval: '+1.10' },
      { from: 'd6', to: 'e5', san: '5... dxe5', comment: 'Material is balanced, but White has a massive lead in development.', eval: '+1.20' },
      { from: 'f1', to: 'c4', san: '6. Bc4', comment: 'Targeting the vulnerable f7 square, threatening Qxf7#.', eval: '+1.45', badge: 'Great Move' },
      { from: 'g8', to: 'f6', san: '6... Nf6', comment: 'Natural parry defending the mating threat on f7.', eval: '+1.50' },
      { from: 'f3', to: 'b3', san: '7. Qb3', comment: 'Double battery attacking both f7 and the loose b7 pawn!', eval: '+2.10', badge: 'Great Move' },
      { from: 'd8', to: 'e7', san: '7... Qe7', comment: 'Defends f7, but blocks the development of the f8 bishop.', eval: '+2.35' },
      { from: 'b1', to: 'c3', san: '8. Nc3', comment: 'Morphy spurns 8. Qxb7 in favor of relentless rapid development!', eval: '+2.80', badge: 'Brilliant' },
      { from: 'c7', to: 'c6', san: '8... c6', comment: 'Black shores up b5 and prepares to contest queenside space.', eval: '+2.90' },
      { from: 'c1', to: 'g5', san: '9. Bg5', comment: 'Pinning the knight to paralyze Black’s defensive coordinator.', eval: '+3.40' },
      { from: 'b7', to: 'b5', san: '9... b5', comment: 'Desperation pawn push attempting to kick the c4 bishop.', eval: '+4.10' },
      { from: 'c3', to: 'b5', san: '10. Nxb5!', comment: 'Piece sacrifice! Morphy blasts open the queenside files.', eval: '+5.20', badge: 'Sacrifice' },
      { from: 'c6', to: 'b5', san: '10... cxb5', comment: 'Black accepts the knight, but his monarch is trapped in the center.', eval: '+5.35' },
      { from: 'c4', to: 'b5', san: '11. Bxb5+', comment: 'Check with tempo! Every white piece participates in the hunt.', eval: '+5.90' },
      { from: 'b8', to: 'd7', san: '11... Nbd7', comment: 'The knight is pinned to the king on e8.', eval: '+6.10' },
      { from: 'e1', to: 'c1', san: '12. O-O-O', comment: 'Long castling! The white rook joins the battery against d7.', eval: '+6.85', badge: 'Great Move' },
      { from: 'a8', to: 'd8', san: '12... Rd8', comment: 'Black adds a defender to the beleaguered d7 knight.', eval: '+7.05' },
      { from: 'd1', to: 'd7', san: '13. Rxd7!', comment: 'Exchange sacrifice! Eliminating Black’s defensive anchor.', eval: '+8.40', badge: 'Sacrifice' },
      { from: 'd8', to: 'd7', san: '13... Rxd7', comment: 'Recapturing with the rook, which is now fatally pinned.', eval: '+8.60' },
      { from: 'h1', to: 'd1', san: '14. Rd1', comment: 'Morphy brings his final piece into play with devastating effect.', eval: '+9.90', badge: 'Great Move' },
      { from: 'e7', to: 'e6', san: '14... Qe6', comment: 'Queen unpins herself, hoping to trade queens.', eval: '+12.5' },
      { from: 'b5', to: 'd7', san: '15. Bxd7+', comment: 'Morphy clears the way for the immortal finale.', eval: '+M3' },
      { from: 'f6', to: 'd7', san: '15... Nxd7', comment: 'Black recaptures with the last remaining knight.', eval: '+M2' },
      { from: 'b3', to: 'b8', san: '16. Qb8+!!', comment: 'IMMORTAL QUEEN SACRIFICE! Deflecting the knight from d8.', eval: '+M1', badge: 'Brilliant' },
      { from: 'd7', to: 'b8', san: '16... Nxb8', comment: 'Forced capture — Black has no other legal move.', eval: '+M1' },
      { from: 'd1', to: 'd8', san: '17. Rd8#', comment: 'CHECKMATE! Pure geometry and harmonious coordination.', eval: '#', badge: 'Checkmate' },
    ],
  },
  {
    id: 'evergreen-1852',
    name: "Anderssen's Evergreen Game",
    shortName: 'Evergreen Game',
    year: 1852,
    location: 'Berlin',
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    result: '1-0',
    opening: 'Evans Gambit',
    moves: [
      { from: 'e2', to: 'e4', san: '1. e4', comment: "King's pawn advance staking out the central territory.", eval: '+0.25', badge: 'Book' },
      { from: 'e7', to: 'e5', san: '1... e5', comment: 'Black responds symmetrically.', eval: '+0.25', badge: 'Book' },
      { from: 'g1', to: 'f3', san: '2. Nf3', comment: 'Knight develops with an attack on e5.', eval: '+0.30', badge: 'Book' },
      { from: 'b8', to: 'c6', san: '2... Nc6', comment: 'Defends the e5 pawn naturally.', eval: '+0.30', badge: 'Book' },
      { from: 'f1', to: 'c4', san: '3. Bc4', comment: 'Italian Game aiming at the vulnerable f7 square.', eval: '+0.35', badge: 'Book' },
      { from: 'f8', to: 'c5', san: '3... Bc5', comment: 'Giuoco Piano setup.', eval: '+0.35', badge: 'Book' },
      { from: 'b2', to: 'b4', san: '4. b4', comment: 'The Evans Gambit! Anderssen sacrifices a pawn for rapid initiative.', eval: '+0.20', badge: 'Sacrifice' },
      { from: 'c5', to: 'b4', san: '4... Bxb4', comment: 'Gambit accepted.', eval: '+0.20' },
      { from: 'c2', to: 'c3', san: '5. c3', comment: 'Gains tempo on the bishop and prepares d4.', eval: '+0.30' },
      { from: 'b4', to: 'a5', san: '5... Ba5', comment: 'Retreat maintaining pin on the c-file.', eval: '+0.30' },
      { from: 'd2', to: 'd4', san: '6. d4', comment: 'White dominates the board center.', eval: '+0.45' },
      { from: 'e5', to: 'd4', san: '6... exd4', comment: 'Central trade.', eval: '+0.50' },
      { from: 'e1', to: 'g1', san: '7. O-O', comment: 'King safety first; rapid rook deployment.', eval: '+0.60' },
      { from: 'd4', to: 'd3', san: '7... d3', comment: 'Black pushes forward to clutter White’s development.', eval: '+0.75' },
      { from: 'd1', to: 'b3', san: '8. Qb3', comment: 'Battery formed attacking f7 and b7.', eval: '+1.10' },
      { from: 'd8', to: 'f6', san: '8... Qf6', comment: 'Queen defends f7.', eval: '+1.15' },
      { from: 'e4', to: 'e5', san: '9. e5', comment: 'Pawn thrust driving the queen from f6.', eval: '+1.50', badge: 'Great Move' },
      { from: 'f6', to: 'g6', san: '9... Qg6', comment: 'Queen relocates to the g-file.', eval: '+1.55' },
      { from: 'f1', to: 'e1', san: '10. Re1', comment: 'Central rook line opened.', eval: '+1.70' },
      { from: 'g8', to: 'e7', san: '10... Nge7', comment: 'Knight develops preparing kingside castling.', eval: '+1.80' },
      { from: 'c1', to: 'a3', san: '11. Ba3', comment: 'Diagonal laser cutting off Black’s king from castling!', eval: '+2.30', badge: 'Great Move' },
      { from: 'b7', to: 'b5', san: '11... b5', comment: 'Counter-strike on the flank.', eval: '+2.45' },
      { from: 'b3', to: 'b5', san: '12. Qxb5', comment: 'Queen captures while maintaining kingside pressure.', eval: '+2.60' },
      { from: 'a8', to: 'b8', san: '12... Rb8', comment: 'Countering along the b-file.', eval: '+2.55' },
      { from: 'b5', to: 'a4', san: '13. Qa4', comment: 'Queen steps aside to safety.', eval: '+2.70' },
      { from: 'a5', to: 'b6', san: '13... Bb6', comment: 'Bishop retreats.', eval: '+2.65' },
      { from: 'b1', to: 'd2', san: '14. Nbd2', comment: 'Completing piece coordination.', eval: '+3.10' },
      { from: 'c8', to: 'b7', san: '14... Bb7', comment: 'Fianchettoing the light-squared bishop.', eval: '+3.20' },
      { from: 'd2', to: 'e4', san: '15. Ne4', comment: 'Centralized knight eyeing f6 and d6.', eval: '+3.80' },
      { from: 'g6', to: 'f5', san: '15... Qf5', comment: 'Queen pins knight.', eval: '+3.75' },
      { from: 'c4', to: 'd3', san: '16. Bxd3', comment: 'Setting up discovery against the queen.', eval: '+4.20' },
      { from: 'f5', to: 'h5', san: '16... Qh5', comment: 'Queen evades to h5.', eval: '+4.30' },
      { from: 'e4', to: 'f6', san: '17. Nf6+!', comment: 'Knight sacrifice shattering Black’s kingside pawn structure!', eval: '+5.80', badge: 'Sacrifice' },
      { from: 'g7', to: 'f6', san: '17... gxf6', comment: 'Forced capture.', eval: '+5.90' },
      { from: 'e5', to: 'f6', san: '18. exf6', comment: 'Opening the e-file against the uncastled king.', eval: '+6.20' },
      { from: 'h8', to: 'g8', san: '18... Rg8', comment: 'Black counters threatening Qxg2#.', eval: '+5.50' },
      { from: 'a1', to: 'd1', san: '19. Rad1!', comment: 'Cold-blooded calm! Anderssen ignores the mating threat on g2.', eval: '+8.10', badge: 'Brilliant' },
      { from: 'h5', to: 'f3', san: '19... Qxf3', comment: 'Black threatens instant mate on g2, thinking he has won.', eval: '+M4' },
      { from: 'e1', to: 'e7', san: '20. Rxe7+!', comment: 'Rook deflection sacrifice removing the knight guardian!', eval: '+M3', badge: 'Sacrifice' },
      { from: 'c6', to: 'e7', san: '20... Nxe7', comment: 'Recapture.', eval: '+M3' },
      { from: 'a4', to: 'd7', san: '21. Qxd7+!!', comment: 'THE IMMORTAL QUEEN SACRIFICE! Decoying the king into the open.', eval: '+M2', badge: 'Brilliant' },
      { from: 'e8', to: 'd7', san: '21... Kxd7', comment: 'King takes Queen.', eval: '+M2' },
      { from: 'd3', to: 'f5', san: '22. Bf5+!', comment: 'Double check! King must move.', eval: '+M1', badge: 'Great Move' },
      { from: 'd7', to: 'e8', san: '22... Ke8', comment: 'King flees back.', eval: '+M1' },
      { from: 'f5', to: 'd7', san: '23. Bd7+!', comment: 'Deflection check driving king to f8.', eval: '+M1' },
      { from: 'e8', to: 'f8', san: '23... Kf8', comment: 'Forced retreat.', eval: '+M1' },
      { from: 'a3', to: 'e7', san: '24. Bxe7#', comment: 'CHECKMATE! An evergreen wreath for the victorious master.', eval: '#', badge: 'Checkmate' },
    ],
  },
  {
    id: 'fischer-1956',
    name: "Fischer's Game of the Century",
    shortName: 'Game of Century',
    year: 1956,
    location: 'New York City',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (Age 13)',
    result: '0-1',
    opening: 'Grünfeld Defence',
    moves: [
      { from: 'g1', to: 'f3', san: '1. Nf3', comment: 'Zukertort Opening setting up flexible hypermodern control.', eval: '+0.15', badge: 'Book' },
      { from: 'g8', to: 'f6', san: '1... Nf6', comment: 'Symmetric knight development.', eval: '+0.15', badge: 'Book' },
      { from: 'c2', to: 'c4', san: '2. c4', comment: 'English Opening transposition.', eval: '+0.20', badge: 'Book' },
      { from: 'g7', to: 'g6', san: '2... g6', comment: 'Fischer prepares the King’s Indian / Grünfeld fianchetto.', eval: '+0.20', badge: 'Book' },
      { from: 'b1', to: 'c3', san: '3. Nc3', comment: 'Natural knight deployment.', eval: '+0.25', badge: 'Book' },
      { from: 'f8', to: 'g7', san: '3... Bg7', comment: 'Dragon bishop rakes the long diagonal.', eval: '+0.25', badge: 'Book' },
      { from: 'd2', to: 'd4', san: '4. d4', comment: 'White establishes central occupation.', eval: '+0.30', badge: 'Book' },
      { from: 'e8', to: 'g8', san: '4... O-O', comment: '13-year-old Fischer secures king safety immediately.', eval: '+0.30', badge: 'Book' },
      { from: 'c1', to: 'f4', san: '5. Bf4', comment: 'Developing bishop outside the pawn chain.', eval: '+0.35' },
      { from: 'd7', to: 'd5', san: '5... d5', comment: 'Grünfeld-style central strike.', eval: '+0.40' },
      { from: 'd1', to: 'b3', san: '6. Qb3', comment: 'Pressuring d5 and b7.', eval: '+0.50' },
      { from: 'd5', to: 'c4', san: '6... dxc4', comment: 'Liquidating White’s pawn center.', eval: '+0.45' },
      { from: 'b3', to: 'c4', san: '7. Qxc4', comment: 'Queen recaptures.', eval: '+0.40' },
      { from: 'c7', to: 'c6', san: '7... c6', comment: 'Fortifying the queenside dark squares.', eval: '+0.35' },
      { from: 'e2', to: 'e4', san: '8. e4', comment: 'White takes full center space.', eval: '+0.45' },
      { from: 'b8', to: 'd7', san: '8... Nbd7', comment: 'Fischer develops flexibly.', eval: '+0.35' },
      { from: 'a1', to: 'd1', san: '9. Rd1', comment: 'Rook supports the central d4 pawn.', eval: '+0.30' },
      { from: 'd7', to: 'b6', san: '9... Nb6', comment: 'Knight kicks queen with tempo.', eval: '+0.20' },
      { from: 'c4', to: 'c5', san: '10. Qc5', comment: 'Byrne steps forward into the ambush.', eval: '+0.10' },
      { from: 'c8', to: 'g4', san: '10... Bg4', comment: 'Fischer pins White’s key central defender.', eval: '0.00' },
      { from: 'f4', to: 'g5', san: '11. Bg5', comment: 'Counter-pinning.', eval: '0.00' },
      { from: 'b6', to: 'a4', san: '11... Na4!', comment: 'Fischer unleashes tactical wizardry on the queen!', eval: '-0.85', badge: 'Great Move' },
      { from: 'c5', to: 'a3', san: '12. Qa3', comment: 'Queen retreats under fire.', eval: '-0.90' },
      { from: 'a4', to: 'c3', san: '12... Nxc3', comment: 'Removing the c3 knight.', eval: '-1.05' },
      { from: 'b2', to: 'c3', san: '13. bxc3', comment: 'Pawn structure ruptured.', eval: '-1.10' },
      { from: 'f6', to: 'e4', san: '13... Nxe4!', comment: 'Central knight sacrifice opening lines.', eval: '-1.80', badge: 'Sacrifice' },
      { from: 'g5', to: 'e7', san: '14. Bxe7', comment: 'Byrne attacks the queen and rook.', eval: '-1.70' },
      { from: 'd8', to: 'b6', san: '14... Qb6', comment: 'Fischer’s queen takes aim at b2 and f2.', eval: '-2.20' },
      { from: 'f1', to: 'c4', san: '15. Bc4', comment: 'White attempts to complete development.', eval: '-2.50' },
      { from: 'e4', to: 'c3', san: '15... Nxc3', comment: 'Relentless tactical strikes.', eval: '-3.10' },
      { from: 'e7', to: 'c5', san: '16. Bc5', comment: 'Counter-attack on Fischer’s queen.', eval: '-3.20' },
      { from: 'f8', to: 'e8', san: '16... Rfe8+', comment: 'The uncastled king is caught in crossfire.', eval: '-4.60' },
      { from: 'e1', to: 'f1', san: '17. Kf1', comment: 'King forced to step aside, losing castling rights.', eval: '-4.80' },
      { from: 'g4', to: 'e6', san: '17... Be6!!', comment: 'THE QUEEN SACRIFICE OF THE CENTURY! A masterpiece beyond belief.', eval: '-8.50', badge: 'Brilliant' },
      { from: 'c5', to: 'b6', san: '18. Bxb6', comment: 'Byrne takes the Queen, unaware of the impending slaughter.', eval: '-8.60' },
      { from: 'e6', to: 'c4', san: '18... Bxc4+', comment: 'Discovered check ripping open the king.', eval: '-9.20' },
      { from: 'f1', to: 'g1', san: '19. Kg1', comment: 'King flees to g1.', eval: '-9.30' },
      { from: 'c3', to: 'e2', san: '19... Ne2+', comment: 'Windmill combination begins.', eval: '-9.80' },
      { from: 'g1', to: 'f1', san: '20. Kf1', comment: 'Forced.', eval: '-9.90' },
      { from: 'e2', to: 'd4', san: '20... Nxd4+', comment: 'Discovered check picking up pawns.', eval: '-10.5' },
      { from: 'f1', to: 'g1', san: '21. Kg1', comment: 'Forced.', eval: '-10.6' },
      { from: 'd4', to: 'e2', san: '21... Ne2+', comment: 'Windmill continues.', eval: '-10.8' },
      { from: 'g1', to: 'f1', san: '22. Kf1', comment: 'Forced.', eval: '-10.9' },
      { from: 'e2', to: 'c3', san: '22... Nc3+', comment: 'Discovered check clearing the route to the d1 rook.', eval: '-11.5' },
      { from: 'f1', to: 'g1', san: '23. Kg1', comment: 'Forced.', eval: '-11.6' },
      { from: 'a7', to: 'b6', san: '23... axb6', comment: 'Fischer recaptures the bishop with tempo on White’s queen.', eval: '-12.0' },
      { from: 'a3', to: 'b4', san: '24. Qb4', comment: 'Queen flees.', eval: '-12.2' },
      { from: 'a8', to: 'a4', san: '24... Ra4', comment: 'Rook sweeps in to crush the remaining defenders.', eval: '-13.0', badge: 'Great Move' },
      { from: 'b4', to: 'b6', san: '25. Qxb6', comment: 'Desperate queen raid.', eval: '-13.5' },
      { from: 'c3', to: 'd1', san: '25... Nxd1', comment: 'Black claims the exchange, cruising to an immortal triumph.', eval: '-14.0' },
    ],
  },
];

/**
 * Precomputes all game states for a given exhibition game so scrubbing is instantaneous.
 */
export function precomputeGameStates(game: ExhibitionGame): GameState[] {
  const states: GameState[] = [createInitialState()];
  let current = states[0];

  for (const move of game.moves) {
    const from = algebraicToSquare(move.from);
    const to = algebraicToSquare(move.to);
    if (from === null || to === null) break;
    current = applyMove(current, { from, to });
    states.push(current);
  }

  return states;
}

