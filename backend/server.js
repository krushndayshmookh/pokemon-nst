const express = require('express')
const cors = require('cors')
const { createServer } = require('node:http')
const { Server } = require('socket.io')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded())

app.post('/move', (req, res) => {
  // console.log(req.body)
})

let count = 0
const connectedUsers = []

io.on('connection', (socket) => {
  console.log('a user connected')

  const newUser = { id: count++, x: 1, y: 1 }
  socket.emit('welcome', newUser)
  io.emit('join', newUser)
  connectedUsers.push(newUser)

  socket.on('move', (evt) => {
    console.log(evt)

    io.emit('move', evt)
  })
})

app.use(express.static('../frontend/dist'))

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000...')
})
