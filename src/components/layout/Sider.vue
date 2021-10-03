<script setup lang="ts">
import { inject } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import * as LayoutSider from "../namespace/layout_sider";

const t: any = inject("t");
</script>

<template>
  <n-tabs default-value="scene" justify-content="space-evenly" type="line">
    <n-tab-pane name="scene" :tab="t('layout.sider.Scene')">
      <LayoutSider.Scene />
    </n-tab-pane>
    <n-tab-pane name="project" :tab="t('layout.sider.Project')">
      <LayoutSider.Project />
    </n-tab-pane>
    <n-tab-pane name="sky box" :tab="t('layout.sider[\'Sky Box\']')">
      <LayoutSider.SkyBox />
    </n-tab-pane>
  </n-tabs>
</template>

<style lang="scss" scoped>
</style>
