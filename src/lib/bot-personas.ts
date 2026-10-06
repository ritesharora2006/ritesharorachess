/**
 * RITESH CHESS — Curated AI Bot Personas
 * Ranging from casual beginners to ruthless grandmasters with distinct playstyles.
 */

export interface BotPersona {
  id: string;
  name: string;
  title: string;
  rating: number;
  badge: string;
  avatarChar: string;
  accentColor: string;
  bio: string;
  style: 'tactical' | 'positional' | 'aggressive' | 'blunder_prone' | 'grandmaster';
  skillLevel: number; // 0-20 Stockfish skill level
  maxDepth: number;
  movetimeMs: number;
  quotes: {
    greeting: string;
    win: string;
    loss: string;
  };
}

export const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'bot-noah',
    name: 'Noah',
    title: 'Beginner Enthusiast',
    rating: 450,
    badge: 'CLASS D',
    avatarChar: '♟',
    accentColor: '#88d49e',
    bio: 'Just learned the moves! Prone to hanging pieces and quick pawn pushes.',
    style: 'blunder_prone',
    skillLevel: 1,
    maxDepth: 3,
    movetimeMs: 300,
    quotes: {
      greeting: 'Hi! Let’s play a fun game of chess.',
      win: 'Wow, I actually won! Good game!',
      loss: 'Ah, you got me! I still have a lot to learn.',
    },
  },
  {
    id: 'bot-arya',
    name: 'Arya',
    title: 'Aggressive Gambiteer',
    rating: 950,
    badge: 'CLASS C',
    avatarChar: '♞',
    accentColor: '#f1c40f',
    bio: 'Attacks early with Knights and Bishops, loves gambits and chaotic complications.',
    style: 'aggressive',
    skillLevel: 5,
    maxDepth: 6,
    movetimeMs: 400,
    quotes: {
      greeting: 'Get ready for an open, aggressive game!',
      win: 'My attack broke through your defenses!',
      loss: 'You weathered my storm cleanly. Well played.',
    },
  },
  {
    id: 'bot-tal',
    name: 'Mikhail Talisman',
    title: 'Tactical Magician',
    rating: 1400,
    badge: 'CLASS B',
    avatarChar: '♝',
    accentColor: '#e67e22',
    bio: 'Searches for intuitive piece sacrifices, unbalancing material for attacking fireworks.',
    style: 'tactical',
    skillLevel: 10,
    maxDepth: 9,
    movetimeMs: 600,
    quotes: {
      greeting: 'You must take your opponent into a deep dark forest.',
      win: 'A beautiful sacrifice creates its own truth.',
      loss: 'Bravo! You calculated more deeply than me.',
    },
  },
  {
    id: 'bot-petrosian',
    name: 'Tigran',
    title: 'Iron Defender',
    rating: 1850,
    badge: 'CANDIDATE MASTER',
    avatarChar: '♜',
    accentColor: '#3498db',
    bio: 'Impenetrable prophylaxis. Controls key outposts and grinds down weaknesses relentlessly.',
    style: 'positional',
    skillLevel: 15,
    maxDepth: 12,
    movetimeMs: 800,
    quotes: {
      greeting: 'Patience and solid pawn structures win tournament titles.',
      win: 'Your position slowly collapsed from structural tension.',
      loss: 'An impressive positional breakthrough. Respect.',
    },
  },
  {
    id: 'bot-magnus',
    name: 'Grandmaster Magnus',
    title: 'World Champion Engine',
    rating: 2500,
    badge: 'SUPER GM',
    avatarChar: '♚',
    accentColor: '#c29b48',
    bio: 'Stockfish 16 at peak depth. Ruthless precision, flawless endgames, zero tactical mercy.',
    style: 'grandmaster',
    skillLevel: 20,
    maxDepth: 16,
    movetimeMs: 1200,
    quotes: {
      greeting: 'Precision in every position. Let us test your limits.',
      win: 'The endgame was mathematically decided ten moves ago.',
      loss: 'Unbelievable accuracy. You played like a true World Champion.',
    },
  },
];

export function getBotById(id: string): BotPersona {
  return BOT_PERSONAS.find((b) => b.id === id) || BOT_PERSONAS[2];
}

