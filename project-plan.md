# Bored Games v2 — Project Plan (Tic-Tac-Toe MVP)

> Each ticket is **~10 minutes**. Strictly sequential. **TDD enforced in every ticket.**
>
> Every implementation ticket follows: **RED** (write failing test) → **GREEN** (minimal code to pass) → **REFACTOR** (clean up with test safety net).

---

## Phase 0: Scaffolding

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 0.1 | Monorepo root | — | Create `package.json` with Bun workspaces (`packages/shared`, `server`, `client`), scripts (`dev`, `build`, `test`), engines field |
| 0.2 | `tsconfig.base.json` | — | Shared TypeScript config: `ES2022`, `strict`, `bundler` resolution, `declaration`, `sourceMap` |
| 0.3 | `packages/shared` | `bun test` fails — no package yet | `packages/shared/package.json` (name: `@bored-games/shared`), `tsconfig.json`, empty `src/index.ts`. `bun test` passes (0 tests) |
| 0.4 | `server` scaffold | `bun test` fails — no package | `server/package.json` (depends on `@bored-games/shared`), `tsconfig.json`, empty `src/index.ts` |
| 0.5 | `client` scaffold | `bun test` fails — no package | `client/package.json` (depends on `@bored-games/shared`), `tsconfig.json`, `vite.config.ts` with `/api` and `/ws` proxy to `localhost:3000`, empty `src/App.tsx` |
| 0.6 | Docker compose | — | `docker-compose.yml`: Redis 7 Alpine (port 6379) + PostgreSQL 16 Alpine (port 5432), healthchecks, named volumes |
| 0.7 | `bun install` | — | Run `bun install`; verify `bun run test` works across all workspaces |
| 0.8 | `.env.example` | — | `PORT=3000`, `REDIS_URL`, `DATABASE_URL`, `NODE_ENV`, `ROOM_TTL_MINUTES` |

---

## Phase 1: Shared Types & Schemas

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 1.1 | `GameType` | Test: `GameType` only accepts `'tic-tac-toe'`, rejects other strings | Define `GameType = 'tic-tac-toe'` in `packages/shared/src/types.ts` |
| 1.2 | `SessionMetadata` + `Player` + `Spectator` | Test: types accept valid shapes, reject missing fields | Define `SessionMetadata`, `Player`, `Spectator` in `types.ts` |
| 1.3 | `Room` + `RoomStatus` | Test: `Room` shape matches spec (code, gameType, hostSessionId, status, players, spectators, createdAt, maxPlayers, rematchRequests) | Define `Room`, `RoomStatus` in `types.ts` |
| 1.4 | `BaseGameState` | Test: `BaseGameState` has required fields, all `readonly` | Define `BaseGameState` in `types.ts` |
| 1.5 | `MoveResult<T>` + `MoveError` | Test: `{ ok: true, state }` and `{ ok: false, error }` discriminated correctly | Define `MoveResult<S>`, `MoveError` with error codes in `types.ts` |
| 1.6 | `GameEnd` + `GameEndReason` | Test: `GameEnd` with winner and reason shapes valid | Define `GameEnd`, `GameEndReason` in `types.ts` |
| 1.7 | `GameMeta` | Test: `GameMeta` has gameType, name, description, minPlayers, maxPlayers, slug, icon | Define `GameMeta` in `types.ts` |
| 1.8 | Zod schemas | Test: valid JSON parses to typed objects; invalid JSON throws ZodError with path info | Write Zod schemas for Room, Player, BaseGameState, MoveError, GameEnd, GameMeta in `packages/shared/src/schemas/index.ts` |
| 1.9 | `room-code` utils | Test: `generateRoomCode()` returns 6-char alphanumeric string; `isValidRoomCode()` rejects short/long/invalid codes | Implement in `packages/shared/src/utils/room-code.ts` |
| 1.10 | `session` utils | Test: `generateSessionId()` returns valid UUID; `isValidSessionId()` rejects invalid UUIDs | Implement in `packages/shared/src/utils/session.ts` |
| 1.11 | `display-name` utils | Test: `generateDisplayName()` returns "AdjectiveNoun" format; `isValidDisplayName()` rejects empty/too-long names | Implement in `packages/shared/src/utils/display-name.ts` |
| 1.12 | Shared index exports | Test: all types, schemas, and utils re-exported from `@bored-games/shared` | `packages/shared/src/index.ts` re-exports everything |

---

## Phase 2: Game Engine Interface + Registry

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 2.1 | `Result<T, E>` type | Test: `Result<number, string>` with ok and error variants | Define `Result<T, E>` in `packages/shared/src/games/types.ts` |
| 2.2 | `GameEngine` interface | Test: TypeScript compilation — a valid engine must implement `gameType`, `playerCount`, `meta`, `init()`, `reduce()`, `legalEvents()`, `checkEnd()`, `view()` | Define `GameEngine<G, S, E>` interface in `games/types.ts` |
| 2.3 | `GameRegistry` | Test: register an engine → `getEngine()` returns it; `listGames()` returns metadata; unknown type throws | Implement `Map<GameType, GameEngine>` + `registerGame()`, `getEngine()`, `listGames()` in `games/registry.ts` |

---

## Phase 3: Tic-Tac-Toe Engine (Strict TDD)

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 3.1 | `TicTacToeState` + `TicTacToeConfig` types | Test: state has 3×3 board, players, turn, moveCount; config is empty object | Define types in `games/tic-tac-toe/types.ts` |
| 3.2 | `init()` | Test: `init({}, ['p1','p2'])` → state with empty board, `players=['p1','p2']`, `turn='p1'`, `moveCount=0`, `gameType='tic-tac-toe'` | Implement `init()` |
| 3.3 | `legalEvents()` — empty cell | Test: on empty board, `legalEvents(state, 'p1')` returns 9 `PIECE_PLACED` events (cells 0-8) | Implement `legalEvents()` for empty cells |
| 3.4 | `legalEvents()` — occupied + wrong turn | Test: after cell 4 placed, `legalEvents(state, 'p2')` returns 8 events (all except cell 4); `legalEvents(state, 'p1')` returns 0 (not p1's turn) | Extend `legalEvents()` with turn + occupation checks |
| 3.5 | `reduce()` — valid move | Test: `reduce(state, { type:'PIECE_PLACED', cell:4, playerId:'p1' })` → state with X at cell 4, `turn='p2'`, `moveCount=1`. State is new object (immutable). | Implement `reduce()` for valid moves |
| 3.6 | `reduce()` — error cases | Test: placing on occupied cell → error `CELL_OCCUPIED`; wrong player's turn → error `NOT_YOUR_TURN`; game over → error `GAME_OVER` | Extend `reduce()` with validation |
| 3.7 | `checkEnd()` — win | Test: X fills row 0 (cells 0,1,2) → `{ winner: 'p1', reason: 'THREE_IN_A_ROW' }`; O fills column 1 → `{ winner: 'p2', reason: 'THREE_IN_A_ROW' }`; diagonal wins too | Implement `checkEnd()` win detection |
| 3.8 | `checkEnd()` — draw | Test: full board, no winner → `{ winner: null, reason: 'BOARD_FULL' }` | Extend `checkEnd()` with draw detection |
| 3.9 | `checkEnd()` — ongoing | Test: mid-game → `null` | Already handled |
| 3.10 | `view()` | Test: `view(state, playerId)` returns same state for both players (no hidden info) | Implement `view()` — return state as-is |
| 3.11 | Replay correctness | Test: apply sequence of events from scratch = same state as incremental play | Should pass since `reduce` is pure |
| 3.12 | Register in registry | Test: `getEngine('tic-tac-toe')` returns the tic-tac-toe engine; `listGames()` includes it | Register in `games/registry.ts` |

---

## Phase 4: Server Foundation

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 4.1 | Redis client | Test: `redis.ping()` returns `PONG`; `redisSub` is separate connection | `server/src/lib/redis.ts`: create Redis client from `REDIS_URL`, export `redis`, `redisSub`, `CHANNELS` constants |
| 4.2 | Config module | Test: parses env vars, falls back to defaults; `PORT=3000`, `isDevelopment=true` when `NODE_ENV != 'production'` | `server/src/lib/config.ts`: parse and export config |
| 4.3 | Hono app + `/health` | Test: `GET /health` → 200, body has `{ status: 'ok', timestamp, uptime }` | `server/src/index.ts`: Hono app with CORS, logger, `/health` endpoint |
| 4.4 | Routes index | Test: `/api/games` returns 200; `/api/rooms` returns 200 (stubs) | `server/src/routes/index.ts`: merge sub-routers; `games.ts` and `rooms.ts` with stub routes |
| 4.5 | Server startup | Test: server starts on PORT, logs startup banner | Wire up `serve()` with `fetch` + `websocket` handlers (WS as stub for now) |

---

## Phase 5: Room Management

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 5.1 | `createRoom()` | Test: creates room with generated code, stores in Redis, returns `Room` object with correct fields | `server/src/services/room-manager.ts`: `createRoom(gameType, hostSessionId, displayName)` |
| 5.2 | `getRoom()` | Test: get existing room returns `Room`; expired/missing room returns `null` | `getRoom(code)` reads from Redis |
| 5.3 | `updateRoom()` | Test: update room → read back has new data, TTL refreshed | `updateRoom(room)` writes to Redis |
| 5.4 | `joinRoom()` | Test: join adds player with symbol, returns updated room; join full room → error | `joinRoom(code, sessionId, displayName)` |
| 5.5 | `leaveRoom()` | Test: leave removes player; if host leaves, next player becomes host; empty room marked abandoned | `leaveRoom(code, sessionId)` |
| 5.6 | `POST /api/rooms` | Test: HTTP POST → 201 with `{ roomCode, room }`; invalid body → 400 | Hono route: validate body with Zod, call `createRoom()` |
| 5.7 | `GET /api/rooms/:code` | Test: valid code → 200 with room; invalid code → 404 | Hono route: call `getRoom()`, return 200 or 404 |
| 5.8 | `POST /api/rooms/:code/join` | Test: join → 200 with room + symbol; already in room → 200; room full → 409 | Hono route: call `joinRoom()` |
| 5.9 | Room TTL | Test: room auto-expires after TTL; accessing expired room returns null | Set Redis `EX` on room key; test with short TTL |

---

## Phase 6: Game Routes

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 6.1 | `GET /api/games` | Test: returns `{ games: [...] }` with tic-tac-toe meta | Route calls `listGames()` from registry |
| 6.2 | `GET /api/games/:type` | Test: `GET /api/games/tic-tac-toe` → 200 with meta; unknown type → 404 | Route calls `getEngine()`, returns meta or 404 |

---

## Phase 7: WebSocket

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 7.1 | Upgrade handler | Test: `GET /ws?room=ABCDEF&sessionId=<uuid>` → 101 upgrade; missing params → 400 | `server/src/ws/handler.ts`: validate params, upgrade |
| 7.2 | Open handler | Test: on open, connection registered, subscribed to room channel | `handleWebSocket()`: validate session + room exist, track connection |
| 7.3 | Message parser | Test: valid JSON message → routed; malformed JSON → ignored with error log; missing type → rejected | Parse, Zod validate, route to handler map |
| 7.4 | Heartbeat | Test: client sends `{ type: 'HEARTBEAT' }` → server replies `{ type: 'PONG' }`; no heartbeat for 90s → close | Heartbeat handler + timeout tracking |
| 7.5 | Close handler | Test: on close, connection removed; if last player leaves, room marked abandoned | `handleWSClose()`: cleanup connections |
| 7.6 | Reconnect | Test: disconnect during game, reconnect → receive current game state. No missed events in simple case. | On open, if session already in room, send current state via WS |

---

## Phase 8: Game Loop

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 8.1 | GameLoop class | Test: instantiates with room code, empty connections map, null state | `server/src/ws/game-loop.ts`: `GameLoop` class constructor |
| 8.2 | Game start | Test: host sends `START_GAME` when room full → state initialized, `GAME_STARTED` broadcast with state via Pub/Sub to all connections | `startGame()`: call `engine.init()`, store state, broadcast |
| 8.3 | Handle MOVE | Test: player sends `PIECE_PLACED` for valid cell → state updated, broadcast to all; invalid move → error sent to sender only; not player's turn → error | Parse move, `engine.legalEvents()` check, `engine.reduce()`, broadcast state |
| 8.4 | Game end | Test: winning move → `GAME_ENDED` broadcast with result; state shows winner | After each move, call `engine.checkEnd()`, broadcast if game over |
| 8.5 | Spectator mode | Test: spectator connects, receives state broadcasts, cannot send moves → `NOT_PLAYER` error | Spectator connection tracking + move rejection |
| 8.6 | Rematch | Test: both players send `REMATCH_REQUEST` → state reset, `GAME_STARTED` broadcast | `handleRematchRequest()`: flag player, when all flagged → re-init |
| 8.7 | Leave during game | Test: player leaves → other player wins, `GAME_ENDED` broadcast with `RESIGNATION` reason | `handleLeaveRoom()`: if game in progress, forfeit |

---

## Phase 9: Client Foundation

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 9.1 | Vite proxy | Test: `fetch('/api/games')` in browser reaches Hono server; `new WebSocket('ws://localhost:5173/ws?...')` reaches Bun WS | Verify `client/vite.config.ts` proxy works |
| 9.2 | React shell | Test: renders App with Router, `/` shows "Bored Games" heading | `App.tsx`: React Router, Layout component, routes for `/` and `/room/:code` |
| 9.3 | Session store | Test: generates sessionId on first visit, persists to localStorage, loads on refresh; `setDisplayName()` updates | Zustand store: `sessionId`, `displayName`, actions |
| 9.4 | API client | Test: `api.getGames()` calls `/api/games` and returns typed response; errors thrown on non-2xx | `client/src/lib/api.ts`: typed fetch wrapper with error handling |
| 9.5 | WebSocket hook | Test: connects to WS, receives messages, calls onMessage callback; reconnects on close with backoff; `send(message)` sends JSON | `client/src/hooks/useWebSocket.ts`: connection, reconnect, send, message dispatch |
| 9.6 | Game state store | Test: `handleServerMessage({ type: 'GAME_STARTED', state })` updates store; `handleServerMessage({ type: 'STATE_UPDATED', state })` updates | Zustand store: `currentGame`, `gameState`, `players`, `status`, actions for each server message type |

---

## Phase 10: Lobby UI

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 10.1 | Home page | Test: renders game cards from API; loading spinner while fetching; error message on failure | `pages/Home.tsx`: fetch games, render cards with icon, name, description, player count |
| 10.2 | Create room | Test: click game card → API call → redirect to `/room/:code` | On click, `api.createRoom(gameType)` → `navigate(/room/${roomCode})` |
| 10.3 | Room page | Test: renders room code, player list, copy button; shows "Start Game" for host when room full; shows "Join" for new visitors | `pages/Room.tsx`: fetch room info, render lobby, join/start actions |
| 10.4 | WS integration | Test: connecting to room page opens WS; `PLAYER_JOINED` message adds player to list; `PLAYER_LEFT` removes; `GAME_STARTED` transitions to game view | Wire up `useWebSocket` in Room page, update store on messages |

---

## Phase 11: Tic-Tac-Toe UI

| # | Ticket | RED | GREEN |
|---|--------|-----|-------|
| 11.1 | Board component | Test: renders 3×3 grid; cells 0-8; click handler fires with cell index; X/O marks render correctly | `games/tic-tac-toe/Board.tsx`: grid of 9 clickable cells |
| 11.2 | Game view | Test: shows "Your turn" / "Waiting..." based on current player; disables clicks when not your turn; shows X/O symbols on board | `games/tic-tac-toe/GameView.tsx`: Board + turn indicator + status |
| 11.3 | Move sending | Test: click cell → WS sends `{ type: 'MOVE', payload: { type: 'PIECE_PLACED', cell: N } }`; board updates from server response | Wire click handler → `ws.send()`; update store on `STATE_UPDATED` |
| 11.4 | End state | Test: winner banner shows "You Win!" / "Player X Wins!" / "Draw!"; rematch button visible; clicking rematch sends `REMATCH_REQUEST` | Conditionally render result banner + rematch button |

---

## Summary

| Phase | Tickets | Purpose |
|-------|---------|---------|
| 0: Scaffolding | 8 | Monorepo, tsconfig, Docker, `bun install` |
| 1: Shared Types | 12 | All core types, Zod schemas, utilities |
| 2: Engine Interface | 3 | `GameEngine`, `Result`, `GameRegistry` |
| 3: Tic-Tac-Toe Engine | 12 | Full TDD engine: init → legalEvents → reduce → checkEnd → view → register |
| 4: Server Foundation | 5 | Redis, config, Hono, routes index, startup |
| 5: Room Management | 9 | Room CRUD + REST endpoints + TTL |
| 6: Game Routes | 2 | `GET /api/games` and `GET /api/games/:type` |
| 7: WebSocket | 6 | Upgrade, open, parse, heartbeat, close, reconnect |
| 8: Game Loop | 7 | Per-room state machine, move handling, end, rematch, leave |
| 9: Client Foundation | 6 | Vite, React shell, stores, API client, WS hook |
| 10: Lobby UI | 4 | Home page, create room, room lobby, WS integration |
| 11: Tic-Tac-Toe UI | 4 | Board, game view, moves, end state |
| **Total** | **78** | **~13 hours** |

---

## What's NOT in this plan (saved for later)

- Chess, Connect Four, Codenames, Avalon, Werewolf engines
- Event log (Redis Streams + PostgreSQL persistence)
- Leaderboard
- Matchmaking / quick play
- Structured logging, `/metrics`, rate limiting
- Mobile responsiveness, loading skeletons, error boundaries

---

> ⚠️ **Review this plan.** Every ticket has explicit RED → GREEN steps. 78 tickets, sequential, ~13 hours to a working Tic-Tac-Toe game. Ready to start Phase 0?
