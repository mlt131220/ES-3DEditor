<template>
  <div id="drawing" class="!w-full !h-full" @contextmenu="handleContextMenu">
    <n-spin :show="loading">
      <template #description>加载中...</template>
      <div class="drawing-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
      </div>
    </n-spin>

    <ImageToolbar v-if="!drawingStore.isCad" />
    <CADToolbar v-else />
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, nextTick, computed, onBeforeUnmount} from "vue";
import {useThemeVars} from 'naive-ui';
import {useDrawingStore} from "@/store/modules/drawing";
import {useAddSignal,useRemoveSignal} from "@/hooks/useSignal";
import {DrawRect} from "@/utils/drawing/drawRect";
import ImageToolbar from "./toolbar/Image.vue";
import CADToolbar from "./toolbar/CAD.vue";

const themeVars = useThemeVars();
const baseColor = computed(() => themeVars.value.baseColor);
const borderColor = computed(() => themeVars.value.borderColor);

const drawingStore = useDrawingStore();

const containerRef = ref();
const canvasRef = ref();
const loading = ref(true);

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();

  return false
}

function loadCadFile(canvas:HTMLCanvasElement,parentElement:HTMLDivElement){}

async function initCanvas() {
  if(!drawingStore.imgSrc) return;

  let canvas = canvasRef.value as HTMLCanvasElement;
  const parentElement = containerRef.value as HTMLDivElement;

  if(drawingStore.isCad){
    // dxf 加载图纸
    loadCadFile(canvas, parentElement);
  }else{
    // canvas 加载图片
    let bigImg = new Image();
    bigImg.src = drawingStore.getImgSrc;
    bigImg.onload = () => {
      const containerHeight = (containerRef.value as HTMLDivElement).offsetHeight;
      canvas.height = containerHeight;
      canvas.width = bigImg.width * (containerHeight / bigImg.height);

      canvas.style.backgroundImage = `url(${drawingStore.getImgSrc})`;
      canvas.style.backgroundRepeat = "no-repeat";
      canvas.style.backgroundPosition = "top left";
      canvas.style.backgroundSize = "100% 100%";

      drawingStore.setImgInfo({
        width: canvas.width,
        height: canvas.height
      })

      window.DrawViewer = new DrawRect(canvas,parentElement);

      loading.value = false;
    }
  }
}

// 模型选中时反选图纸上的rect
function objectSelected(object){
  if(!object ||!window.DrawViewer) return;
  // if(!drawingStore.isCad){
  //   window.DrawViewer?.selectRect(object.uuid);
  // }else{
  //   // 检查该模型是否已有绑定标记
  //   for (const rect of drawingStore.markList) {
  //     if (rect.modelUuid === object.uuid) {
  //       window.DrawViewer?.selectRect(object.uuid);
  //       return;
  //     }
  //   }
  //
  //   window.DrawViewer?.selectRect(undefined);
  // }

  window.DrawViewer?.selectRect(object.uuid);
}

onMounted(async () => {
  await nextTick();
  await initCanvas();

  useAddSignal("objectSelected", objectSelected);
})
onBeforeUnmount(() => {
  useRemoveSignal("objectSelected", objectSelected);

  window.DrawViewer?.dispose();
  window.DrawViewer = undefined;
})
</script>

<style lang="less" scoped>
#drawing {
  overflow: hidden;
  display: flex;
  justify-content: center;

  :deep(.n-spin-container){
    width: 100%;
    height: 100%;
  }

  .drawing-container {
    position: relative;
    margin: 0 auto;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    canvas {
      position: relative;
      transition: all 16ms;
      z-index: 10;
      width: auto;
      height: auto;
    }
  }

  .drawing-tool-bar {
    position: absolute;
    bottom: 3%;
    padding: 0.2rem 0.5rem;
    background: v-bind(baseColor);
    z-index: 999;
    border: 1px solid v-bind(borderColor);
    border-radius: 0.3rem;
    display: flex;

    :deep(.n-color-picker) {
      position: absolute;
      width: 0;
      overflow: hidden;

      &-trigger {
        border: 0;
        width: 0;
      }
    }
  }
}
</style>