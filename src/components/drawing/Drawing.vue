<template>
  <div id="drawing" class="!w-full !h-full" @contextmenu="handleContextMenu">
    <div class="drawing-container" ref="containerRef">
      <canvas ref="markCanvasRef"></canvas>
    </div>

    <!-- 绘制矩形时的工具栏 -->
    <div class="drawing-tool-bar" v-if="drawingStore.getMarkList.length > 0">
      <n-color-picker placement="top-start" size="small" v-model:show="colorPickerShow" v-model:value="rectColor"
                      :show-alpha="false" :modes="['hex']"
                      @update:value="changeRectColor"></n-color-picker>
      <n-button quaternary size="small" @click="showColorPicker">
        <template #icon>
          <n-icon>
            <ColorPaletteSharp/>
          </n-icon>
        </template>
      </n-button>
    </div>

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
import {useDrawingStore} from "@/store/modules/drawing";
import {DrawRect} from "@/utils/drawing/drawRect";
import {t} from "@/language";
import {ColorPaletteSharp} from "@vicons/ionicons5";
import {useThemeVars} from 'naive-ui';

const themeVars = useThemeVars();
const baseColor = computed(() => themeVars.value.baseColor);
const borderColor = computed(() => themeVars.value.borderColor);

const drawingStore = useDrawingStore();
let drawInstance: DrawRect | undefined = undefined;

const containerRef = ref();
const markCanvasRef = ref();
// 右键菜单
const rightMenuOptions = computed(() => [
  {label: t("drawing['adds the current model tag']"), key: 'addRect', show: drawingStore.getSelectedRectIndex === -1},
  {label: t("drawing['drawing reset']"), key: 'canvasReset'},
  {label: t("other.delete"), key: 'delete', show: drawingStore.getSelectedRectIndex !== -1},
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
      // 检查是否有选中模型
      if (window.editor.selected === null) {
        window.$message?.error(t("drawing['Please select the model you want to tag']"));
        return;
      }
      // 检查该模型是否已有绑定标记
      for (const rect of drawingStore.getMarkList) {
        if (rect.modelUuid === window.editor.selected.uuid) {
          window.$message?.error(t("drawing['The current model has been tagged']"));
          drawInstance?.selectRect(window.editor.selected.uuid);
          return;
        }
      }

      // 新增标记
      drawInstance?.addRect();
      break;
    case 'delete':
      // 删除标记
      drawInstance?.deleteRect();
      break;
    case "canvasReset":
      drawInstance?.canvasReset();
      break;
  }
}

async function initCanvas() {
  let cav = markCanvasRef.value as HTMLCanvasElement;

  // canvas 加载图片
  let bigImg = new Image();
  bigImg.src = drawingStore.getImgSrc;
  bigImg.onload = () => {
    const containerHeight = (containerRef.value as HTMLDivElement).offsetHeight;
    cav.height = containerHeight;
    cav.width = bigImg.width * (containerHeight / bigImg.height);

    cav.style.backgroundImage = `url(${drawingStore.getImgSrc})`;
    cav.style.backgroundRepeat = "no-repeat";
    cav.style.backgroundPosition = "top left";
    cav.style.backgroundSize = "100% 100%";

    drawingStore.setImgInfo({
      width: cav.width,
      height: cav.height
    })

    // 调用封装的绘制方法
    drawInstance = new DrawRect(cav);
  }
}

/* 工具栏 */
const rectColor = ref('#15FF00');
const colorPickerShow = ref(false);

function changeRectColor(color: string) {
  drawInstance?.setRectColor(color);
}

function showColorPicker() {
  if (colorPickerShow.value) return;

  if (drawInstance?.selectRectIndex === -1) {
    window.$message?.warning(t("drawing['Select the mark whose color you want to change!']"));
    throw new Error(t("drawing['Select the mark whose color you want to change!']"));
  }
  rectColor.value = drawInstance?.selectRectColor as string;
  colorPickerShow.value = true;
}

onMounted(async () => {
  await nextTick();
  await initCanvas();
})
</script>

<style lang="less">
#drawing {
  overflow: hidden;
  display: flex;
  justify-content: center;

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