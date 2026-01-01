require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('node:path')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const database = require('./src/config/database')
const gameMap = require('./src/game/map')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
database.connect().catch(err => {
  console.error('Failed to connect to database:', err)
  process.exit(1)
})

// API Routes
const authRoutes = require('./src/routes/auth')
const pokemonRoutes = require('./src/routes/pokemon')

app.use('/api/auth', authRoutes)
app.use('/api/pokemon', pokemonRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static files from frontend dist
const frontendDist = path.join(__dirname, '../frontend/dist')
app.use(express.static(frontendDist))

// SPA Fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

const PORT = process.env.PORT || 3000
const connectedUsers = new Map() // Map<socketId, userData>

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on('authenticate', async (data) => {
    try {
      const { userId, username, displayName } = data
      
      // Get user's active Pokemon and position
      const user = await database.get(
        `SELECT u.id, u.username, u.display_name,
                up.x, up.y,
                upk.pokemon_id
         FROM users u
         LEFT JOIN user_positions up ON u.id = up.user_id
         LEFT JOIN user_pokemon upk ON u.id = upk.user_id AND upk.is_active = 1
         WHERE u.id = ?`,
        [userId]
      )

      if (!user) {
        socket.emit('auth-error', { error: 'User not found' })
        return
      }

      const userData = {
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        socketId: socket.id,
        x: user.x || 0,
        y: user.y || 0,
        pokemonId: user.pokemon_id
      }

      connectedUsers.set(socket.id, userData)
      console.log(`User authenticated: ${userData.displayName} (${connectedUsers.size} online)`)

      // Send welcome with user data
      socket.emit('authenticated', userData)
      
      // Send map data
      socket.emit('map-data', {
        map: gameMap.map,
        width: gameMap.WIDTH,
        height: gameMap.HEIGHT
      })

      // Send existing nearby players
      const nearbyUsers = Array.from(connectedUsers.values()).filter(u => u.socketId !== socket.id)
      socket.emit('existing-users', nearbyUsers)

      // Broadcast new user to others
      socket.broadcast.emit('user-joined', userData)
    } catch (error) {
      console.error('Auth error:', error)
      socket.emit('auth-error', { error: 'Authentication failed' })
    }
  })

  socket.on('move', async (data) => {
    const user = connectedUsers.get(socket.id)
    
    if (!user) {
      return
    }

    // Validate movement
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      return
    }

    // Check collision
    if (!gameMap.isWalkable(data.x, data.y)) {
      // Reset user position to last known valid position
      socket.emit('user-moved', {
        userId: user.userId,
        x: user.x,
        y: user.y
      })
      return
    }

    // Update user position
    user.x = data.x
    user.y = data.y
    if (data.direction) {
      user.direction = data.direction
    }

    // Save to database (debounced in production)
    try {
      await database.run(
        "UPDATE user_positions SET x = ?, y = ?, updated_at = datetime('now') WHERE user_id = ?",
        [data.x, data.y, user.userId]
      )
    } catch (error) {
      console.error('Failed to save position:', error)
    }

    // Broadcast to others
    socket.broadcast.emit('user-moved', {
      userId: user.userId,
      x: data.x,
      y: data.y,
      direction: user.direction
    })
  })

  socket.on('chat-message', (message) => {
    const user = connectedUsers.get(socket.id)
    if (user && message && typeof message === 'string') {
      // Broadcast to all clients including sender
      io.emit('chat-message', {
        userId: user.userId,
        displayName: user.displayName,
        text: message.substring(0, 200), // Limit length
        timestamp: new Date().toISOString()
      })
    }
  })

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    
    if (user) {
      connectedUsers.delete(socket.id)
      console.log(`User disconnected: ${user.displayName} (${connectedUsers.size} remaining)`)
      
      socket.broadcast.emit('user-left', { userId: user.userId })
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
  console.log(`📡 Socket.IO ready`)
  console.log(`🗄️  Database: ${database.db ? 'Connected' : 'Not connected'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  await database.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
