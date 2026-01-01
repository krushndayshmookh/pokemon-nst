<template>
  <div v-if="nearbyPlayers.length > 0" class="interaction-prompt">
    <div class="prompt-header">
      <span class="icon">👋</span>
      <span>{{ nearbyPlayers.length }} player{{ nearbyPlayers.length > 1 ? 's' : '' }} nearby</span>
    </div>
    <div class="nearby-list">
      <div
        v-for="player in nearbyPlayers"
        :key="player.userId"
        class="nearby-player"
        @click="showInteractionMenu(player)"
      >
        <img
          :src="`/images/pokemon/${player.pokemonId}.png`"
          :alt="player.displayName"
          class="player-icon"
        />
        <div class="player-info">
          <div class="player-name">{{ player.displayName }}</div>
          <div class="player-distance">{{ player.distance.toFixed(1) }} tiles away</div>
        </div>
        <button class="interact-btn">Interact</button>
      </div>
    </div>

    <!-- Interaction Menu Modal -->
    <div v-if="selectedPlayer" class="interaction-modal" @click.self="closeMenu">
      <div class="modal-content">
        <h3>Interact with {{ selectedPlayer.displayName }}</h3>
        <div class="interaction-options">
          <button @click="sendInteraction('hello', '👋 Hello!')" class="option-btn hello">
            <span class="icon">👋</span>
            <span>Say Hello</span>
          </button>
          <button @click="sendInteraction('wave', '👋 *waves*')" class="option-btn wave">
            <span class="icon">✋</span>
            <span>Wave</span>
          </button>
          <button @click="showCustomMessage = true" class="option-btn talk">
            <span class="icon">💬</span>
            <span>Send Message</span>
          </button>
        </div>

        <div v-if="showCustomMessage" class="custom-message">
          <input
            v-model="customMessage"
            type="text"
            placeholder="Type your message..."
            maxlength="100"
            @keyup.enter="sendInteraction('talk', customMessage)"
          />
          <button @click="sendInteraction('talk', customMessage)">Send</button>
        </div>

        <button @click="closeMenu" class="close-btn">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { socket } from '@/socket'
import { useInteractionsStore } from '@/stores/interactions'

const props = defineProps({
  nearbyPlayers: {
    type: Array,
    default: () => []
  }
})

const interactionsStore = useInteractionsStore()
const selectedPlayer = ref(null)
const showCustomMessage = ref(false)
const customMessage = ref('')

function showInteractionMenu(player) {
  selectedPlayer.value = player
  showCustomMessage.value = false
  customMessage.value = ''
}

function closeMenu() {
  selectedPlayer.value = null
  showCustomMessage.value = false
  customMessage.value = ''
}

function sendInteraction(type, message) {
  if (!selectedPlayer.value) return

  socket.emit('interact', {
    targetUserId: selectedPlayer.value.userId,
    interactionType: type,
    message: message || ''
  })

  interactionsStore.addToHistory({
    type: 'sent',
    targetName: selectedPlayer.value.displayName,
    interactionType: type,
    message
  })

  closeMenu()
}
</script>

<style scoped>
.interaction-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 15px;
  min-width: 280px;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: white;
  z-index: 1000;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 0.95rem;
}

.prompt-header .icon {
  font-size: 1.2rem;
}

.nearby-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nearby-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nearby-player:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(2px);
}

.player-icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.player-distance {
  font-size: 0.75rem;
  color: #bdc3c7;
}

.interact-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.interact-btn:hover {
  background: #5568d3;
}

.interaction-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #2c3e50;
  border-radius: 16px;
  padding: 30px;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-content h3 {
  margin: 0 0 20px;
  color: white;
  text-align: center;
  font-size: 1.3rem;
}

.interaction-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #667eea;
  transform: translateY(-2px);
}

.option-btn .icon {
  font-size: 1.5rem;
}

.custom-message {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.custom-message input {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
}

.custom-message input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.custom-message button {
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
