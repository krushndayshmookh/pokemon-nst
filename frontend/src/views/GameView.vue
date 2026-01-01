<template>
  <div class="game-container">
    <div class="game-header">
      <div class="user-info">
        <span>Playing as: <strong>{{ authStore.user?.displayName }}</strong></span>
      </div>
      <button @click="handleLogout" class="btn-logout">Logout</button>
    </div>

    <div class="game-layout">
      <div class="viewport">
        <div class="grid" :style="{ width: `${GRID_WIDTH * TILE_SIZE}px`, height: `${GRID_HEIGHT * TILE_SIZE}px`, ...cameraStyle }">
          <!-- Render Grid Tiles -->
          <template v-if="mapData.length > 0">
            <div v-for="(row, y) in mapData" :key="y" class="row">
              <div v-for="(tileType, x) in row" :key="`${x}-${y}`" class="tile-wrapper">
                <TileBlock :type="tileType" />
              </div>
            </div>
          </template>
          <div v-else class="loading-map">Loading map...</div>

          <!-- Render Other Users -->
          <UserBlock
            v-for="user in otherUsers"
            :key="user.userId"
            :loc="{ x: user.x, y: user.y }"
            :pokemon-id="user.pokemonId"
            :display-name="user.displayName"
            :direction="user.direction"
          />

          <!-- Render Current User -->
          <UserBlock
            v-if="currentUser"
            :loc="{ x: currentUser.x, y: currentUser.y }"
            :pokemon-id="currentUser.pokemonId"
            :display-name="currentUser.displayName"
            :direction="currentUser.direction"
            class="current-user"
          />
        </div>
      </div>

      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(msg, index) in messages" :key="index" class="chat-message">
            <span class="chat-user">{{ msg.displayName }}:</span>
            <span class="chat-text">{{ msg.text }}</span>
          </div>
        </div>
        <form @submit.prevent="sendMessage" class="chat-input-form">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            maxlength="200"
            @keydown.stop
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>

    <div class="controls-hint">
      Use Arrow Keys or WASD to move
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { socket } from '@/socket'
import TileBlock from '@/components/TileBlock.vue'
import UserBlock from '@/components/UserBlock.vue'

const router = useRouter()
const authStore = useAuthStore()

// Constants
const TILE_SIZE = 64
const GRID_WIDTH = ref(20)
const GRID_HEIGHT = ref(15)
const VIEWPORT_WIDTH = 640
const VIEWPORT_HEIGHT = 480

// State
const currentUser = ref(null)
const usersMap = ref(new Map())
const messages = ref([])
const newMessage = ref('')
const chatMessagesRef = ref(null)
const mapData = ref([])

const cameraStyle = computed(() => {
  if (!currentUser.value) return {}

  // Calculate center position
  const centerX = VIEWPORT_WIDTH / 2 - TILE_SIZE / 2
  const centerY = VIEWPORT_HEIGHT / 2 - TILE_SIZE / 2

  // Calculate desired camera position (negative because we move the grid)
  let camX = -(currentUser.value.x * TILE_SIZE) + centerX
  let camY = -(currentUser.value.y * TILE_SIZE) + centerY

  // Clamp camera to map bounds
  const minX = -(GRID_WIDTH.value * TILE_SIZE) + VIEWPORT_WIDTH
  const minY = -(GRID_HEIGHT.value * TILE_SIZE) + VIEWPORT_HEIGHT

  camX = Math.min(0, Math.max(minX, camX))
  camY = Math.min(0, Math.max(minY, camY))

  return {
    transform: `translate(${camX}px, ${camY}px)`
  }
})

const otherUsers = computed(() => {
  return Array.from(usersMap.value.values())
})

// Socket Event Handlers
function onConnect() {
  console.log('Socket connected, authenticating...')
  socket.emit('authenticate', {
    userId: authStore.user.id,
    username: authStore.user.username,
    displayName: authStore.user.displayName
  })
}

function onMapData(data) {
  console.log('Map data received:', data)
  mapData.value = data.map
  GRID_WIDTH.value = data.width
  GRID_HEIGHT.value = data.height
}

function onAuthenticated(userData) {
  console.log('Authenticated:', userData)
  currentUser.value = userData
}

function onExistingUsers(users) {
  users.forEach(user => {
    usersMap.value.set(user.userId, user)
  })
}

function onUserJoined(user) {
  console.log('User joined:', user)
  usersMap.value.set(user.userId, user)
}

function onUserMoved(data) {
  const user = usersMap.value.get(data.userId)
  if (user) {
    user.x = data.x
    user.y = data.y
    if (data.direction) {
      user.direction = data.direction
    }
  }
}

function onUserLeft(data) {
  console.log('User left:', data)
  usersMap.value.delete(data.userId)
}

function onChatMessage(data) {
  messages.value.push(data)
  // Keep only last 50 messages
  if (messages.value.length > 50) {
    messages.value.shift()
  }

  // Scroll to bottom
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

function onAuthError(error) {
  console.error('Auth error:', error)
  // Maybe redirect to login or show error
}

// Chat Logic
function sendMessage() {
  if (!newMessage.value.trim()) return

  socket.emit('chat-message', newMessage.value)
  newMessage.value = ''
}

// Movement Logic
function move(dx, dy) {
  if (!currentUser.value) return

  const newX = currentUser.value.x + dx
  const newY = currentUser.value.y + dy

  // Boundary checks
  if (newX < 0 || newX >= GRID_WIDTH.value || newY < 0 || newY >= GRID_HEIGHT.value) {
    return
  }

  // Collision check
  if (mapData.value.length > 0) {
    const tile = mapData.value[newY][newX]
    // 0 = Grass, 3 = Sand. Others are blocked.
    if (tile !== 0 && tile !== 3) {
      return
    }
  }

  // Update local state immediately
  currentUser.value.x = newX
  currentUser.value.y = newY

  // Update direction
  if (dx > 0) currentUser.value.direction = 'right'
  if (dx < 0) currentUser.value.direction = 'left'

  // Emit to server
  socket.emit('move', { x: newX, y: newY, direction: currentUser.value.direction })
}

function handleKeydown(e) {
  // Prevent default scrolling for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault()
  }

  // Don't move if typing in input (handled by @keydown.stop on input, but good safety)
  if (e.target.tagName === 'INPUT') return

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      move(0, -1)
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      move(0, 1)
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      move(-1, 0)
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      move(1, 0)
      break
  }
}

function handleLogout() {
  socket.disconnect()
  authStore.logout()
  router.push('/login')
}

// Lifecycle
onMounted(() => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // Setup socket listeners
  socket.on('connect', onConnect)
  socket.on('authenticated', onAuthenticated)
  socket.on('map-data', onMapData)
  socket.on('existing-users', onExistingUsers)
  socket.on('user-joined', onUserJoined)
  socket.on('user-moved', onUserMoved)
  socket.on('user-left', onUserLeft)
  socket.on('chat-message', onChatMessage)
  socket.on('auth-error', onAuthError)

  // Connect if not already connected
  if (!socket.connected) {
    socket.connect()
  } else {
    onConnect()
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // Cleanup listeners
  socket.off('connect', onConnect)
  socket.off('authenticated', onAuthenticated)
  socket.off('map-data', onMapData)
  socket.off('existing-users', onExistingUsers)
  socket.off('user-joined', onUserJoined)
  socket.off('user-moved', onUserMoved)
  socket.off('user-left', onUserLeft)
  socket.off('chat-message', onChatMessage)
  socket.off('auth-error', onAuthError)

  window.removeEventListener('keydown', handleKeydown)
  socket.disconnect()
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: #2c3e50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: white;
}

.game-header {
  width: 100%;
  max-width: 1280px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.game-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.viewport {
  width: 640px; /* 10 tiles wide */
  height: 480px; /* 7.5 tiles high */
  overflow: hidden;
  border: 4px solid #34495e;
  border-radius: 4px;
  background: #2c3e50;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  position: relative;
}

.grid {
  position: absolute;
  background: #2c3e50;
  transition: transform 0.2s ease;
}

.row {
  display: flex;
}

.tile-wrapper {
  float: left;
}

.chat-container {
  width: 300px;
  height: 500px; /* Match grid height roughly */
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid #34495e;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message {
  font-size: 0.9rem;
  word-break: break-word;
}

.chat-user {
  font-weight: bold;
  color: #3498db;
  margin-right: 6px;
}

.chat-text {
  color: #ecf0f1;
}

.chat-input-form {
  display: flex;
  padding: 10px;
  border-top: 1px solid #34495e;
}

.chat-input-form input {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #34495e;
  color: white;
  margin-right: 8px;
}

.chat-input-form button {
  padding: 8px 16px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input-form button:hover {
  background: #3498db;
  font-weight: bold;
}

.btn-logout:hover {
  background: #c0392b;
}

.controls-hint {
  margin-top: 20px;
  color: #bdc3c7;
  font-size: 0.9rem;
}

/* Highlight current user slightly */
.current-user :deep(.user-sprite img) {
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
}
</style>
