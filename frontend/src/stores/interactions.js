import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useInteractionsStore = defineStore('interactions', () => {
  const notifications = ref([])
  const interactionHistory = ref([])
  const nearbyPlayers = ref([])

  const unreadCount = computed(() => notifications.value.length)

  function addNotification(notification) {
    notifications.value.push({
      id: Date.now(),
      ...notification,
      read: false
    })
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function markAsRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  function addToHistory(interaction) {
    interactionHistory.value.unshift({
      id: Date.now(),
      ...interaction,
      timestamp: new Date().toISOString()
    })
    // Keep only last 50 interactions
    if (interactionHistory.value.length > 50) {
      interactionHistory.value = interactionHistory.value.slice(0, 50)
    }
  }

  function updateNearbyPlayers(players) {
    nearbyPlayers.value = players
  }

  function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  return {
    notifications,
    interactionHistory,
    nearbyPlayers,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearNotifications,
    addToHistory,
    updateNearbyPlayers,
    calculateDistance
  }
})
