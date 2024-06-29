<template>
  <div id="layout-assets">
    <SceneTree style="height: calc(40% - 25px)"/>

    <n-tabs default-value="bim" animated type="line" justify-content="space-around" class="!h-60%" pane-class="layout-assets-tab-pane">
      <n-tab-pane name="library" :tab="t('layout.assets[\'Resource library\']')" display-directive="show">
        <AssetsLibrary></AssetsLibrary>
      </n-tab-pane>
      <n-tab-pane name="cad" tab="CAD" display-directive="show">
        <CadLibrary />
      </n-tab-pane>
      <n-tab-pane name="bim" tab="BIM" display-directive="show">
        <BIMLibrary />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts" setup>
import {t} from "@/language";
import AssetsLibrary from "@/components/assets/AssetsLibrary.vue";
import BIMLibrary from "@/components/assets/BIMLibrary.vue";
import SceneTree from "@/components/tree/SceneTree.vue";
import CadLibrary from "@/components/assets/CadLibrary.vue";
</script>

<style scoped lang="less">
#layout-assets {
  height: calc(100vh - var(--header-height) - var(--footer-height));
  border-right: 1px solid var(--n-border-color);

  .layout-assets-tab-pane{
    height: calc(100% - var(--n-pane-padding-top));
    overflow-y: auto;

    &:first-child{
      overflow: unset;
    }
  }
}
</style>
