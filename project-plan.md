# Bored Games v2 — Project Plan

> Each ticket is designed to be **~10 minutes** of focused work.
> Tickets are **strictly sequential** — each depends on the previous.
> Every implementation ticket starts with a **failing test** (TDD).

---

## Phase 0: Scaffolding

| # | Ticket | Description |
|---|--------|-------------|
| 0.1 | Monorepo root | Create `package.json` with Bun workspaces (`packages/shared`, `server`, `client`), scripts (`dev`, `build`, `test`, `clean`), and engines field |
| 0.2 | `tsconfig.base.json` | Shared TypeScript config: `ES2022`, `strict`, `bundler` resolution, `declaration`, `sourceMap` |
| 0.3 | `packages/shared` | Create `packages/shared/package.json` (name: `@bored-games/shared`, exports `./src/index.ts`), `tsconfig.json` extending base |
| 0.4 | `server` scaffold | Create `server/package.json` (depends on `@bored-games/shared`), `tsconfig.json`, empty `src/index.ts` |
| 0.5 | `client` scaffold | Create `client/package.json` (depends on `@bored-games/shared`), `tsconfig.json`, `vite.config.ts` with proxy, empty `src/App.tsx` |
| 0.6 | Docker compose | `docker-compose.yml`: Redis 7 Alpine + PostgreSQL 16 Alpine + healthchecks. Same as v1. |
| 0.7 | `bun install` | Run `bun install` and verify all workspaces resolve |
| 0.8 | `.env.example` | Environment variables template: `PORT`, `REDIS_URL`, `DATABASE_URL`, `NODE_ENV`, `ROOM_TTL_MINUTES` |

---

## Phase 1: Shared Types & Schemas

| # | Ticket | Description |
|---|--------|-------------|
| 1.1 | `GameType` enum | Define `GameType` discriminated union: `'tic-tac-toe'` (others added later). Write test that all engine lookups type-check. |
| 1.2 | `SessionMetadata` + `Player` | `SessionMetadata { sessionId, displayName }`, `Player { sessionId, displayName, symbol, joinedAt }`, `Spectator` type |
| 1.3 | `Room` type | `Room { code, gameType, hostSessionId, status, players, spectators, createdAt, maxPlayers, rematchRequests }` with `RoomStatus` union |
| 1.4 | `BaseGameState` | `BaseGameState { gameType, players, turn, moveCount, result?, updatedAt }` — all fields `readonly` |
| 1.5 | `MoveResult<T>` | `MoveResult<S> = { ok: true, state: S } | { ok: false, error: MoveError }` with `MoveError` codes enum |
| 1.6 | `GameEnd` type | `GameEnd { winner: string | null, reason: GameEndReason }` with `GameEndReason` discriminated union |
| 1.7 | `GameEvent` base | Define `GameEvent` discriminated union base type: `{ type: string, playerId: string, timestamp: number }`. Each game extends with specific events. |
| 1.8 | `GameMeta` type | `GameMeta { gameType, name, description, minPlayers, maxPlayers, slug, icon }` |
| 1.9 | Zod schemas | Write Zod schemas for all types above. Test that valid JSON parses and invalid JSON throws. |
| 1.10 | Utility: `room-code` | `generateRoomCode()` (6-char alphanumeric), `isValidRoomCode()`. Tests. |
| 1.11 | Utility: `session` | `generateSessionId()` (UUID), `isValidSessionId()`. Tests. |
| 1.12 | Utility: `display-name` | `generateDisplayName()` (adjective+noun), `isValidDisplayName()`. Tests. |

---

## Phase 2: Game Engine Interface + Registry

| # | Ticket | Description |
|---|--------|-------------|
| 2.1 | `GameEngine` interface | Define `GameEngine<G extends GameConfig, S extends GameState, E extends GameEvent>` with: `gameType`, `playerCount: { min, max }`, `meta: GameMeta`, `init(config: G): S`, `reduce(state: S, event: E): Result<S, GameError>`, `legalEvents(state: S, playerId: string): E[]`, `checkEnd(state: S): GameEnd | null`, `view(state: S, playerId: string): S`. Export from `shared/src/games/types.ts`. |
| 2.2 | `Result<T, E>` type | Simple `Result<T, E> = { ok: true, value: T } | { ok: false, error: E }`. Tests. |
| 2.3 | `GameRegistry` | `Map<GameType, GameEngine>` + `registerGame()`, `getEngine()`, `listGames()` functions. Test registration and lookup. |
| 2.4 | `GameConfig` base | `GameConfig` discriminated union — empty for now, extended per-game. |

---

## Phase 3: Tic-Tac-Toe Engine (TDD)

| # | Ticket | Description |
|---|--------|-------------|
| 3.1 | RED: `init` test | Write test: `init()` creates empty 3×3 board, `players` array, `turn = players[0]`, `moveCount = 0`, no result. |
| 3.2 | GREEN: `init` + types | Implement `TicTacToeState` (extends `BaseGameState`, adds `board: readonly (readonly string[])[]`, `winningLine?`), `TicTacToeConfig {}`, and `init()`. |
| 3.3 | RED: `legalEvents` test | Write tests: empty board → 9 legal placements; after a move → 8 legal; occupied cell not legal; wrong player's turn. |
| 3.4 | GREEN: `legalEvents` | Implement `legalEvents(state, playerId)`: return `PIECE_PLACED` events for each empty cell if it's player's turn and game not over. |
| 3.5 | RED: `reduce` test | Write tests: placing X at cell 4 updates board, switches turn, increments moveCount. Placing on occupied cell returns error. Wrong turn returns error. |
| 3.6 | GREEN: `reduce` | Implement `reduce(state, event)`: validate → produce new immutable state with move applied. |
| 3.7 | RED: `checkEnd` test | Write tests: three X in a row → X wins; three O in a column → O wins; full board no winner → draw; mid-game → null. |
| 3.8 | GREEN: `checkEnd` | Implement `checkEnd(state)`: check all rows/cols/diagonals, check draw. Return `GameEnd` or `null`. |
| 3.9 | RED: `view` test | Write test: `view()` returns same state for both players (no hidden info in tic-tac-toe). |
| 3.10 | GREEN: `view` | Implement `view(state, playerId)`: return state as-is. |
| 3.11 | RED: replay test | Write test: apply all events from an event log → state matches snapshot. |
| 3.12 | GREEN: replay | Verify replay works (should already pass since `reduce` is pure). |
| 3.13 | Register engine | Register `ticTacToeEngine` in the game registry. Test lookup. |

---

## Phase 4: Server — Foundation

| # | Ticket | Description |
|---|--------|-------------|
| 4.1 | Redis client | `server/src/lib/redis.ts`: create Redis client with `REDIS_URL` env, `redis.ping()` test, `redisSub` for pub/sub. Export `CHANNELS` constants. |
| 4.2 | PostgreSQL + Drizzle | `server/src/lib/db.ts`: Drizzle client with `DATABASE_URL`. Schema file with initial migration. `bun run db:migrate` works. |
| 4.3 | Config module | `server/src/lib/config.ts`: parse env vars, export `PORT`, `isDevelopment`, `ROOM_TTL_MS`, `MOVE_RATE_LIMIT`. Write test. |
| 4.4 | Hono app | `server/src/index.ts`: create Hono app, CORS middleware, logger middleware, `/health` endpoint returning `{ status, timestamp, uptime }`. Test health endpoint returns 200. |
| 4.5 | Route index | `server/src/routes/index.ts`: Hono router merging `/rooms`, `/games`, `/leaderboard` sub-routers. Empty stubs for now. |

---

## Phase 5: Server — Room Management

| # | Ticket | Description |
|---|--------|-------------|
| 5.1 | Room manager: create | `server/src/services/room-manager.ts`: `createRoom(gameType, hostSessionId, hostDisplayName)`: generate code, store Room in Redis with TTL. Return room. Test. |
| 5.2 | Room manager: get | `getRoom(code)`: fetch room from Redis, parse, return. `null` if not found/expired. Test. |
| 5.3 | Room manager: update | `updateRoom(room)`: write updated room to Redis, refresh TTL. Test. |
| 5.4 | Room manager: join | `joinRoom(code, sessionId, displayName)`: add player/symbol, update room, return. Errors: room full, already joined. Test. |
| 5.5 | Room manager: spectate | `joinAsSpectator(code, sessionId, displayName)`: add spectator. Test. |
| 5.6 | Room manager: leave | `leaveRoom(code, sessionId)`: remove player/spectator, reassign host if needed, mark abandoned if empty. Test. |
| 5.7 | Room manager: status | `updateRoomStatus(code, status)`: update status field. Test. |
| 5.8 | Rate limiting | `checkRateLimit(sessionId, action)`: Redis sliding window. Test. |
| 5.9 | POST `/api/rooms` | Hono route: validate body with Zod, create room, return `{ roomCode, room }`. Test with HTTP calls. |
| 5.10 | GET `/api/rooms/:code` | Return room info. 404 if not found. Test. |
| 5.11 | POST `/api/rooms/:code/join` | Join room. Handle errors (full, already in). Test. |
| 5.12 | POST `/api/rooms/:code/spectate` | Spectate room. Test. |

---

## Phase 6: Server — Game Routes

| # | Ticket | Description |
|---|--------|-------------|
| 6.1 | GET `/api/games` | `games.list()` from registry → return `{ games: GameMeta[] }`. Test. |
| 6.2 | GET `/api/games/:type` | Return single game metadata. 404 for unknown types. Test. |

---

## Phase 7: Server — WebSocket

| # | Ticket | Description |
|---|--------|-------------|
| 7.1 | WS upgrade handler | `server/src/ws/handler.ts`: handle `/ws?room=CODE&sessionId=ID&mode=play|spectate`, validate params, upgrade connection. Test upgrade path. |
| 7.2 | WS open handler | On open: validate session + room exist, create connection entry, subscribe to room Pub/Sub channel. Test. |
| 7.3 | WS message parser | Parse incoming JSON messages: `{ type: string, payload: unknown }`. Validate with Zod. Route to handler map. Test invalid JSON rejection. |
| 7.4 | WS heartbeat | Client sends `HEARTBEAT` every 30s. Server responds with `PONG`. Track last heartbeat. Test timeout detection. |
| 7.5 | WS close handler | On close: remove connection, check if room should be cleaned up (all disconnected). Test. |
| 7.6 | WS reconnect + replay | On reconnect, detect existing session in room, replay missed events from Redis stream. Test: disconnect during game, reconnect, receive missed moves. |

---

## Phase 8: Server — Game Loop

| # | Ticket | Description |
|---|--------|-------------|
| 8.1 | GameLoop class | `server/src/ws/game-loop.ts`: class managing per-room game state. `constructor(roomCode)`, connections map, event log array. Test instantiation. |
| 8.2 | Game start | `startGame()`: when room fills (players === maxPlayers), call `engine.init()`, store state, broadcast `GAME_STARTED`. Test. |
| 8.3 | Handle MOVE | Parse move from client, validate with `engine.legalEvents()`, check turn, call `engine.reduce()`, broadcast new state via Pub/Sub. Test full move flow. |
| 8.4 | Game end detection | After each move, call `engine.checkEnd()`. If game over: broadcast `GAME_ENDED`, call `recordGameResult()`. Test. |
| 8.5 | Rematch handling | `REMATCH_REQUEST` message: toggle player flag. When all players request, call `engine.init()` and broadcast `GAME_STARTED` again. Test. |
| 8.6 | Spectator broadcast | Spectators receive same state broadcasts as players via Pub/Sub, but cannot send moves. Test. |
| 8.7 | CHAT handling | `CHAT` message: validate content length, broadcast to room. Test. |
| 8.8 | RESIGN handling | `RESIGN` message: validate player is in game, check game not over, mark other player as winner, broadcast `GAME_ENDED`. Test. |

---

## Phase 9: Event Log & Replay

| # | Ticket | Description |
|---|--------|-------------|
| 9.1 | Append to Redis stream | Each game event is `XADD`'d to `room:{code}:events` stream. Test. |
| 9.2 | Append to PostgreSQL | Each game event is inserted into `game_events` table. Test. |
| 9.3 | Event replay function | `replayEvents(code, fromSeq)`: read from Redis stream starting at `fromSeq`, return events. Test. |
| 9.4 | GET `/api/games/:code/replay` | Endpoint returning event log for a completed game. Test. |

---

## Phase 10: Server — Leaderboard

| # | Ticket | Description |
|---|--------|-------------|
| 10.1 | Leaderboard schema | Drizzle schema: `leaderboard` table (sessionHash, gameType, wins, losses, draws, gamesPlayed, winRate, updatedAt). Migration. |
| 10.2 | `recordGameResult` | Given game result + players, update leaderboard entries. Upsert pattern. Test. |
| 10.3 | GET `/api/leaderboard/:gameType` | Query top 100 players by win rate, return ranked list. Test. |
| 10.4 | Redis leaderboard cache | Cache leaderboard in Redis sorted set, invalidate on game result. Test cache hit/miss. |

---

## Phase 11: Client Foundation

| # | Ticket | Description |
|---|--------|-------------|
| 11.1 | Vite config | Proxy `/api` and `/ws` to `localhost:3000`. React plugin. Dev server on port 5173. Test proxy works. |
| 11.2 | React app shell | `App.tsx`: React Router with routes `/` (home), `/room/:code` (game room). Basic layout component. Test render. |
| 11.3 | Session store | Zustand store: `sessionId` (generate or load from localStorage), `displayName`. Actions: `setDisplayName`. Test. |
| 11.4 | API client | `client/src/lib/api.ts`: typed fetch wrapper for all REST endpoints. `getGames()`, `createRoom()`, `joinRoom()`, etc. Test with mocked fetch. |
| 11.5 | WebSocket hook | `client/src/hooks/useWebSocket.ts`: connect to `/ws`, auto-reconnect with backoff, parse messages, dispatch to callback. Test with mock WebSocket. |
| 11.6 | Game state store | Zustand store: `currentGame`, `gameState`, `players`. Actions: `handleServerMessage`. Test state updates from mock messages. |

---

## Phase 12: Client — Lobby & Room

| # | Ticket | Description |
|---|--------|-------------|
| 12.1 | Home page | `pages/Home.tsx`: fetch game list from API, render game cards (icon, name, description, player count). Loading/error states. Test render with mocked API. |
| 12.2 | Create room flow | Click game card → `POST /api/rooms` → redirect to `/room/:code`. Test. |
| 12.3 | Join room page | Route `/room/:code`: fetch room info, show join button or spectate button. Test. |
| 12.4 | Room lobby | Show player list, game info, copy room code button, start game button (host only). React to `PLAYER_JOINED`/`PLAYER_LEFT` WS events. Test. |

---

## Phase 13: Client — Tic-Tac-Toe UI

| # | Ticket | Description |
|---|--------|-------------|
| 13.1 | Board component | `games/tic-tac-toe/Board.tsx`: 3×3 grid of clickable cells. Render X/O marks. Test render + click handler. |
| 13.2 | Game view | `games/tic-tac-toe/GameView.tsx`: wraps Board + turn indicator + status bar. Subscribes to game state store. Test. |
| 13.3 | WS integration | Click cell → send `MOVE` via WebSocket → update state from server broadcast. Test round-trip. |
| 13.4 | End state display | Show winner banner, draw banner, play again button (sends `REMATCH_REQUEST`). Test. |

---

## Phase 14: Chess Engine (TDD)

| # | Ticket | Description |
|---|--------|-------------|
| 14.1 | RED: Chess types | Write tests for `ChessState` (FEN-based), `ChessConfig`, `ChessEvent` types. |
| 14.2 | GREEN: Chess types | Implement types. |
| 14.3 | RED: `init` | Standard starting position FEN. Two players, white's turn. |
| 14.4 | GREEN: `init` | Implement `init()`. |
| 14.5 | RED: `legalEvents` | Tests: pawn moves, knight moves, captures, blocked paths, check restrictions. |
| 14.6 | GREEN: `legalEvents` | Implement move generation (use a lightweight FEN-based approach, not full chess engine). |
| 14.7 | RED: `reduce` | Tests: apply move → FEN updates, turn switches, captures, castling, en passant. |
| 14.8 | GREEN: `reduce` | Implement `reduce()`. |
| 14.9 | RED: `checkEnd` | Tests: checkmate, stalemate, draw. |
| 14.10 | GREEN: `checkEnd` | Implement `checkEnd()`. |
| 14.11 | Register engine | Add to game registry. |
| 14.12 | Chess UI | Board component (8×8), piece rendering (Unicode), move by click source → click destination. |

---

## Phase 15: Social Deduction Engines (TDD, one at a time)

| # | Ticket | Description |
|---|--------|-------------|
| 15.1-15.12 | Connect Four | Simple variant: 6×7 grid, drop-to-column mechanics. Same TDD pattern as Phase 13. |
| 15.13-15.25 | Codenames | 5×5 word grid, spymaster/operative roles, clue → guess flow, view() hides unrevealed cards from operatives. |
| 15.26-15.42 | Avalon | Roles (Merlin, Percival, Morgana, etc.), mission phases, team voting, assassination. view() handles secret role info. |
| 15.43-15.58 | Werewolf | Night/day phases, werewolf kills, seer peeks, voting. view() handles hidden roles. |

---

## Phase 16: Matchmaking

| # | Ticket | Description |
|---|--------|-------------|
| 16.1 | Queue service | `server/src/services/matchmaking.ts`: `joinQueue(sessionId, gameType)`, `leaveQueue()`, Redis sorted set by wait time. Test. |
| 16.2 | Queue processor | Every 2s: check each queue for `maxPlayers` waiting players. Create room, notify matched players via WS. Test. |
| 16.3 | POST `/api/matchmaking/join` | API endpoint. Test. |
| 16.4 | Client matchmaking UI | Quick play button on home page, "searching for players..." state. |

---

## Phase 17: Observability & Polish

| # | Ticket | Description |
|---|--------|-------------|
| 17.1 | Structured logging | Replace `console.log` with Bun's structured logger. Include request ID, session ID, room code in every log. |
| 17.2 | `/metrics` endpoint | Prometheus-compatible: connection count, active rooms, games played, move latency histogram. |
| 17.3 | Rate limiting middleware | Hono middleware: per-session rate limits on API endpoints. Test. |
| 17.4 | Error boundaries | React error boundaries for game crashes. Graceful UI fallback. |
| 17.5 | Loading skeletons | Skeleton components for game list, room lobby, board. |
| 17.6 | Mobile responsive | CSS adjustments for mobile game boards. Test at 375px width. |
| 17.7 | SEO meta tags | Title, description, OG tags per page. |

---

## Summary

| Phase | Tickets | Est. Total Time |
|-------|---------|-----------------|
| 0: Scaffolding | 8 | ~80 min |
| 1: Shared Types | 12 | ~120 min |
| 2: Engine Interface | 4 | ~40 min |
| 3: Tic-Tac-Toe Engine | 13 | ~130 min |
| 4: Server Foundation | 5 | ~50 min |
| 5: Room Management | 12 | ~120 min |
| 6: Game Routes | 2 | ~20 min |
| 7: WebSocket | 6 | ~60 min |
| 8: Game Loop | 8 | ~80 min |
| 9: Event Log | 4 | ~40 min |
| 10: Leaderboard | 4 | ~40 min |
| 11: Client Foundation | 6 | ~60 min |
| 12: Lobby & Room | 4 | ~40 min |
| 13: Tic-Tac-Toe UI | 4 | ~40 min |
| 14: Chess | 12 | ~120 min |
| 15: Social Deduction | ~46 | ~460 min |
| 16: Matchmaking | 4 | ~40 min |
| 17: Polish | 7 | ~70 min |
| **Total** | **~161** | **~27 hours** |

---

> ⚠️ **Before proceeding:** Please review this plan and confirm. Phases can be reordered, tickets can be split/merged, and scope can be adjusted. Which phase should we start with?
