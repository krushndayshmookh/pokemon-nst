import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const socketState = reactive({
  connected: false,
  userId: null,
})

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const socket = io(URL, {
  autoConnect: false
})

socket.on('connect', () => {
  socketState.connected = true
})

socket.on('disconnect', () => {
  socketState.connected = false
})
