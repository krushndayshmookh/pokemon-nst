const express = require('express')
const cors = require('cors')
const path = require('node:path')
const { createServer } = require('node:http')
const { Server } = require('socket.io')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
})

app.use(cors())

// Serve static files from frontend dist
const frontendDist = path.join(__dirname, '../frontend/dist')
app.use(express.static(frontendDist))

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

const PORT = process.env.PORT || 3000
const MAX_POKEMON_ID = 441

let nextUserId = 0
const connectedUsers = new Map() // Map<socketId, userData>

io.on('connection', (socket) => {
  const userId = nextUserId++
  const userData = { 
    id: userId, 
    x: 1, 
    y: 1,
    socketId: socket.id 
  }
  
  connectedUsers.set(socket.id, userData)
  console.log(`User ${userId} connected (${connectedUsers.size} total users)`)

  // Send current user their info
  socket.emit('welcome', userData)
  
  // Broadcast new user to all clients
  io.emit('join', userData)
  
  // Send all existing users to the new user
  const existingUsers = Array.from(connectedUsers.values())
  socket.emit('existing-users', existingUsers)

  socket.on('move', (evt) => {
    const user = connectedUsers.get(socket.id)
    
    if (!user) {
      console.error('Move event from unknown user')
      return
    }

    // Validate movement
    if (typeof evt.x !== 'number' || typeof evt.y !== 'number') {
      console.error('Invalid move data')
      return
    }

    // Update user position
    user.x = evt.x
    user.y = evt.y
    
    // Broadcast to all clients
    io.emit('move', { id: user.id, x: evt.x, y: evt.y })
  })

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    
    if (user) {
      connectedUsers.delete(socket.id)
      console.log(`User ${user.id} disconnected (${connectedUsers.size} remaining)`)
      
      // Notify all clients that user left
      io.emit('user-left', { id: user.id })
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}...`)
})
