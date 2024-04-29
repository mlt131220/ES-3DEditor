<template>
  <div id="navigationOperation" class="flex items-center">
    <!--  撤回/重做  -->
    <Do />

    <!--  复制  -->
    <Copy />

    <!--  删除  -->
    <Delete />

    <!-- 启动 -->
    <Run />

    <!-- 全屏 -->
    <Fullscreen />
  </div>
</template>

<script setup lang="ts">
import Run from "@/components/header/navigation/Run.vue";
import Fullscreen from "@/components/header/navigation/Fullscreen.vue";
import Do from "@/components/header/navigation/Do.vue";
import Copy from "@/components/header/navigation/Copy.vue";
import Delete from "@/components/header/navigation/Delete.vue";
</script>

<style scoped lang="less">

</style>