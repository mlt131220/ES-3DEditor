<script setup lang="ts">
withDefaults(defineProps<{
  collapsed: boolean
}>(), {
  collapsed: false
})
</script>

<template>
  <div class="pt-24px w-full flex justify-center items-center">
    <div class="min-w-40px">
      <Logo />
    </div>

    <transition enter-active-class="animate__animated animate__fadeInRight" leave-active-class="animate__animated animate__fadeOutRight">
      <n-gradient-text :size="24" type="success" class="ml-5px" v-if="!collapsed">
        ES 3D Editor
      </n-gradient-text>
    </transition>
  </div>
</template>

<style scoped lang="less">

</style>