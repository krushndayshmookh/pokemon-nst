import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const socketState = reactive({
  connected: false,
  moveEvents: [],
  userId: 0,
  location: {
    x: 1,
    y: 0,
  },
})

// "undefined" means the URL will be computed from the `window.location` object
const URL = 'http://192.168.136.126:3000'
// const URL = window.location

export const socket = io(URL)

socket.on('connect', () => {
  socketState.connected = true
})

socket.on('disconnect', () => {
  socketState.connected = false
})

// socket.on('move', (evt) => {
//   socketState.moveEvents.push(evt)
//   console.log(evt)
// })

socket.on('join', (evt) => {
  console.log('join', evt)
})

// socket.on('welcome', (evt) => {
//   console.log(evt)
//   socketState.userId = evt.id
//   socketState.location = { x: evt.x, y: evt.y }
// })
