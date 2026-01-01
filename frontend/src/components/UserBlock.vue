<template>
  <div
    class="user-block"
    :style="`
      left: calc(64px * ${loc.x - 1} + 1px);
      top: calc(64px * ${loc.y - 1} + 1px);
    `"
  >
    <img
      :src="`/images/pokemon/${userId}.png`"
      :alt="`Pokemon ${userId}`"
      width="64"
      height="64"
    />
  </div>
</template>

<script setup>
defineProps({
  loc: {
    type: Object,
    required: true
  },
  userId: {
    type: Number,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.user-block {
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  position: fixed;
  transition: left 0.2s ease, top 0.2s ease;

  img {
    display: block;
    image-rendering: pixelated;
  }
}
</style>
