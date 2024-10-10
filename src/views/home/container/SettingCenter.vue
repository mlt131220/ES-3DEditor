<script setup lang="ts">
import HeaderCarousel from "@/views/home/components/HeaderCarousel.vue";
</script>

<template>
  <n-layout-header>
    <HeaderCarousel />
  </n-layout-header>

  <n-layout-content content-style="padding: 24px;">
    <SettingTabs/>
  </n-layout-content>
</template>

<style scoped lang="less">
.n-layout-content{
  height: calc(75vh - var(--header-height));
}
</style>