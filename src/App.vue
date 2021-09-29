<script setup lang="ts">
</script>

<template>
<!-- 调整 naive-ui 的字重配置 -->
<n-config-provider :theme-overrides="{ common: { fontWeightStrong: '600' } }">
    <router-view></router-view>
</n-config-provider>
</template>

<style>

</style>
