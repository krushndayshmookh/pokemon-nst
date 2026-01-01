<template>
  <div class="tile-block" :class="tileClass"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: Number,
    default: 0
  }
})

const tileClass = computed(() => {
  switch (props.type) {
    case 0: return 'grass'
    case 1: return 'water'
    case 2: return 'wall'
    case 3: return 'sand'
    default: return 'grass'
  }
})
</script>

<style lang="scss" scoped>
.tile-block {
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: inline-block;
  float: left;

  &.grass {
    background-color: #4caf50;
    background-image: linear-gradient(45deg, #43a047 25%, transparent 25%, transparent 75%, #43a047 75%, #43a047),
                      linear-gradient(45deg, #43a047 25%, transparent 25%, transparent 75%, #43a047 75%, #43a047);
    background-size: 20px 20px;
    background-position: 0 0, 10px 10px;
  }

  &.water {
    background-color: #2196f3;
    animation: wave 3s infinite linear;
    opacity: 0.8;
  }

  &.wall {
    background-color: #795548;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #5d4037 10px, #5d4037 20px);
  }

  &.sand {
    background-color: #fdd835;
    background-image: radial-gradient(#fbc02d 15%, transparent 16%),
                      radial-gradient(#fbc02d 15%, transparent 16%);
    background-size: 16px 16px;
    background-position: 0 0, 8px 8px;
  }
}

@keyframes wave {
  0% { background-color: #2196f3; }
  50% { background-color: #42a5f5; }
  100% { background-color: #2196f3; }
}
</style>
