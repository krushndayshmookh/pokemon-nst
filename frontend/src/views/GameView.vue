<template>
  <div class="game-container">
    <div class="game-header">
      <div class="user-info">
        <span>Playing as: <strong>{{ authStore.user?.displayName }}</strong></span>
        <span v-if="currentUser" class="coordinates">
          Position: ({{ Math.floor(currentUser.x) }}, {{ Math.floor(currentUser.y) }})
        </span>
      </div>
      <button @click="handleLogout" class="btn-logout">Logout</button>
    </div>

    <div class="game-layout">
      <div class="viewport">
        <div class="grid" :style="cameraStyle">
          <!-- Render Grid Tiles -->
          <div v-for="chunk in visibleChunks" :key="`${chunk.x},${chunk.y}`"
               class="chunk"
               :style="{
                 left: `${chunk.x * CHUNK_SIZE * TILE_SIZE}px`,
                 top: `${chunk.y * CHUNK_SIZE * TILE_SIZE}px`,
                 width: `${CHUNK_SIZE * TILE_SIZE}px`,
                 height: `${CHUNK_SIZE * TILE_SIZE}px`
               }">
            <div v-for="(row, y) in chunk.data" :key="y" class="row">
              <div v-for="(tileType, x) in row" :key="`${x}-${y}`" class="tile-wrapper">
                <TileBlock :type="tileType" />
              </div>
            </div>
          </div>

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
      Use Arrow Keys or WASD to move • Press Space to interact with nearby players
    </div>

    <!-- Interaction Components -->
    <InteractionPrompt :nearby-players="nearbyPlayersWithDistance" />
    <NotificationBadge />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInteractionsStore } from '@/stores/interactions'
import { socket } from '@/socket'
import TileBlock from '@/components/TileBlock.vue'
import UserBlock from '@/components/UserBlock.vue'
import InteractionPrompt from '@/components/InteractionPrompt.vue'
import NotificationBadge from '@/components/NotificationBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const interactionsStore = useInteractionsStore()

// Constants
const TILE_SIZE = 64
const CHUNK_SIZE = 16
const VIEWPORT_WIDTH = 640
const VIEWPORT_HEIGHT = 480

// State
const currentUser = ref(null)
const usersMap = ref(new Map())
const messages = ref([])
const newMessage = ref('')
const chatMessagesRef = ref(null)
const chunks = ref({}) // Map<string, ChunkData>

const cameraStyle = computed(() => {
  if (!currentUser.value) return {}

  // Calculate center position
  const centerX = VIEWPORT_WIDTH / 2 - TILE_SIZE / 2
  const centerY = VIEWPORT_HEIGHT / 2 - TILE_SIZE / 2

  // Calculate desired camera position (negative because we move the grid)
  let camX = -(currentUser.value.x * TILE_SIZE) + centerX
  let camY = -(currentUser.value.y * TILE_SIZE) + centerY

  // No clamping for infinite world

  return {
    transform: `translate(${camX}px, ${camY}px)`
  }
})

const visibleChunks = computed(() => {
  if (!currentUser.value) return []

  const cx = Math.floor(currentUser.value.x / CHUNK_SIZE)
  const cy = Math.floor(currentUser.value.y / CHUNK_SIZE)

  const visible = []
  // Render 3x3 chunks around player
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const key = `${cx + dx},${cy + dy}`
      if (chunks.value[key]) {
        visible.push(chunks.value[key])
      }
    }
  }
  return visible
})

const otherUsers = computed(() => {
  return Array.from(usersMap.value.values())
})

const nearbyPlayersWithDistance = computed(() => {
  if (!currentUser.value) return []

  return otherUsers.value
    .map(user => ({
      ...user,
      distance: Math.sqrt(
        Math.pow(user.x - currentUser.value.x, 2) +
        Math.pow(user.y - currentUser.value.y, 2)
      )
    }))
    .filter(user => user.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
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

function onMapChunks(newChunks) {
  console.log('Map chunks received:', Object.keys(newChunks).length)
  chunks.value = { ...chunks.value, ...newChunks }
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
  authStore.logout()
  router.push('/login')
}

function onInteractionReceived(data) {
  interactionsStore.addNotification(data)
}

function onInteractionSent(data) {
  messages.value.push({
    displayName: 'System',
    text: `Interaction sent to ${data.targetDisplayName}`,
    timestamp: new Date().toISOString()
  })
}

function onInteractionResponseReceived(data) {
  const message = data.accepted
    ? `${data.fromDisplayName} accepted your interaction!`
    : `${data.fromDisplayName} declined your interaction.`

  messages.value.push({
    displayName: 'System',
    text: message,
    timestamp: new Date().toISOString()
  })
}

function onInteractionError(error) {
  messages.value.push({
    displayName: 'System',
    text: `Interaction failed: ${error.error}`,
    timestamp: new Date().toISOString()
  })
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

  // No boundary checks for infinite world

  // Collision check
  const cx = Math.floor(newX / CHUNK_SIZE)
  const cy = Math.floor(newY / CHUNK_SIZE)
  const key = `${cx},${cy}`
  const chunk = chunks.value[key]

  if (chunk) {
    // Handle negative coordinates correctly for modulo
    const lx = ((newX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const ly = ((newY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE

    const tile = chunk.data[ly][lx]
    // 0 = Grass, 3 = Sand. Others are blocked.
    if (tile !== 0 && tile !== 3) {
      return
    }
  } else {
    // Don't move into unloaded chunks
    return
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

  // Space key for quick interaction with closest player
  if (e.key === ' ' && nearbyPlayersWithDistance.value.length > 0) {
    const closest = nearbyPlayersWithDistance.value[0]
    socket.emit('interact', {
      targetUserId: closest.userId,
      interactionType: 'hello',
      message: '👋 Hello!'
    })
    return
  }

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
  socket.on('map-chunks', onMapChunks)
  socket.on('existing-users', onExistingUsers)
  socket.on('user-joined', onUserJoined)
  socket.on('user-moved', onUserMoved)
  socket.on('user-left', onUserLeft)
  socket.on('chat-message', onChatMessage)
  socket.on('auth-error', onAuthError)
  socket.on('interaction-received', onInteractionReceived)
  socket.on('interaction-sent', onInteractionSent)
  socket.on('interaction-response-received', onInteractionResponseReceived)
  socket.on('interaction-error', onInteractionError)

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
  socket.off('map-chunks', onMapChunks)
  socket.off('existing-users', onExistingUsers)
  socket.off('user-joined', onUserJoined)
  socket.off('user-moved', onUserMoved)
  socket.off('user-left', onUserLeft)
  socket.off('chat-message', onChatMessage)
  socket.off('auth-error', onAuthError)
  socket.off('interaction-received', onInteractionReceived)
  socket.off('interaction-sent', onInteractionSent)
  socket.off('interaction-response-received', onInteractionResponseReceived)
  socket.off('interaction-error', onInteractionError)

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

/* .user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coordinates {
  font-size: 0.85rem;
  color: #bdc3c7;
  font-family: 'Courier New', monospace;
} */

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
  /* Infinite grid doesn't have fixed size */
}

.chunk {
  position: absolute;
  display: flex;
  flex-direction: column;
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
