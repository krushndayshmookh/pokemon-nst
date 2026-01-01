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
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
npm install
```

3. Configure environment variables:

**Backend** (`backend/.env`):
```env
PORT=3000
CORS_ORIGIN=*
```

**Frontend** (`frontend/.env`):
```env
VITE_SOCKET_URL=http://localhost:3000
```

### Development

Run both servers:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).
The backend runs on `http://localhost:3000`.

### Production Build

```bash
# Build frontend
cd frontend
pnpm build

# Start backend (serves built frontend)
cd ../backend
npm start
```

The production app will be served at `http://localhost:3000`.

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
