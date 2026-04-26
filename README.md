# 🎲 Bored Games v2

> Anonymous real-time board games — rebuilt from the ground up.
> No account, no email, instant play.

**Stack:** **Bun** + **Hono** + **React** + **Redis** + **PostgreSQL**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Design Principles

Bored Games v2 is a ground-up rewrite guided by these principles:

### 1. Event Sourcing as the Source of Truth

Every game action is an **immutable event** appended to an event log. Game state is never mutated in place — it's a pure projection of the event stream.

- **Why:** Enables time-travel debugging, replay, audit trails, and offline resilience. If a client disconnects, it replays missed events on reconnect.
- **What this means:** No `state.board[row][col] = 'X'`. Instead: `appendEvent(state, { type: 'PIECE_PLACED', ... })` → state projection.

```
Event Log → State Projection → Client View
   ↑                              ↓
   └──── Apply Move ──── Validate ◄── Player Action
```

### 2. Pure, Deterministic Game Engines

Game engines are **pure functions** with zero side effects. Given the same event log, they always produce the same state.

- **Why:** Testability, determinism, and the ability to run engines in any environment (server, client, CI, Web Worker).
- **Constraint:** No `Math.random()` inside engines — randomness must be injected via seeded PRNG events.
- **Constraint:** No I/O, no network calls, no timers inside engine code.

### 3. Immutable State, Append-Only

State is **never mutated**. Every state transition produces a new state object. The event log is **append-only** — events are never modified or deleted.

- **Why:** Simplifies reasoning about concurrent changes, enables optimistic UI updates, and makes rollbacks trivial.
- **Implementation:** All state types use `Readonly<>` and `readonly` arrays. Deep clones at boundaries.

### 4. Transport-Agnostic Game Logic

The game engine layer knows nothing about WebSockets, HTTP, or any transport protocol. It speaks only in **events** and **projections**.

- **Why:** The same engine can power WebSocket real-time play, REST turn-based play, AI vs AI simulations, or embedded widgets.
- **Architecture:**
  ```
  Transport Layer (WS / SSE / REST / gRPC)
        ↕  typed events
  Game Orchestrator (validation, auth, room management)
        ↕  typed events
  Game Engine (pure state transitions)
  ```

### 5. Schema-First, Type-Safe

All events, states, and API contracts are defined as TypeScript discriminated unions with strict validation. No `any`, no runtime type uncertainty.

- **Why:** Catch bugs at compile time. Make impossible states impossible.
- **Tooling:** Zod schemas for runtime validation, TypeScript for compile-time. Generated JSON Schema for documentation.

### 6. Horizontal Scalability by Design

The system is designed to run across multiple server instances from day one. No in-memory state that can't be reconstructed.

- **Why:** Avoid the "rewrite for scale" trap. Even a hobby project should be architected correctly.
- **Implementation:** Redis as the coordination layer (Pub/Sub for fan-out, sorted sets for matchmaking, streams for event logs). PostgreSQL for durable persistence. State is always reconstructable from events.

### 7. Graceful Degradation & Resilience

The system handles failure modes explicitly. Disconnections, timeouts, and partial failures are first-class concerns.

- **Why:** Real-time multiplayer is inherently unreliable. The system must feel solid even when the network isn't.
- **Patterns:**
  - Reconnection with event replay (no missed moves)
  - Idempotent event processing
  - Timeout-based turn progression (Avalon, Codenames, Werewolf)
  - TTL-based room cleanup
  - Circuit breakers on external dependencies

### 8. Anonymous by Default, Identity Optional

No accounts required. A `sessionId` (crypto.randomUUID()) stored in localStorage is the only identity. Display names are ephemeral and changeable.

- **Why:** Zero friction onboarding. Privacy-first. The original v1 got this right — v2 preserves and deepens it.
- **Extension point:** Optional identity providers (Passkeys, OAuth) can be layered on later without changing the core.

### 9. Observability from Day Zero

Structured logging, metrics, and tracing are built in, not bolted on.

- **Why:** You can't debug what you can't see. Multiplayer state bugs are the worst kind of bug.
- **Implementation:**
  - Structured JSON logging (Bun's native logger)
  - Event log as implicit audit trail
  - Redis MONITOR for debugging (dev only)
  - `/health` and `/metrics` endpoints
  - Game state snapshots for debugging tools

### 10. Modular, Not Monolithic

The plugin architecture from v1 is preserved and strengthened. Adding a new game means adding one directory with an engine, types, and tests — no changes to core infrastructure.

- **Why:** Low barrier to contribution. Clear boundaries enable parallel development.
- **Contract:** The `GameEngine<S, E>` interface is the only contract. Everything else is implementation detail.

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  React + Zustand + WebSocket hooks                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Game UI  │  │ Lobby UI │  │ Chat UI  │  │ Leaderboard  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └──────────────┴────────────┴───────────────┘             │
│                          │                                       │
│                    WebSocket (persistent, binary or JSON)         │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    SERVER (Bun + Hono)                            │
│                          │                                       │
│  ┌───────────────────────┴────────────────────────┐             │
│  │              WebSocket Handler                  │             │
│  │  (upgrade, auth, heartbeat, reconnect)         │             │
│  └───────────────────────┬────────────────────────┘             │
│                          │                                       │
│  ┌───────────────────────┴────────────────────────┐             │
│  │              Game Orchestrator                  │             │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │             │
│  │  │ Room     │  │ Match-   │  │ Game Loop   │  │             │
│  │  │ Manager  │  │ making   │  │ (per-room)  │  │             │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │             │
│  └───────┼─────────────┼───────────────┼─────────┘             │
│          │             │               │                        │
│  ┌───────┴─────────────┴───────────────┴─────────┐             │
│  │              Game Engine Registry              │             │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │             │
│  │  │TicTacToe │ │  Chess   │ │ Avalon/      │  │             │
│  │  │ Engine   │ │  Engine  │ │ Codenames/   │  │             │
│  │  │          │ │          │ │ Werewolf     │  │             │
│  │  └──────────┘ └──────────┘ └──────────────┘  │             │
│  └──────────────────────────────────────────────┘             │
│                          │                                       │
│  ┌───────────────────────┴────────────────────────┐             │
│  │              Hono REST API                      │             │
│  │  /api/games   /api/rooms   /api/leaderboard    │             │
│  └───────────────────────┬────────────────────────┘             │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    DATA LAYER                                    │
│                          │                                       │
│  ┌───────────────────────┴──────────────┐                       │
│  │              Redis                    │                       │
│  │  • Event streams (append-only)       │                       │
│  │  • Pub/Sub (real-time fan-out)       │                       │
│  │  • Room metadata (with TTL)          │                       │
│  │  • Matchmaking queues (sorted sets)  │                       │
│  │  • Rate limiting (sliding window)    │                       │
│  │  • Leaderboard cache (sorted sets)   │                       │
│  └──────────────────────────────────────┘                       │
│                          │                                       │
│  ┌───────────────────────┴──────────────┐                       │
│  │           PostgreSQL                  │                       │
│  │  • Durable event log (append-only)   │                       │
│  │  • Game history & replays            │                       │
│  │  • Leaderboard (persistent)          │                       │
│  │  • Migrations (Drizzle ORM)          │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: A Move in Detail

```
Player clicks a square (Tic-Tac-Toe)
         │
         ▼
Client sends: { type: "MOVE", payload: { cell: 4 } }
         │
         ▼
WebSocket Handler receives, routes to Game Loop
         │
         ▼
Game Loop validates:
  1. Is it this player's turn?
  2. Is the room in 'in_progress' state?
  3. Is the move legal? (game engine validation)
  4. Rate limit check
         │
         ▼ (all valid)
Game Engine processes: applyMove(state, move, playerId)
  → Returns new immutable state
  → Returns events: [{ type: "PIECE_PLACED", cell: 4, player: "X" }]
         │
         ▼
Events appended to Redis Stream + PostgreSQL
         │
         ▼
State projection broadcast to all clients via Redis Pub/Sub
  → Each client receives SANITIZED state (no secret info)
         │
         ▼
Client updates React UI from Zustand store
         │
         ▼
Check game end condition → if winner, update leaderboard
```

### Event Sourcing Model

```
┌──────────────────────────────────────────────────────────┐
│                    EVENT LOG                              │
│                                                          │
│  [E1] GAME_CREATED        { gameType: "tic-tac-toe" }   │
│  [E2] PLAYER_JOINED       { playerId: "abc123" }        │
│  [E3] PLAYER_JOINED       { playerId: "def456" }        │
│  [E4] GAME_STARTED        { players: ["abc", "def"] }   │
│  [E5] PIECE_PLACED        { player: "X", cell: 4 }      │
│  [E6] PIECE_PLACED        { player: "O", cell: 0 }      │
│  [E7] PIECE_PLACED        { player: "X", cell: 2 }      │
│  [E8] PIECE_PLACED        { player: "O", cell: 3 }      │
│  [E9] PIECE_PLACED        { player: "X", cell: 6 }      │
│  [E10] GAME_ENDED         { winner: "X", reason: "..." }│
│                                                          │
│  State at any point = initialState + apply(E1..En)       │
│  State at E7 = initialState + apply(E1..E7)              │
└──────────────────────────────────────────────────────────┘
```

### Project Structure

```
bored-games-v2/
├── packages/
│   └── shared/              # Shared TypeScript types, Zod schemas, utilities
│       ├── src/
│       │   ├── types/       # Core types (GameState, Move, Events, Room)
│       │   ├── schemas/     # Zod validation schemas
│       │   ├── engines/     # Game engines (pure functions)
│       │   │   ├── registry.ts      # Game engine registry
│       │   │   ├── tic-tac-toe/     # Tic-Tac-Toe engine + types + tests
│       │   │   ├── chess/           # Chess engine + types + tests
│       │   │   ├── avalon/          # Avalon engine + types + tests
│       │   │   ├── codenames/       # Codenames engine + types + tests
│       │   │   └── werewolf/        # Werewolf engine + types + tests
│       │   ├── events/      # Event type definitions (discriminated unions)
│       │   └── utils/       # Shared utilities (room codes, session, etc.)
│       └── package.json
│
├── server/                  # Bun HTTP/WS server
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── ws/              # WebSocket handler, game loop per room
│   │   ├── routes/          # Hono REST API routes
│   │   ├── services/        # Room manager, matchmaking, leaderboard
│   │   ├── lib/             # Redis client, DB (Drizzle), config
│   │   └── middleware/      # Auth, rate limiting, logging
│   └── package.json
│
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── stores/          # Zustand stores (game state, UI state)
│   │   ├── hooks/           # WebSocket hooks, game-specific hooks
│   │   └── games/           # Per-game UI components
│   └── package.json
│
├── docker-compose.yml       # Redis + PostgreSQL + optional tools
├── tsconfig.base.json       # Shared TypeScript configuration
├── package.json             # Root workspace config + scripts
├── README.md
└── LICENSE
```

### Key Differences from v1

| Aspect | v1 | v2 |
|--------|----|----|
| **State management** | Mutable state objects | Immutable state + event sourcing |
| **Game engine** | `GameEngine` interface with mutable `applyMove` | Pure function `applyMove(state, event) → newState` |
| **Events** | Ad-hoc Pub/Sub messages | Typed discriminated union event log |
| **Reconnection** | Re-fetch entire state | Replay missed events from event log |
| **Scaling** | Single server (in-memory state) | Redis-backed, multi-instance ready |
| **Validation** | Manual checks in game engines | Zod schemas at boundaries |
| **Determinism** | Engines use `Math.random()` | Seeded PRNG, events for randomness |
| **Testing** | Unit tests on engines | Property-based tests + event replay tests |
| **Observability** | `console.log()` | Structured JSON logging + metrics endpoint |

### Game Engine Interface (v2)

```typescript
interface GameEngine<G extends GameConfig, S extends GameState, E extends GameEvent> {
  /** Unique identifier for this game type */
  readonly gameType: G['gameType'];

  /** Player count constraints */
  readonly playerCount: { min: number; max: number };

  /** Human-readable metadata */
  readonly meta: GameMeta;

  /** Create the initial state from config (no randomness inside) */
  init(config: G): S;

  /**
   * Process a game event and return the new state.
   * Pure function — no side effects, no I/O, no randomness.
   * Returns an error if the event is illegal in the current state.
   */
  reduce(state: S, event: E): Result<S, GameError>;

  /**
   * Get legal events for a player in the current state.
   * Used for move validation and UI hints.
   */
  legalEvents(state: S, playerId: string): E[];

  /**
   * Check if the game has reached a terminal state.
   */
  checkEnd(state: S): GameEnd | null;

  /**
   * Compute a sanitized view of the state for a specific player.
   * Removes secret information (hidden roles, unrevealed cards, etc.).
   */
  view(state: S, playerId: string): S;
}
```

### Data Layer Design

```
Redis responsibilities (hot path, ephemeral):
  ├── Event streams (recent events for active games)
  ├── Pub/Sub channels (real-time fan-out to connected clients)
  ├── Room metadata with TTL (auto-cleanup abandoned rooms)
  ├── Matchmaking queues (sorted sets, scored by wait time + skill)
  ├── Session → Room mapping (which session is in which room)
  └── Rate limiting counters (sliding window)

PostgreSQL responsibilities (cold path, durable):
  ├── Event log (complete, append-only history of all games)
  ├── Game history (for replays, analytics, debugging)
  ├── Leaderboard (persistent, aggregated stats)
  └── Schema managed by Drizzle ORM migrations
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/games` | List all available games |
| `GET` | `/api/games/:type` | Get metadata for a specific game |
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms/:code` | Get room info |
| `POST` | `/api/rooms/:code/join` | Join a room |
| `POST` | `/api/rooms/:code/spectate` | Spectate a room |
| `WS` | `/ws?room=:code&sessionId=:id` | WebSocket for game events |
| `GET` | `/api/leaderboard/:gameType` | Get leaderboard for a game |
| `GET` | `/api/games/:code/replay` | Get event log for replay |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus-compatible metrics |

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# PostgreSQL
DATABASE_URL=postgresql://bored_games:bored_games_dev@localhost:5432/bored_games

# Game config
ROOM_TTL_MINUTES=30
MAX_ROOMS_PER_SERVER=1000
```

### Quick Start (Coming Soon)

```bash
# Prerequisites: Bun 1.1+, Docker

# 1. Clone and install
git clone https://github.com/TaWei/bored-games-v2.git
cd bored-games-v2
bun install

# 2. Start infrastructure
docker compose up -d

# 3. Run migrations
bun run db:migrate

# 4. Start dev servers
bun run dev
```

---

## Status

🚧 **Pre-alpha** — Architecture defined, implementation in progress.

| Game | Status |
|------|--------|
| 🎯 Tic-Tac-Toe | 🚧 Planned |
| ♟️ Chess | 🚧 Planned |
| 🔮 Avalon | 🚧 Planned |
| 🕵️ Codenames | 🚧 Planned |
| 🌙 Werewolf | 🚧 Planned |

---

## License

MIT
