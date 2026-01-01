<template>
  <div v-if="notifications.length > 0" class="notifications-container">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="notification"
      :class="notification.interactionType"
    >
      <div class="notification-header">
        <span class="icon">
          {{ getIcon(notification.interactionType) }}
        </span>
        <strong>{{ notification.fromDisplayName }}</strong>
      </div>
      <div class="notification-body">
        {{ notification.message || getDefaultMessage(notification.interactionType) }}
      </div>
      <div class="notification-actions">
        <button @click="respond(notification, true)" class="btn-accept">
          ✓ Accept
        </button>
        <button @click="respond(notification, false)" class="btn-ignore">
          ✕ Ignore
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { socket } from '@/socket'
import { useInteractionsStore } from '@/stores/interactions'

const interactionsStore = useInteractionsStore()

const notifications = computed(() => interactionsStore.notifications)

function getIcon(type) {
  const icons = {
    hello: '👋',
    wave: '✋',
    talk: '💬',
    default: '👤'
  }
  return icons[type] || icons.default
}

function getDefaultMessage(type) {
  const messages = {
    hello: 'says hello!',
    wave: 'waves at you!',
    talk: 'wants to talk!',
    default: 'sent an interaction'
  }
  return messages[type] || messages.default
}

function respond(notification, accepted) {
  socket.emit('interaction-response', {
    fromUserId: notification.fromUserId,
    accepted
  })

  interactionsStore.addToHistory({
    type: 'received',
    fromName: notification.fromDisplayName,
    interactionType: notification.interactionType,
    message: notification.message,
    responded: accepted ? 'accepted' : 'ignored'
  })

  interactionsStore.removeNotification(notification.id)

  // Show feedback
  if (accepted) {
    // Could add a success toast here
  }
}
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  max-width: 320px;
}

.notification {
  background: rgba(0, 0, 0, 0.9);
  border-left: 4px solid #667eea;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.hello {
  border-left-color: #3498db;
}

.notification.wave {
  border-left-color: #e74c3c;
}

.notification.talk {
  border-left-color: #2ecc71;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.notification-header .icon {
  font-size: 1.3rem;
}

.notification-body {
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #ecf0f1;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept {
  background: #2ecc71;
  color: white;
}

.btn-accept:hover {
  background: #27ae60;
  transform: translateY(-1px);
}

.btn-ignore {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-ignore:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
