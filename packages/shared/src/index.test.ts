import { describe, test, expect } from 'bun:test';

// Import everything from the package entry point
import {
  // Types
  GameType,
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
  // Schemas
  RoomSchema,
  PlayerSchema,
  BaseGameStateSchema,
  MoveErrorSchema,
  GameEndSchema,
  GameMetaSchema,
  // Utils
  generateRoomCode,
  isValidRoomCode,
  generateSessionId,
  isValidSessionId,
  generateDisplayName,
  isValidDisplayName,
} from './index';

describe('shared index exports', () => {
  test('exports GameType type and guard', () => {
    const gt: GameType = 'tic-tac-toe';
    expect(isGameType(gt)).toBe(true);
    expect(isGameType('chess')).toBe(false);
  });

  test('exports SessionMetadata type', () => {
    const meta: SessionMetadata = { sessionId: 'x', displayName: 'Test', createdAt: 1 };
    expect(meta.sessionId).toBe('x');
  });

  test('exports Player type', () => {
    const p: Player = { sessionId: 'p1', displayName: 'Alice', createdAt: 1, symbol: 'X' };
    expect(p.symbol).toBe('X');
  });

  test('exports Spectator type', () => {
    const s: Spectator = { sessionId: 's1', displayName: 'Watcher', createdAt: 1 };
    expect(s.displayName).toBe('Watcher');
  });

  test('exports Room type and schema', () => {
    const room: Room = {
      code: 'ABC123',
      gameType: 'tic-tac-toe',
      hostSessionId: 'h1',
      status: 'waiting',
      players: [],
      spectators: [],
      createdAt: 1,
      maxPlayers: 2,
      rematchRequests: [],
    };
    const parsed = RoomSchema.parse(room);
    expect(parsed.code).toBe('ABC123');
  });

  test('exports BaseGameState type and schema', () => {
    const state: BaseGameState = {
      gameType: 'tic-tac-toe',
      players: [],
      currentTurn: null,
      moveCount: 0,
    };
    expect(BaseGameStateSchema.parse(state).moveCount).toBe(0);
  });

  test('exports MoveError and MoveResult types', () => {
    const ok: MoveResult<BaseGameState> = {
      ok: true,
      state: { gameType: 'tic-tac-toe', players: [], currentTurn: null, moveCount: 0 },
    };
    expect(ok.ok).toBe(true);

    const err: MoveResult<BaseGameState> = {
      ok: false,
      error: { code: 'NOT_YOUR_TURN', message: 'Nope' },
    };
    expect(err.ok).toBe(false);
  });

  test('exports GameEnd type and schema', () => {
    const end: GameEnd = { winner: 'p1', reason: 'THREE_IN_A_ROW' };
    expect(GameEndSchema.parse(end).winner).toBe('p1');
  });

  test('exports GameMeta type and schema', () => {
    const meta: GameMeta = {
      gameType: 'tic-tac-toe',
      name: 'Tic-Tac-Toe',
      description: 'Classic',
      minPlayers: 2,
      maxPlayers: 2,
      slug: 'tic-tac-toe',
      icon: '🎯',
    };
    expect(GameMetaSchema.parse(meta).name).toBe('Tic-Tac-Toe');
  });

  test('exports room-code utils', () => {
    const code = generateRoomCode();
    expect(isValidRoomCode(code)).toBe(true);
    expect(isValidRoomCode('bad')).toBe(false);
  });

  test('exports session utils', () => {
    const id = generateSessionId();
    expect(isValidSessionId(id)).toBe(true);
    expect(isValidSessionId('nope')).toBe(false);
  });

  test('exports display-name utils', () => {
    const name = generateDisplayName();
    expect(isValidDisplayName(name)).toBe(true);
    expect(isValidDisplayName('')).toBe(false);
  });
});
