<script setup lang="ts">
import {ref,inject} from 'vue';
import { NTabs,NTabPane } from 'naive-ui';

const t:any = inject("t");
</script>

<template>
    <n-tabs default-value="scene" justify-content="space-evenly" type="line">
      <n-tab-pane name="scene" :tab="t('layout.sider.Scene')">Wonderwall</n-tab-pane>
      <n-tab-pane name="project" :tab="t('layout.sider.Project')">Hey Jude</n-tab-pane>
      <!-- <n-tab-pane name="setting" tab="设置">七里香</n-tab-pane> -->
      <n-tab-pane name="sky box" :tab="t('layout.sider[\'Sky Box\']')">七里香</n-tab-pane>
    </n-tabs>
</template>

<style lang="scss" scoped>
    
</style>
