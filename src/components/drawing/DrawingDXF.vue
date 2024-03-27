<template>
  <div id="drawingDXF" class="!w-full !h-full" @contextmenu="handleContextMenu">
    <n-spin :show="loading">
      <template #description>加载中...</template>
      <div class="drawing-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
      </div>
    </n-spin>

    <n-dropdown
        placement="bottom-start"
        trigger="manual"
        :x="xRef"
        :y="yRef"
        :options="rightMenuOptions"
        :show="showRightMenu"
        :on-clickoutside="onClickOutside"
        @select="rightMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, nextTick, computed} from "vue";
import {useThemeVars} from 'naive-ui';
import {useDrawingStore} from "@/store/modules/drawing";
import {t} from "@/language";
import * as Dxf from "@/core/dxf";
import DxfParser from "@/core/dxf/parser";

const themeVars = useThemeVars();
const baseColor = computed(() => themeVars.value.baseColor);
const borderColor = computed(() => themeVars.value.borderColor);

const drawingStore = useDrawingStore();

const containerRef = ref();
const canvasRef = ref();
const loading = ref(true);
// 右键菜单
const rightMenuOptions = computed(() => [
  // {label: t("drawing['adds the current model tag']"), key: 'addRect', show: drawingStore.getSelectedRectIndex === -1},
  // {label: t("drawing['drawing reset']"), key: 'canvasReset'},
  // {label: t("other.delete"), key: 'delete', show: drawingStore.getSelectedRectIndex !== -1},
]);
const xRef = ref(0);
const yRef = ref(0);
const showRightMenu = ref(false);

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();

  showRightMenu.value = false;
  nextTick().then(() => {
    showRightMenu.value = true;
    xRef.value = e.clientX
    yRef.value = e.clientY
  })
}

function onClickOutside() {
  showRightMenu.value = false
}

function rightMenuSelect(key: string) {
  showRightMenu.value = false;

  switch (key) {
    case 'addRect':

      break;
    case 'delete':

      break;
    case "canvasReset":

      break;
  }
}

async function initCanvas() {
  let dxf;

  let canvas = canvasRef.value as HTMLCanvasElement;
  const parentElement = containerRef.value as HTMLDivElement;

  // 实例化Dxf.Viewer
  function loadDxf() {
    const DXFViewer = new Dxf.Viewer(dxf, canvas, parentElement.offsetWidth, parentElement.offsetHeight, () => {
      loading.value = false;
      window.DrawViewer = DXFViewer;
    });

    if (dxf.tables?.layer?.layers) {
      // const bgColor = getLocalItem('cad-options')?.bgColor;
      //
      // if (bgColor) {
      //   const color = Number(bgColor);
      //   const contrastColor = color === 0x000000 ? 0xffffff : 0x000000;
      //
      //   const l = dxf.tables.layer.layers;
      //   Object.keys(l).forEach(k => {
      //     if (l[k].color === color) {
      //       l[k].color = contrastColor;
      //     }
      //   })
      // }
      // setLayers(dxf.tables.layer.layers);
    }
  }

  let notice = window.$notification.info({
    title: window.$t("drawing['Get the drawing data']") + "...",
    content: window.$t("other.Loading") + "...",
    closable: false,
  })

  // dxf 加载图纸
  const parser = new DxfParser();
  fetch(drawingStore.imgSrc).then(res => res.text()).then(text => {
    notice.content = window.$t("scene['Parsing to editor']");
    dxf = parser.parse(text);
    loadDxf();

    setTimeout(() => {
      notice.destroy();
    }, 800)
  })
}

onMounted(async () => {
  await nextTick();
  await initCanvas();
})
</script>

<style lang="less" scoped>
#drawingDXF {
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

    .n-color-picker {
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