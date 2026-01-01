# Pokemon NST - Development Plan

## 🎯 Project Vision

A multiplayer Pokemon exploration game with authentication, procedural world generation, and real-time interactions.

---

## 📋 Core Features (MVP)

### Authentication & User Management

- Simple username/password authentication
- JWT-based session management
- SQLite database for user storage
- Display name + baby Pokemon selection on registration

### Gameplay

- Infinite procedurally generated map
- Real-time multiplayer movement
- Proximity-based interactions
- "Talk/Hello" interaction system
- Full keyboard + mouse controls

### Future Features

- Pokemon evolution
- Team formation
- Additional Pokemon collection
- Battle system
- Trading
- Items & inventory

---

## 🏗️ Technical Architecture

### Backend Stack

- Node.js + Express
- Socket.IO (real-time communication)
- SQLite3 (database)
- jsonwebtoken (JWT authentication)
- bcrypt (password hashing)

### Frontend Stack

- Vue 3 (Composition API)
- Vite
- Socket.IO Client
- Canvas API (for rendering)
- Pinia (state management)

### Database Schema

```sql
-- Pokemon data (from PokeAPI)
CREATE TABLE pokemon (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sprite_url TEXT,
  sprite_front TEXT,
  sprite_back TEXT,
  height INTEGER,
  weight INTEGER,
  base_experience INTEGER,
  is_baby BOOLEAN DEFAULT 0,
  is_starter BOOLEAN DEFAULT 0,
  pokeapi_data TEXT -- JSON blob for full data
);

-- Pokemon types
CREATE TABLE pokemon_types (
  pokemon_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  slot INTEGER NOT NULL,
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Pokemon stats
CREATE TABLE pokemon_stats (
  pokemon_id INTEGER NOT NULL,
  stat_name TEXT NOT NULL,
  base_stat INTEGER NOT NULL,
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Evolution chains
CREATE TABLE evolutions (
  pokemon_id INTEGER NOT NULL,
  evolves_to_id INTEGER,
  min_level INTEGER,
  trigger TEXT,
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id)
);

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  starter_pokemon_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (starter_pokemon_id) REFERENCES pokemon(id)
);

-- User positions table
CREATE TABLE user_positions (
  user_id INTEGER PRIMARY KEY,
  x REAL NOT NULL,
  y REAL NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User's Pokemon collection
CREATE TABLE user_pokemon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pokemon_id INTEGER NOT NULL,
  nickname TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 0,
  caught_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Interactions table (for chat history)
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  interaction_type TEXT NOT NULL, -- 'hello', 'talk', etc.
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);
```

---

## 📝 Implementation Phases

### **Phase 1: Authentication & Database Setup** (Days 1-2)

**Backend:**

- Install dependencies: `sqlite3`, `jsonwebtoken`, `bcrypt`, `axios`
- Set up SQLite database with schema
- Create PokeAPI data fetcher service
- Fetch and store Pokemon data (all Pokemon, sprites, stats, types, evolutions)
- Mark baby/starter Pokemon in database
- Create authentication middleware
- API endpoints:
  - `POST /api/auth/register` - Create new user
  - `POST /api/auth/login` - Login user, return JWT
  - `GET /api/auth/me` - Get current user info (protected)
  - `GET /api/pokemon/starters` - Get baby Pokemon options
  - `GET /api/pokemon/:id` - Get Pokemon details

**Database:**

- Initialize SQLite database
- Fetch all Pokemon data from PokeAPI (<https://pokeapi.co/api/v2/>)
- Store Pokemon, types, stats, evolution chains
- Seed starter Pokemon flags (Bulbasaur, Charmander, Squirtle, Pikachu, etc.)

**PokeAPI Integration:**

- Fetch from `/pokemon?limit=1000` for all Pokemon
- Fetch from `/pokemon/{id}` for individual details
- Fetch from `/evolution-chain/{id}` for evolution data
- Cache sprites locally or store URLs
- Handle rate limiting (100 requests/minute)

**Tasks:**

- [ ] Install backend dependencies (including axios)
- [ ] Create database schema and migrations
- [ ] Build PokeAPI fetcher service
- [ ] Fetch and store all Pokemon data (~1000 Pokemon)
- [ ] Mark baby/starter Pokemon (is_baby, is_starter flags)
- [ ] Implement password hashing
- [ ] Create JWT auth middleware
- [ ] Build registration endpoint
- [ ] Build login endpoint
- [ ] Create Pokemon endpoints

---

### **Phase 2: Start Screen & Login/Register UI** (Days 3-4)

**Frontend:**

- Create login/register views
- Baby Pokemon selection interface
- Form validation
- JWT storage in localStorage
- Protected route guards

**Components:**

- `LoginView.vue` - Login form
- `RegisterView.vue` - Registration form
- `StarterPicker.vue` - Baby Pokemon selection grid
- `AuthLayout.vue` - Wrapper for auth pages

**Tasks:**

- [ ] Create login form with validation
- [ ] Create register form with validation
- [ ] Build Pokemon picker component
- [ ] Implement JWT storage/retrieval
- [ ] Add route guards for protected routes
- [ ] Connect forms to backend APIs
- [ ] Add loading states and error handling

---

### **Phase 3: Procedural Map Generation** (Days 5-7)

**Algorithm:**

- Use Perlin/Simplex noise for terrain generation
- Chunk-based loading (render only visible chunks)
- Tile types: grass, water, dirt, trees, rocks
- Generate chunks on-demand as player moves

**Backend:**

- Seed-based generation (consistent world for all players)
- Store world seed in database
- API endpoint: `GET /api/world/chunk/:x/:y`

**Frontend:**

- Canvas rendering system
- Tile atlas/sprite system
- Chunk manager (load/unload chunks)
- Viewport rendering (only draw visible tiles)

**Tasks:**

- [ ] Install noise generation library
- [ ] Implement chunk generation algorithm
- [ ] Create tile rendering system
- [ ] Build chunk manager
- [ ] Implement viewport culling
- [ ] Add minimap (optional)

---

### **Phase 4: Enhanced Movement & Camera** (Days 8-9)

**Features:**

- Camera follows player
- Smooth scrolling
- Infinite world boundaries
- Collision detection with terrain
- Position persistence in database

**Socket Events:**

- `move` - Player movement
- `player-joined` - New player enters viewport
- `player-left` - Player leaves viewport
- `players-nearby` - Get nearby players on connect

**Tasks:**

- [ ] Implement camera system
- [ ] Add viewport-based player loading
- [ ] Update movement to use world coordinates
- [ ] Add collision detection with terrain
- [ ] Persist player position to database
- [ ] Optimize socket events (only send visible players)

---

### **Phase 5: Interaction System** (Days 10-12)

**Features:**

- Proximity detection (players within 2-3 tiles)
- Interaction prompt when near another player
- "Say Hello" / "Talk" actions
- Notification system for received interactions
- Interaction history
- Response system (Accept/Ignore)

**Socket Events:**

- `interact` - Send interaction to nearby player
- `interaction-received` - Receive interaction notification
- `interaction-response` - Respond to interaction

**UI Components:**

- Interaction prompt overlay
- Notification badges
- Chat bubble above player
- Interaction history panel (optional)

**Tasks:**

- [ ] Implement proximity detection
- [ ] Create interaction UI components
- [ ] Build notification system
- [ ] Add chat bubbles above players
- [ ] Store interactions in database
- [ ] Add response mechanism
- [ ] Create interaction log view

---

### **Phase 6: Mouse Controls & Polish** (Days 13-14)

**Features:**

- Click-to-move pathfinding
- Click on player to interact
- Hover states and tooltips
- UI improvements
- Performance optimization
- Bug fixes

**Controls:**

- **Keyboard:**
  - Arrow keys / WASD - Move
  - Space / Enter - Interact with nearby player
  - Escape - Close menus
  - Tab - Cycle through nearby players
  
- **Mouse:**
  - Click terrain - Move to position
  - Click player - Open interaction menu
  - Drag - Pan camera (optional)

**Tasks:**

- [ ] Implement click-to-move with A* pathfinding
- [ ] Add player click interactions
- [ ] Create hover tooltips
- [ ] Add keyboard shortcuts
- [ ] Performance profiling and optimization
- [ ] Cross-browser testing
- [ ] Mobile responsiveness (optional)

---

## 🎮 Controls Reference

### Keyboard

- **Arrow Keys / WASD** - Move character
- **Space / Enter** - Interact with nearby player
- **Escape** - Close dialogs
- **Tab** - Cycle through nearby players
- **M** - Toggle map (future)
- **I** - Inventory (future)

### Mouse

- **Click terrain** - Move to location
- **Click player** - Open interaction menu
- **Scroll wheel** - Zoom in/out (future)
- **Drag** - Pan camera (future)

---

## 📦 New Dependencies to Install

### Backend

```bash
cd backend
npm install sqlite3 jsonwebtoken bcrypt dotenv axios
```

### Frontend

```bash
cd frontend
pnpm add fast-simplex-noise pathfinding
```

---

## 🗂️ Proposed File Structure

```txt
pokemon-nst/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Pokemon.js
│   │   │   └── Interaction.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── world.js
│   │   │   ├── pokemon.js
│   │   │   └── user.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── pokeapiService.js
│   │   │   └── worldGenerator.js
│   │   └── socket/
│   │       └── gameSocket.js
│   ├── scripts/
│   │   └── seedPokeapi.js
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── database.sqlite
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   └── GameView.vue
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── StarterPicker.vue
│   │   │   ├── game/
│   │   │   │   ├── GameCanvas.vue
│   │   │   │   ├── PlayerSprite.vue
│   │   │   │   ├── InteractionPrompt.vue
│   │   │   │   └── ChatBubble.vue
│   │   │   └── ui/
│   │   │       ├── Notification.vue
│   │   │       └── MiniMap.vue
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── worldGenerator.js
│   │   │   └── pathfinding.js
│   │   ├── stores/
│   │   │   ├── auth.js
│   │   │   ├── game.js
│   │   │   └── interactions.js
│   │   └── utils/
│   │       ├── camera.js
│   │       └── collision.js
│   └── router/
│       └── index.js
```

---

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   cd backend && npm install sqlite3 jsonwebtoken bcrypt dotenv axios
   cd ../frontend && pnpm add fast-simplex-noise pathfinding
   ```

2. **Set up environment variables:**

   ```bash
   # backend/.env
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRATION=7d
   PORT=3000
   POKEAPI_BASE_URL=https://pokeapi.co/api/v2
   ```

3. **Fetch and seed Pokemon data:**

   ```bash
   cd backend
   node scripts/seedPokeapi.js
   ```

4. **Start development:**

   ```bash
   pnpm dev
   ```

---

## 🎯 Success Metrics

- [ ] User can register and login
- [ ] User can select baby Pokemon (from PokeAPI data)
- [ ] User can see procedurally generated world
- [ ] User can move around smoothly
- [ ] User can see other players in real-time
- [ ] User sees actual Pokemon sprites from PokeAPI
- [ ] User can interact with nearby players
- [ ] User receives notifications for interactions
- [ ] Game works with keyboard and mouse
- [ ] No major performance issues (60 FPS)

---

## 🔮 Future Enhancements

### Phase 7+

- Pokemon evolution system
- Battle system (turn-based)
- Team formation (multiplayer parties)
- Catch additional Pokemon
- Trading system
- Items & inventory
- Quests/missions
- Day/night cycle
- Weather effects
- Sound effects & music
- Mobile app (React Native)

---

## ⚡ Performance Considerations

- Use Canvas for rendering (better than DOM for many sprites)
- Implement spatial partitioning for player queries
- Use WebSocket compression
- Lazy load chunks outside viewport
- Debounce position updates (100ms)
- Use sprite atlases to reduce draw calls
- Implement object pooling for entities
- Use IndexedDB for client-side caching (future)

---

## 🔒 Security Considerations

- Hash passwords with bcrypt (salt rounds: 12)
- Use secure JWT secrets (min 32 characters)
- Implement rate limiting on auth endpoints
- Validate all user inputs
- Sanitize chat messages
- Use prepared statements for SQL queries
- Implement CORS properly
- Add CSP headers
- Log suspicious activities
- Implement session timeout

---

## 📚 Resources & Libraries

- **PokeAPI:** <https://pokeapi.co> - Official Pokemon API
- **Noise Generation:** `fast-simplex-noise`
- **Pathfinding:** `pathfinding` (A* algorithm)
- **JWT:** `jsonwebtoken`
- **Password Hashing:** `bcrypt`
- **Database:** `sqlite3`
- **HTTP Client:** `axios`
- **Canvas Rendering:** Native Canvas API
- **State Management:** Pinia

### PokeAPI Endpoints Used

- `/pokemon?limit=1000` - List all Pokemon
- `/pokemon/{id}` - Get Pokemon details
- `/pokemon-species/{id}` - Get species info (baby status)
- `/evolution-chain/{id}` - Get evolution data
- `/type/{id}` - Get type information

---

Ready to start implementation! 🚀
