<script setup lang="ts">
import {ref} from 'vue';
import { NTabs,NTabPane } from 'naive-ui';
</script>

<template>
    <n-tabs default-value="scene" justify-content="space-evenly" type="line">
      <n-tab-pane name="scene" tab="场景">Wonderwall</n-tab-pane>
      <n-tab-pane name="project" tab="项目">Hey Jude</n-tab-pane>
      <!-- <n-tab-pane name="setting" tab="设置">七里香</n-tab-pane> -->
      <n-tab-pane name="sky box" tab="天空盒">七里香</n-tab-pane>
    </n-tabs>
</template>

<style lang="scss" scoped>
    
</style>
