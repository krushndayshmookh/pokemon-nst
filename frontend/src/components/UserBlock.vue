<template>
  <div
    class="user-block"
    :style="`
      left: calc(64px * ${loc.x});
      top: calc(64px * ${loc.y});
    `"
  >
    <div class="user-sprite" :class="{ flipped: direction === 'right' }">
      <img
        :src="`/images/pokemon/${pokemonId}.png`"
        :alt="`Pokemon ${pokemonId}`"
        width="64"
        height="64"
      />
    </div>
    <div class="user-name">{{ displayName }}</div>
  </div>
</template>

<script setup>
defineProps({
  loc: {
    type: Object,
    required: true
  },
  pokemonId: {
    type: Number,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    default: 'right'
  }
})
</script>

<style lang="scss" scoped>
.user-block {
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  position: absolute;
  transition: left 0.2s ease, top 0.2s ease;
  z-index: 10;
  pointer-events: none;

  .user-sprite {
    width: 100%;
    height: 100%;
    transition: transform 0.2s ease;

    &.flipped {
      transform: scaleX(-1);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  }

  .user-name {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    z-index: 11;
  }
}
</style>
