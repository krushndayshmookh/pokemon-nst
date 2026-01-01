# Pokemon NST - AI Coding Assistant Guide

## Project Overview

Real-time multiplayer Pokemon exploration game with procedural world generation, WebSocket-based communication, and JWT authentication. Players navigate an infinite chunk-based world with their Pokemon avatars.

## Architecture

### Monorepo Structure

- **pnpm workspaces** managed from root with parallel dev commands
- **Frontend** (Vue 3 + Vite): Client-side rendering at `localhost:5173` in dev
- **Backend** (Node.js + Express): API server + Socket.IO at `localhost:3000`
- **Production**: Backend serves built frontend from `/frontend/dist`

### Key Data Flows

1. **Authentication**: JWT tokens issued by `/api/auth/login` → stored in Pinia store → sent as Bearer token to REST APIs and via Socket.IO `authenticate` event
2. **World Generation**: Server generates 16×16 tile chunks using Perlin noise (`worldGenerator.js`) → chunks sent to client on demand based on viewport
3. **Real-time Movement**: Client emits `move` events → server validates collision/boundaries → broadcasts `user-moved` to all connected clients
4. **State Management**: Server maintains `connectedUsers` Map (socket ID → user data) for live players; SQLite stores persistent data

### Critical Components

- **[backend/src/game/worldGenerator.js](backend/src/game/worldGenerator.js)**: Procedural generation with `fast-simplex-noise` using fixed seed (12345). Returns chunks as 2D arrays of tile types (GRASS/WATER/WALL/SAND)
- **[backend/server.js](backend/server.js)**: Socket.IO connection handling, chunk streaming (3×3 grid around player), user authentication via `authenticate` event
- **[frontend/src/views/GameView.vue](frontend/src/views/GameView.vue)**: Main game loop with viewport camera (`cameraStyle` computed), chunk rendering, keyboard controls
- **[frontend/src/socket.js](frontend/src/socket.js)**: Socket.IO client with `autoConnect: false` - must manually connect after JWT auth

## Development Workflows

### Starting Development

```bash
# From root - starts both frontend (5173) and backend (3000) concurrently
pnpm dev

# Individual services
pnpm dev:frontend  # Vite dev server
pnpm dev:backend   # nodemon server.js
```

### Database Operations

- **Location**: SQLite file at `backend/pokemon.db` (auto-created)
- **Schema**: Run migrations via `database.connect()` in [backend/src/config/database.js](backend/src/config/database.js)
- **Seeding**: Use `node backend/scripts/seedPokeapi.js` to populate Pokemon data from PokeAPI (handles rate limiting)
- **Direct access**: `sqlite3 backend/pokemon.db` for manual queries

### Production Deployment

```bash
pnpm start  # Builds frontend, then starts backend serving static files
```

Backend serves both API routes and SPA fallback (`/*` → `index.html`)

## Conventions & Patterns

### File Naming

- **Components**: PascalCase with descriptive suffixes (`TileBlock.vue`, `UserBlock.vue`)
- **Services**: camelCase with "Service" suffix ([authService.js](backend/src/services/authService.js), [pokeapiService.js](backend/src/services/pokeapiService.js))
- **Routes**: Grouped by domain ([auth.js](backend/src/routes/auth.js), [pokemon.js](backend/src/routes/pokemon.js))

### State Management

- **Pinia stores** in [frontend/src/stores/](frontend/src/stores/): `auth.js` holds JWT token and user data
- **No global Vuex**: Each store file exports `useXxxStore()` composable
- **Socket state**: Reactive object in [socket.js](frontend/src/socket.js) (`socketState.connected`)

### Coordinate System

- **World space**: Floating-point (x, y) positions stored in `user_positions` table
- **Chunk coordinates**: Integer chunk IDs calculated as `Math.floor(x / CHUNK_SIZE)`, `Math.floor(y / CHUNK_SIZE)`
- **Tile rendering**: Each tile is 64px (`TILE_SIZE`), chunks are 16×16 tiles (1024px)
- **Camera offset**: Applied via `transform: translate(...)` on `.grid` container

### API Patterns

- **REST endpoints**: Prefixed with `/api/` ([health](backend/server.js#L38), [auth](backend/src/routes/auth.js), [pokemon](backend/src/routes/pokemon.js))
- **Protected routes**: Use `authMiddleware` - extracts JWT from `Authorization: Bearer <token>` header
- **Error responses**: `{ error: "message" }` JSON format
- **Frontend service**: Axios client in [services/api.js](frontend/src/services/api.js) with base URL from `VITE_API_URL`

### Socket.IO Events

**Client → Server**:

- `authenticate`: Send `{ userId, username, displayName }` after JWT login
- `move`: Send `{ x, y, direction }` for player movement
- `chat-message`: Send `{ text }` for global chat

**Server → Client**:

- `authenticated`: Returns user data + initial position
- `chunks`: Sends map data as `{ cx_cy: { data: [[tiles]] } }`
- `user-moved`: Broadcasts player position updates
- `chat-message`: Relays chat to all clients

## Environment Configuration

**Backend** (`backend/.env`):

- `PORT=3000`
- `CORS_ORIGIN=*`
- `JWT_SECRET=default_secret_change_me`
- `JWT_EXPIRATION=7d`

**Frontend** (`frontend/.env`):

- `VITE_SOCKET_URL=http://localhost:3000`
- `VITE_API_URL=http://localhost:3000/api`

## Common Gotchas

- **Socket connection**: Must call `socket.connect()` AFTER successful JWT authentication, not on import
- **Chunk key format**: Always use `"${cx},${cy}"` string format (e.g., `"0,0"`) for chunk Map keys
- **Collision detection**: Server-side validation in [worldGenerator.js](backend/src/game/worldGenerator.js) - client requests are authoritative but validated
- **CORS**: Backend allows all origins in dev (`CORS_ORIGIN=*`); restrict in production
- **pnpm filter**: Use `--filter "./backend"` syntax for workspace commands
- **Database schema**: Auto-applied via `database.connect()` - migrations in [migrations/](backend/migrations/) directory

## Testing & Debugging

- **Frontend**: Vue DevTools plugin auto-enabled via [vite.config.js](frontend/vite.config.js)
- **Backend logs**: `console.log` for Socket.IO events (connection, authentication, movement)
- **No test framework**: Manual testing via multiplayer sessions (open multiple browser tabs)

## Planned Features & Roadmap

### Near-Term Features (MVP Completion)

**Interaction System** - Proximity-based player interactions

- Detect players within 2-3 tiles
- "Say Hello" / "Talk" actions with notification system
- Interaction history stored in `interactions` table
- Socket events: `interact`, `interaction-received`, `interaction-response`

**Mouse Controls** - Click-to-move and enhanced UI

- Click-to-move with A* pathfinding (using `pathfinding` library)
- Click player to open interaction menu
- Hover tooltips showing player names
- Keyboard shortcuts: Space/Enter to interact, Tab to cycle nearby players

**Camera System Improvements** - better viewport management

- Smooth camera following player
- Viewport-based player loading (only load visible players)
- Position persistence in `user_positions` table

### Mid-Term Enhancements

#### Pokemon System

- Evolution based on level/experience (data in `evolutions` table)
- Active Pokemon switching from `user_pokemon` collection
- Pokemon stats and types from PokeAPI data

#### Team Formation

- Multiple Pokemon per user (`user_pokemon.is_active` flag)
- Party management UI
- Team-based interactions

#### Battle System

- Turn-based combat mechanics
- Type effectiveness calculations
- Experience and leveling system

### Long-Term Vision

- **Trading**: Socket.IO-based Pokemon trading between players
- **Catch System**: Wild Pokemon encounters in procedural world
- **Items & Inventory**: Potions, Pokeballs, berries (new tables required)
- **Quest System**: Missions and objectives
- **Environmental Features**: Day/night cycle, weather effects
- **Mobile App**: React Native port for iOS/Android

### Technical Debt & Optimization

- Replace Canvas API rendering with WebGL for better performance
- Implement spatial partitioning for efficient player queries
- Add sprite atlases to reduce draw calls
- Use IndexedDB for client-side caching
- Add comprehensive test framework (currently manual only)
- Implement rate limiting on auth endpoints
- Add security headers (CORS, CSP)
