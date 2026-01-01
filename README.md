# Pokemon NST - Multiplayer Grid Game

A real-time multiplayer grid-based game where users move Pokemon avatars on a shared playground using WebSocket communication.

## Features

- Real-time multiplayer gameplay with WebSocket (Socket.IO)
- 441 Pokemon avatars to choose from (assigned automatically)
- Arrow key movement controls
- Collision detection (players can't overlap)
- Boundary validation
- Responsive grid layout
- Smooth movement animations

## Tech Stack

### Frontend
- Vue 3 (Composition API)
- Vite
- Pinia
- Socket.IO Client
- VueUse
- SCSS

### Backend
- Node.js
- Express
- Socket.IO

## Project Setup

### Prerequisites
- Node.js >= 20.19.0 or >= 22.12.0
- pnpm >= 8.0.0

### Installation

This is a monorepo setup using pnpm workspaces. Install all dependencies from the root:

```bash
# Install all dependencies (root + workspaces)
pnpm install
```

### Configuration

**Backend** (`backend/.env`):
```env
PORT=3000
CORS_ORIGIN=*
```

**Frontend** (`frontend/.env`):
```env
VITE_SOCKET_URL=http://localhost:3000
```

Copy the `.env.example` files and configure as needed.

### Development

Run both frontend and backend in development mode:

```bash
# From root directory - runs both servers concurrently
pnpm dev
```

This will start:
- Frontend dev server at `http://localhost:5173` (Vite)
- Backend server at `http://localhost:3000`

Or run them separately:

```bash
# Terminal 1 - Backend
pnpm dev:backend

# Terminal 2 - Frontend
pnpm dev:frontend
```

### Production Build & Start

Build the frontend and start the backend server (which serves the built frontend):

```bash
# From root directory
pnpm start
```

This will:
1. Build the frontend (`npm run build`)
2. Start the backend server at `http://localhost:3000`
3. The backend serves the built frontend from `/frontend/dist`

The complete production app will be available at `http://localhost:3000`.

## How to Play

1. Open the app in your browser
2. You'll be automatically assigned a Pokemon avatar
3. Use arrow keys to move:
   - ↑ Move Up
   - ↓ Move Down
   - ← Move Left
   - → Move Right
4. You cannot move into occupied spaces or outside the grid boundaries
5. Open multiple browser windows to see real-time multiplayer in action!

## Project Structure

```
pokemon-nst/
├── backend/
│   ├── server.js          # Express + Socket.IO server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.vue        # Main game component
│   │   ├── main.js        # Vue app entry
│   │   ├── socket.js      # Socket.IO client setup
│   │   └── components/
│   │       └── UserBlock.vue  # Player avatar component
│   ├── public/
│   │   └── images/
│   │       └── pokemon/   # 441 Pokemon sprites
│   └── package.json
└── README.md
```

## License

This project is private and for educational purposes.
