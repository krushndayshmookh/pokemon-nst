<template>
  <div
    id="playground"
    :style="`
      width: calc(64px * ${blockCountX});
      height: calc(64px * ${blockCountY});

    `"
  >
    <!-- <TileBlock v-for="(n, idx) in blockCountX * blockCountY" /> -->

    <UserBlock v-for="user in users" :loc="user.loc" :user-id="user.id" />
  </div>

  <!-- margin-left: ${marginLeft}px;
      margin-top: ${marginTop}px; -->
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'

import TileBlock from './components/TileBlock.vue'
import UserBlock from './components/UserBlock.vue'

import { socket, socketState } from '@/socket'

const BLOCK_SIZE = 64

const blockCountX = ref(0)
const blockCountY = ref(0)

const marginLeft = ref(0)
const marginTop = ref(0)

const users = ref([])
const currentUserId = ref(0)

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight

  blockCountX.value = Math.floor(width / BLOCK_SIZE)
  blockCountY.value = Math.floor(height / BLOCK_SIZE)

  marginLeft.value = (width - 2 - BLOCK_SIZE * blockCountX.value) / 2
  marginTop.value = (height - 2 - BLOCK_SIZE * blockCountY.value) / 2

  // users.value = [
  //   { loc: socketState.location, id: socketState.userId },
  //   // { loc: { x: 5, y: 7 }, id: 1 },
  //   // { loc: { x: 3, y: 5 }, id: 2 },
  //   // { loc: { x: 7, y: 5 }, id: 3 },
  //   // { loc: { x: 3, y: 6 }, id: 4 },
  //   // { loc: { x: 8, y: 5 }, id: 5 },
  //   // { loc: { x: 2, y: 7 }, id: 6 },
  //   // { loc: { x: 1, y: 8 }, id: 7 },
  //   // { loc: { x: 2, y: 4 }, id: 8 },
  // ]

  if (!socketState.connected) socket.connect()
})

socket.on('welcome', (evt) => {
  currentUserId.value = evt.id
})

socket.on('join', (evt) => {
  console.log('join in comp', evt)
  users.value.push({
    id: evt.id,
    loc: {
      ...evt,
    },
  })
  // currentUserId.value = evt.id
})

socket.on('move', (evt) => {
  const userId = evt.id

  const user = users.value.find((u) => u.id == userId)
  if (!user) {
    users.value.push({
      id: evt.id,
      loc: {
        ...evt,
      },
    })
  } else {
    const userIdx = users.value.findIndex((u) => u.id == userId)
    users.value[userIdx] = {
      id: evt.id,
      loc: {
        ...evt,
      },
    }
  }
})

const moveUser = (id, dir) => {
  const userIdx = users.value.findIndex((u) => u.id == id)
  const user = users.value[userIdx]

  const newLoc = { ...users.value[userIdx].loc }

  switch (dir) {
    case 'left':
      newLoc.x = newLoc.x - 1
      break

    case 'right':
      newLoc.x = newLoc.x + 1
      break

    case 'down':
      newLoc.y = newLoc.y + 1
      break

    case 'up':
      newLoc.y = newLoc.y - 1
      break

    default:
      break
  }

  const isOccupied = users.value.find((u) => {
    return u.loc.x == newLoc.x && u.loc.y == newLoc.y
  })

  if (!isOccupied) {
    users.value[userIdx].loc = { ...newLoc }
    socket.emit('move', { user: user.id, ...newLoc })
  } else {
    // alert('Occupied')
    console.log('already occupied')
  }
}

onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
  console.log('Move Down')
  moveUser(currentUserId.value, 'down')
})

onKeyStroke('ArrowUp', (e) => {
  e.preventDefault()
  console.log('Move Up')
  moveUser(currentUserId.value, 'up')
})

onKeyStroke('ArrowLeft', (e) => {
  e.preventDefault()
  console.log('Move Left')
  moveUser(currentUserId.value, 'left')
})

onKeyStroke('ArrowRight', (e) => {
  e.preventDefault()
  console.log('Move Right')
  moveUser(currentUserId.value, 'right')
})
</script>

<style scoped>
#playground {
  width: 100vw;
  height: 100vh;
  display: block;
  position: absolute;
  border: 1px solid black;

  background-color: azure;
}

.user-layer {
  background-color: blue;
  position: absolute;
  z-index: 200;
}
</style>
