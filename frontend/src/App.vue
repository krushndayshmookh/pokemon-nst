<template>
  <div
    id="playground"
    :style="`
      width: calc(64px * ${blockCountX});
      height: calc(64px * ${blockCountY});
    `"
  >
    <UserBlock
      v-for="user in users"
      :key="user.id"
      :loc="user.loc"
      :user-id="user.id"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import UserBlock from './components/UserBlock.vue'
import { socket, socketState } from '@/socket'

const BLOCK_SIZE = 64

const blockCountX = ref(0)
const blockCountY = ref(0)
const users = ref([])
const currentUserId = ref(null)

const calculateGridSize = () => {
  blockCountX.value = Math.floor(window.innerWidth / BLOCK_SIZE)
  blockCountY.value = Math.floor(window.innerHeight / BLOCK_SIZE)
}

const isValidPosition = (x, y) => {
  return x >= 1 && x <= blockCountX.value && y >= 1 && y <= blockCountY.value
}

const isPositionOccupied = (x, y, excludeUserId = null) => {
  return users.value.some(user =>
    user.id !== excludeUserId && user.loc.x === x && user.loc.y === y
  )
}

const moveUser = (direction) => {
  const userIdx = users.value.findIndex(u => u.id === currentUserId.value)
  if (userIdx === -1) return

  const user = users.value[userIdx]
  const newLoc = { x: user.loc.x, y: user.loc.y }

  switch (direction) {
    case 'left':
      newLoc.x -= 1
      break
    case 'right':
      newLoc.x += 1
      break
    case 'down':
      newLoc.y += 1
      break
    case 'up':
      newLoc.y -= 1
      break
  }

  // Validate position
  if (!isValidPosition(newLoc.x, newLoc.y)) {
    console.log('Out of bounds')
    return
  }

  if (isPositionOccupied(newLoc.x, newLoc.y, currentUserId.value)) {
    console.log('Position occupied')
    return
  }

  // Update local state and emit to server
  users.value[userIdx].loc = newLoc
  socket.emit('move', newLoc)
}

onMounted(() => {
  calculateGridSize()
  window.addEventListener('resize', calculateGridSize)

  if (!socketState.connected) {
    socket.connect()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateGridSize)
})

// Socket event handlers
socket.on('welcome', (userData) => {
  currentUserId.value = userData.id
  console.log('Welcome! Your ID:', userData.id)
})

socket.on('existing-users', (existingUsers) => {
  // Add all existing users except ourselves
  existingUsers.forEach(user => {
    if (user.id !== currentUserId.value && !users.value.some(u => u.id === user.id)) {
      users.value.push({
        id: user.id,
        loc: { x: user.x, y: user.y }
      })
    }
  })
})

socket.on('join', (userData) => {
  // Add new user if not already in list
  if (!users.value.some(u => u.id === userData.id)) {
    users.value.push({
      id: userData.id,
      loc: { x: userData.x, y: userData.y }
    })
    console.log('User joined:', userData.id)
  }
})

socket.on('move', (data) => {
  const userIdx = users.value.findIndex(u => u.id === data.id)

  if (userIdx !== -1) {
    users.value[userIdx].loc = { x: data.x, y: data.y }
  } else {
    // User not found, add them
    users.value.push({
      id: data.id,
      loc: { x: data.x, y: data.y }
    })
  }
})

socket.on('user-left', (data) => {
  const userIdx = users.value.findIndex(u => u.id === data.id)
  if (userIdx !== -1) {
    users.value.splice(userIdx, 1)
    console.log('User left:', data.id)
  }
})

// Keyboard controls
onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
  moveUser('down')
})

onKeyStroke('ArrowUp', (e) => {
  e.preventDefault()
  moveUser('up')
})

onKeyStroke('ArrowLeft', (e) => {
  e.preventDefault()
  moveUser('left')
})

onKeyStroke('ArrowRight', (e) => {
  e.preventDefault()
  moveUser('right')
})
</script>

<style scoped>
#playground {
  display: block;
  position: absolute;
  background-color: #e0f7fa;
  border: 1px solid #333;
}
</style>
