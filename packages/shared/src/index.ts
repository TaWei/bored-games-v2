// @bored-games/shared — types, schemas, utilities, and game engine interfaces

// ─── Types ────────────────────────────────────────────────
export {
  type GameType,
  isGameType,
  type SessionMetadata,
  type Player,
  type Spectator,
  type RoomStatus,
  type Room,
  type BaseGameState,
  type MoveErrorCode,
  type MoveError,
  type MoveResult,
  type GameEndReason,
  type GameEnd,
  type GameMeta,
} from './types';

// ─── Zod Schemas ──────────────────────────────────────────
export {
  RoomSchema,
  PlayerSchema,
  BaseGameStateSchema,
  MoveErrorSchema,
  GameEndSchema,
  GameMetaSchema,
} from './schemas/index';

// ─── Utilities ────────────────────────────────────────────
export { generateRoomCode, isValidRoomCode } from './utils/room-code';
export { generateSessionId, isValidSessionId } from './utils/session';
export { generateDisplayName, isValidDisplayName } from './utils/display-name';

// ─── Game Engine Registry ─────────────────────────────────
export { registerGame, getEngine, listGames } from './games/registry';
export { type Result, type GameEngine } from './games/types';
