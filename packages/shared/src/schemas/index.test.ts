import { describe, test, expect } from 'bun:test';
import {
  RoomSchema,
  PlayerSchema,
  BaseGameStateSchema,
  MoveErrorSchema,
  GameEndSchema,
  GameMetaSchema,
} from './index';

describe('RoomSchema', () => {
  test('parses valid room JSON', () => {
    const input = {
      code: 'ABC123',
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-1',
      status: 'waiting',
      players: [],
      spectators: [],
      createdAt: 1700000000000,
      maxPlayers: 2,
      rematchRequests: [],
    };
    const result = RoomSchema.parse(input);
    expect(result.code).toBe('ABC123');
  });

  test('rejects missing fields with path info', () => {
    const result = RoomSchema.safeParse({ code: 'X' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  test('rejects invalid gameType', () => {
    const result = RoomSchema.safeParse({
      code: 'ABC123',
      gameType: 'chess',
      hostSessionId: 'host-1',
      status: 'waiting',
      players: [],
      spectators: [],
      createdAt: 1700000000000,
      maxPlayers: 2,
      rematchRequests: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid status', () => {
    const result = RoomSchema.safeParse({
      code: 'ABC123',
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-1',
      status: 'playing',
      players: [],
      spectators: [],
      createdAt: 1700000000000,
      maxPlayers: 2,
      rematchRequests: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('PlayerSchema', () => {
  test('parses valid player', () => {
    const result = PlayerSchema.parse({
      sessionId: 'abc-123',
      displayName: 'Alice',
      createdAt: 1700000000000,
      symbol: 'X',
    });
    expect(result.symbol).toBe('X');
  });

  test('rejects missing symbol', () => {
    const result = PlayerSchema.safeParse({
      sessionId: 'abc',
      displayName: 'Bob',
      createdAt: 1700000000000,
    });
    expect(result.success).toBe(false);
  });
});

describe('BaseGameStateSchema', () => {
  test('parses valid state', () => {
    const result = BaseGameStateSchema.parse({
      gameType: 'tic-tac-toe',
      players: [{ sessionId: 'p1', displayName: 'Alice', createdAt: 1, symbol: 'X' }],
      currentTurn: 'p1',
      moveCount: 3,
    });
    expect(result.moveCount).toBe(3);
  });
});

describe('MoveErrorSchema', () => {
  test('parses valid error', () => {
    const result = MoveErrorSchema.parse({
      code: 'CELL_OCCUPIED',
      message: 'That cell is taken',
    });
    expect(result.code).toBe('CELL_OCCUPIED');
  });

  test('rejects missing code', () => {
    const result = MoveErrorSchema.safeParse({ message: 'oops' });
    expect(result.success).toBe(false);
  });
});

describe('GameEndSchema', () => {
  test('parses win result', () => {
    const result = GameEndSchema.parse({
      winner: 'p1',
      reason: 'THREE_IN_A_ROW',
    });
    expect(result.winner).toBe('p1');
  });

  test('parses draw result (null winner)', () => {
    const result = GameEndSchema.parse({
      winner: null,
      reason: 'BOARD_FULL',
    });
    expect(result.winner).toBeNull();
  });
});

describe('GameMetaSchema', () => {
  test('parses valid meta', () => {
    const result = GameMetaSchema.parse({
      gameType: 'tic-tac-toe',
      name: 'Tic-Tac-Toe',
      description: 'Classic game',
      minPlayers: 2,
      maxPlayers: 2,
      slug: 'tic-tac-toe',
      icon: '🎯',
    });
    expect(result.icon).toBe('🎯');
  });

  test('rejects missing slug', () => {
    const result = GameMetaSchema.safeParse({
      gameType: 'tic-tac-toe',
      name: 'Tic-Tac-Toe',
      description: 'Classic game',
      minPlayers: 2,
      maxPlayers: 2,
      icon: '🎯',
    });
    expect(result.success).toBe(false);
  });
});
