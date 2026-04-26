import { describe, test, expect } from 'bun:test';

// Import the type we're testing — this will fail since types.ts doesn't exist yet
import type { GameType, SessionMetadata, Player, Spectator, Room, RoomStatus, BaseGameState, MoveResult, MoveError, GameEnd, GameEndReason, GameMeta } from './types';

describe('GameType', () => {
  test('accepts "tic-tac-toe"', () => {
    // Type-level check: this assignment must compile
    const gt: GameType = 'tic-tac-toe';
    expect(gt).toBe('tic-tac-toe');
  });

  test('rejects other strings', () => {
    // @ts-expect-error: 'chess' is not a valid GameType
    const _unused: GameType = 'chess';
    // If we reach here without a TS error, the test should still pass at runtime
    // The real test is the @ts-expect-error above catching the compile-time error
    expect(true).toBe(true);
  });

  test('rejects empty string', () => {
    // @ts-expect-error: '' is not a valid GameType
    const _unused: GameType = '';
    expect(true).toBe(true);
  });

  test('rejects random string', () => {
    // @ts-expect-error: 'checkers' is not a valid GameType
    const _unused: GameType = 'checkers';
    expect(true).toBe(true);
  });
});

describe('SessionMetadata', () => {
  test('accepts valid shape', () => {
    const meta: SessionMetadata = {
      sessionId: 'abc-123',
      displayName: 'TestPlayer',
      createdAt: Date.now(),
    };
    expect(meta.sessionId).toBe('abc-123');
    expect(meta.displayName).toBe('TestPlayer');
    expect(typeof meta.createdAt).toBe('number');
  });

  // @ts-expect-error: missing sessionId
  test('rejects missing sessionId', () => {
    const _bad: SessionMetadata = { displayName: 'Test', createdAt: 0 };
    expect(true).toBe(true);
  });

  // @ts-expect-error: missing displayName
  test('rejects missing displayName', () => {
    const _bad: SessionMetadata = { sessionId: 'x', createdAt: 0 };
    expect(true).toBe(true);
  });
});

describe('Player', () => {
  test('accepts valid shape', () => {
    const player: Player = {
      sessionId: 'p1',
      displayName: 'Alice',
      createdAt: Date.now(),
      symbol: 'X',
    };
    expect(player.symbol).toBe('X');
    expect(player.sessionId).toBe('p1');
  });

  // @ts-expect-error: missing symbol
  test('rejects missing symbol', () => {
    const _bad: Player = {
      sessionId: 'p1',
      displayName: 'Alice',
      createdAt: 0,
    };
    expect(true).toBe(true);
  });
});

describe('Spectator', () => {
  test('accepts valid shape (same as SessionMetadata)', () => {
    const spec: Spectator = {
      sessionId: 's1',
      displayName: 'Watcher',
      createdAt: Date.now(),
    };
    expect(spec.sessionId).toBe('s1');
  });
});

// ─── JER-33: Room + RoomStatus ─────────────────────────────

describe('RoomStatus', () => {
  test('accepts valid statuses', () => {
    const waiting: RoomStatus = 'waiting';
    const inProgress: RoomStatus = 'in_progress';
    const finished: RoomStatus = 'finished';
    const abandoned: RoomStatus = 'abandoned';
    expect(waiting).toBe('waiting');
    expect(inProgress).toBe('in_progress');
    expect(finished).toBe('finished');
    expect(abandoned).toBe('abandoned');
  });

  // @ts-expect-error: invalid status
  test('rejects invalid status', () => {
    const _bad: RoomStatus = 'playing';
    expect(true).toBe(true);
  });
});

describe('Room', () => {
  test('accepts valid shape', () => {
    const room: Room = {
      code: 'ABC123',
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-1',
      status: 'waiting',
      players: [],
      spectators: [],
      createdAt: Date.now(),
      maxPlayers: 2,
      rematchRequests: [],
    };
    expect(room.code).toBe('ABC123');
    expect(room.gameType).toBe('tic-tac-toe');
    expect(room.status).toBe('waiting');
    expect(room.maxPlayers).toBe(2);
  });

  // @ts-expect-error: missing required fields
  test('rejects missing fields', () => {
    const _bad: Room = { code: 'X' } as Room;
    expect(true).toBe(true);
  });
});

// ─── JER-34: BaseGameState ──────────────────────────────────

describe('BaseGameState', () => {
  test('accepts valid shape', () => {
    const state: BaseGameState = {
      gameType: 'tic-tac-toe',
      players: [
        { sessionId: 'p1', displayName: 'Alice', createdAt: 0, symbol: 'X' },
      ],
      currentTurn: 'p1',
      moveCount: 5,
    };
    expect(state.gameType).toBe('tic-tac-toe');
    expect(state.moveCount).toBe(5);
    expect(state.currentTurn).toBe('p1');
  });
});

// ─── JER-35: MoveResult + MoveError ─────────────────────────

describe('MoveError', () => {
  test('accepts valid error shape', () => {
    const err: MoveError = {
      code: 'CELL_OCCUPIED',
      message: 'That cell is already taken',
    };
    expect(err.code).toBe('CELL_OCCUPIED');
    expect(err.message).toBe('That cell is already taken');
  });
});

describe('MoveResult', () => {
  test('ok variant contains state', () => {
    const result: MoveResult<BaseGameState> = {
      ok: true,
      state: { gameType: 'tic-tac-toe', players: [], currentTurn: 'p1', moveCount: 0 },
    };
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.gameType).toBe('tic-tac-toe');
    }
  });

  test('error variant contains error', () => {
    const result: MoveResult<BaseGameState> = {
      ok: false,
      error: { code: 'NOT_YOUR_TURN', message: 'Not your turn' },
    };
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_YOUR_TURN');
    }
  });
});

// ─── JER-36: GameEnd + GameEndReason ────────────────────────

describe('GameEndReason', () => {
  test('accepts valid reasons', () => {
    const r1: GameEndReason = 'THREE_IN_A_ROW';
    const r2: GameEndReason = 'BOARD_FULL';
    const r3: GameEndReason = 'RESIGNATION';
    const r4: GameEndReason = 'TIMEOUT';
    const r5: GameEndReason = 'DISCONNECT';
    expect(r1).toBe('THREE_IN_A_ROW');
    expect(r5).toBe('DISCONNECT');
  });

  // @ts-expect-error: invalid reason
  test('rejects invalid reason', () => {
    const _bad: GameEndReason = 'CHEATING';
    expect(true).toBe(true);
  });
});

describe('GameEnd', () => {
  test('accepts win result', () => {
    const end: GameEnd = { winner: 'p1', reason: 'THREE_IN_A_ROW' };
    expect(end.winner).toBe('p1');
    expect(end.reason).toBe('THREE_IN_A_ROW');
  });

  test('accepts draw result', () => {
    const end: GameEnd = { winner: null, reason: 'BOARD_FULL' };
    expect(end.winner).toBeNull();
    expect(end.reason).toBe('BOARD_FULL');
  });
});

// ─── JER-37: GameMeta ───────────────────────────────────────

describe('GameMeta', () => {
  test('accepts valid shape', () => {
    const meta: GameMeta = {
      gameType: 'tic-tac-toe',
      name: 'Tic-Tac-Toe',
      description: 'The classic 3×3 grid game',
      minPlayers: 2,
      maxPlayers: 2,
      slug: 'tic-tac-toe',
      icon: '🎯',
    };
    expect(meta.gameType).toBe('tic-tac-toe');
    expect(meta.name).toBe('Tic-Tac-Toe');
    expect(meta.minPlayers).toBe(2);
    expect(meta.maxPlayers).toBe(2);
    expect(meta.icon).toBe('🎯');
  });
});
