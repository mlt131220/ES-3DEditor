<script setup lang="ts">
import SiderScene from "@/components/sider/SiderScene.vue";
// import SiderSkyBox from "@/components/sider/SiderSkyBox.vue";
import SiderProject from "@/components/sider/SiderProject.vue";
import {t} from "@/language";
</script>

<template>
  <n-tabs default-value="scene" justify-content="space-evenly" type="line" id="right-side-tab">
    <n-tab-pane name="scene" :tab="t('layout.sider.Scene')" display-directive="show">
      <SiderScene />
    </n-tab-pane>
    <n-tab-pane name="project" :tab="t('layout.sider.Project')" display-directive="show">
      <SiderProject />
    </n-tab-pane>
<!--    <n-tab-pane name="skybox" :tab="t('layout.sider[\'Sky Box\']')" display-directive="show">-->
<!--      <SiderSkyBox />-->
<!--    </n-tab-pane>-->
  </n-tabs>
</template>

<style lang="less" scoped>
</style>
