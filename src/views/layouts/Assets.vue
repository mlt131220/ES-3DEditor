<template>
  <div id="layout-assets">
    <n-tabs default-value="library" animated type="line" justify-content="space-around">
      <n-tab-pane name="library" :tab="t('layout.assets[\'Resource library\']')" display-directive="show">
        <AssetsLibrary></AssetsLibrary>
      </n-tab-pane>
      <n-tab-pane name="bim" tab="BIM" display-directive="show">
        <BIMLibrary></BIMLibrary>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts" setup>
import {t} from "@/language";
import AssetsLibrary from "@/components/assets/AssetsLibrary.vue";
import BIMLibrary from "@/components/assets/BIMLibrary.vue";
</script>

<style scoped lang="less">
#layout-assets {
  .n-tabs:first-child{
    :deep(.n-tabs-tab-wrapper){
      padding: 0 0.5rem;
    }
    .n-tab-pane:first-child {
      padding-top: 0;
    }
  }
}
</style>
