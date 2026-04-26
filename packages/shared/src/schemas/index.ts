import { z } from 'zod';

// ─── Shared Sub-schemas ────────────────────────────────────

const sessionMetadataSchema = z.object({
  sessionId: z.string().min(1),
  displayName: z.string().min(1).max(50),
  createdAt: z.number().positive(),
});

// ─── Player ────────────────────────────────────────────────

export const PlayerSchema = sessionMetadataSchema.extend({
  symbol: z.string().min(1),
});

// ─── Room ──────────────────────────────────────────────────

export const RoomSchema = z.object({
  code: z.string().length(6),
  gameType: z.literal('tic-tac-toe'),
  hostSessionId: z.string().min(1),
  status: z.enum(['waiting', 'in_progress', 'finished', 'abandoned']),
  players: z.array(PlayerSchema),
  spectators: z.array(sessionMetadataSchema),
  createdAt: z.number().positive(),
  maxPlayers: z.number().int().min(1).max(20),
  rematchRequests: z.array(z.string()),
});

// ─── BaseGameState ─────────────────────────────────────────

export const BaseGameStateSchema = z.object({
  gameType: z.literal('tic-tac-toe'),
  players: z.array(PlayerSchema),
  currentTurn: z.string().nullable(),
  moveCount: z.number().int().min(0),
});

// ─── MoveError ─────────────────────────────────────────────

export const MoveErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

// ─── GameEnd ───────────────────────────────────────────────

export const GameEndSchema = z.object({
  winner: z.string().nullable(),
  reason: z.string().min(1),
});

// ─── GameMeta ──────────────────────────────────────────────

export const GameMetaSchema = z.object({
  gameType: z.literal('tic-tac-toe'),
  name: z.string().min(1),
  description: z.string().min(1),
  minPlayers: z.number().int().min(1),
  maxPlayers: z.number().int().min(1),
  slug: z.string().min(1),
  icon: z.string().min(1),
});
