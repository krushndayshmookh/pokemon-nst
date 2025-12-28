<template>
  <div
    class="user-block"
    :style="`


  left: calc(64px * ${loc.x - 1} + 1px);
  top: calc(64px * ${loc.y - 1} + 1px);





  `"
  >
    <img :src="'/images/pokemon/' + userId + '.png'" alt="" width="64px" height="64px" />
  </div>
</template>

<style lang="scss" scoped>
.user-block {
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  // border: 1px solid red;
  // background-color: #ff000055;
  position: fixed;
}
</style>

<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps(['loc', 'userId'])

console.log(props.loc, props.userId)
</script>
