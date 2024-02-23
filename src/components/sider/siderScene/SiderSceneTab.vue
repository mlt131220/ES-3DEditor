<script lang="ts" setup>
import {NTabs, NTabPane} from "naive-ui";
import {ref, onMounted, onBeforeUnmount, nextTick} from "vue";

import {t} from "@/language";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import SiderSceneAttribute from "./SiderSceneAttribute.vue";
import SiderSceneGeometry from "./SiderSceneGeometry.vue";
import SiderSceneMaterial from "./SiderSceneMaterial.vue";
import SiderSceneDrawing from "./SiderSceneDrawing.vue";

const tabContainerHeight = ref('0px')

// 计算子tab 内容区域高度
async function computeTabContainerHeight() {
  await nextTick();
  setTimeout(()=>{
    const centerContainerHeight = (document.querySelector("#layout .n-layout-center-layout") as HTMLDivElement).offsetHeight;
    const rightSideTabNavHeight = (document.querySelector("#right-side-tab .n-tabs-nav") as HTMLDivElement).offsetHeight;
    const sceneTopHeight = (document.querySelector(".scene-top") as HTMLDivElement).offsetHeight;
    const rightSideTabSceneTabNavHeight = (document.querySelector("#right-side-tab-scene-tab .n-tabs-nav") as HTMLDivElement).offsetHeight;

    tabContainerHeight.value = (centerContainerHeight - rightSideTabNavHeight - sceneTopHeight - rightSideTabSceneTabNavHeight - 35) + "px";
  },60)
}

onMounted(() => {
  computeTabContainerHeight()

  useAddSignal("sceneBackgroundChanged", computeTabContainerHeight)
  useAddSignal("sceneEnvironmentChanged", computeTabContainerHeight)
  useAddSignal("sceneFogChanged", computeTabContainerHeight)
  useAddSignal("sceneResize", computeTabContainerHeight)
})

onBeforeUnmount(() => {
  useRemoveSignal("sceneBackgroundChanged", computeTabContainerHeight)
  useRemoveSignal("sceneEnvironmentChanged", computeTabContainerHeight)
  useRemoveSignal("sceneFogChanged", computeTabContainerHeight)
  useRemoveSignal("sceneResize", computeTabContainerHeight)
})
</script>

<template>
  <n-tabs default-value="Object" justify-content="space-evenly" type="segment" id="right-side-tab-scene-tab">
    <n-tab-pane name="Object" :tab="t('layout.sider.scene.Object')" display-directive="show">
      <SiderSceneAttribute />
    </n-tab-pane>
    <n-tab-pane name="Geometry" :tab="t('layout.sider.scene.Geometry')" display-directive="show">
      <SiderSceneGeometry />
    </n-tab-pane>
    <n-tab-pane name="Material" :tab="t('layout.sider.scene.Material')" display-directive="show">
      <SiderSceneMaterial />
    </n-tab-pane>
    <n-tab-pane name="Drawing" :tab="t('layout.sider.scene.Drawing')" display-directive="show">
      <SiderSceneDrawing />
    </n-tab-pane>
  </n-tabs>
</template>

<style scoped lang="less">
.n-tabs {
  :deep(.n-tabs-rail) {
    overflow-x: auto;

    .n-tabs-tab-wrapper {
      min-width: 33%;
      flex-basis: auto;
    }
  }

  :deep(.n-tab-pane) {
    &>div{
      overflow-y: auto;
      height: v-bind(tabContainerHeight);
    }
  }
}
</style>
