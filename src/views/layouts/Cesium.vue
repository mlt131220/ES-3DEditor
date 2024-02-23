<script lang="ts" setup>
import {onMounted, onBeforeUnmount, ref, nextTick} from 'vue';
import {useAddSignal,useRemoveSignal} from "@/hooks/useSignal";

import ViewPort from '@/cesium/viewPort';

let cesiumViewPort: any = null;
const cesiumRef = ref();
const loading = ref(false);
const loadingText = ref("");

function handleSignals(isAdd:boolean){
  function changeLoading(bool:boolean){
    loading.value = bool;
  }
  function changeLoadingText(str:string){
    loadingText.value = str;
  }

  const signals = {
    "switchViewportLoading":changeLoading,
    "changeViewportLoadingText":changeLoadingText
  }
  Object.keys(signals).forEach(name => {
    isAdd ? useAddSignal(name,signals[name]) : useRemoveSignal(name,signals[name]);
  })
}

onMounted(async () => {
  await nextTick();

  cesiumViewPort = new ViewPort(cesiumRef.value);

  handleSignals(true);
})

onBeforeUnmount(() => {
  cesiumViewPort = null;

  handleSignals(false);
})
</script>

<template>
  <n-spin :show="loading">
    <div id="cesiumContainer" ref="cesiumRef" class="absolute top-0 left-0 w-full h-full"></div>

    <template #description>{{ loadingText }}</template>
  </n-spin>
</template>

<style lang="less" scoped>
#cesiumContainer {
  position: relative;
  overflow: hidden;

  /*设置cesium和three的画布位置*/
  :deep(canvas) {
    position: absolute;
    top: 0;

    /*three画布禁止鼠标操作*/
    &:nth-child(3) {
      pointer-events: none;
    }
  }

  :deep(.cesium-viewer) {
    position: absolute !important;
  }
}

.n-spin-container {
  width: 100%;
  height: calc(100% - 1.4rem - 1px);
  overflow: hidden;

  :deep(.n-spin-content) {
    width: 100%;
    height: 100%;
  }
}
</style>
