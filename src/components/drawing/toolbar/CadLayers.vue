<template>
  <n-popover trigger="manual" :show="show">
    <template #trigger>
      <span class="absolute" ref="triggerRef"></span>
    </template>

    <div class="overflow-y-auto h-500px">
      <div className="flex items-center mb-15px">
        <n-icon size="16" color="#CACACA" v-if="viewAll">
          <EyeSharp className="cursor-pointer" @click="handleLayersAllView(false)"/>
        </n-icon>
        <n-icon size="16" color="#CACACA" v-else>
          <EyeOffSharp className="cursor-pointer" @click="handleLayersAllView(true)"/>
        </n-icon>
        <span className="ml-5px">全部图层</span>
      </div>

      <div v-for="key in Object.keys(drawingStore.layers)" :key="key" className="flex items-center mt-10px">
        <n-icon size="16" color="#CACACA" v-if="drawingStore.layers[key].visible">
          <EyeSharp className="cursor-pointer" @click="handleSetLayerVisible(key,false)"/>
        </n-icon>
        <n-icon size="16" color="#CACACA" v-else>
          <EyeOffSharp className="cursor-pointer" @click="handleSetLayerVisible(key,true)"/>
        </n-icon>
        <div className="w-15px h-15px mx-5px"
             :style="{backgroundColor: decToRgb(drawingStore.layers[key].color)}"></div>
        <span className="ml-5px">{{ drawingStore.layers[key].name }}</span>
      </div>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import {ref, onMounted, nextTick} from 'vue';
import {EyeSharp, EyeOffSharp} from '@vicons/ionicons5';
import {useDrawingStore} from "@/store/modules/drawing";
import {decToRgb} from "@/utils/common/color";

withDefaults(defineProps<{
  show: boolean
}>(), {
  show: false
})

const emits = defineEmits(['update:show'])

const drawingStore = useDrawingStore();
const triggerRef = ref<HTMLSpanElement>();
const viewAll = ref(true);

onMounted(() => {
  // 在图层按钮位置弹出
  const layerBtn = document.getElementById("drawing-tool-bar-layers");
  nextTick().then(() => {
    if (layerBtn && triggerRef.value) {
      triggerRef.value.style.left = `${layerBtn.offsetLeft + layerBtn.clientWidth /2 }px`;
    }
  })
});

// 全部图层显示/隐藏
function handleLayersAllView(bool: boolean) {
  viewAll.value = bool;

  Object.keys(drawingStore.layers).forEach((key) => {
    handleSetLayerVisible(key, bool, false);
  });
  drawingStore.setLayerAllVisible(bool);
}

function handleSetLayerVisible(layerName: string, bool: boolean, setStore = true) {
  window.DrawViewer?.callMethod("setLayerVisible", {layerName, visible: bool});
  setStore && drawingStore.setLayerVisible(layerName, bool);
}
</script>

<style scoped lang="less">

</style>