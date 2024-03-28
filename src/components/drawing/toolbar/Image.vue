<template>
  <div class="drawing-tool-bar">
    <n-tooltip trigger="hover" placement="bottom" v-for="m in toolbar" :key="m.name">
      <template #trigger>
        <n-button quaternary :type="m.active ? 'primary' : 'default'" :disabled="m.disabled"
                  size="small" @click="clickMenu(m)">
          <template #icon>
            <n-icon>
              <component :is="m.icon"/>
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ m.name }}
    </n-tooltip>

    <n-color-picker placement="top-start" size="small" v-model:show="colorPickerShow" v-model:value="rectColor"
                    :show-alpha="false" :modes="['hex']" @update:value="changeRectColor"/>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {ColorPaletteSharp, LocateSharp, LocationSharp, TrashSharp} from "@vicons/ionicons5";
import {useDrawingStore} from "@/store/modules/drawing";
import {useAddSignal,useRemoveSignal} from "@/hooks/useSignal";
import {t} from "@/language";

interface IToolbarItem {
  key: string;
  name: string;
  icon: any;
  active: boolean;
  disabled: boolean;
}

const drawingStore = useDrawingStore();
const toolbar = computed(() => [
  {key:"reset",name: t("drawing.toolbar.Reset"), icon: LocateSharp, active: false, disabled: false},
  {key:"mark",name: t("drawing.toolbar['Add mark']"), icon: LocationSharp, active: false, disabled: false},
  {key:"colorPicker",name: t("drawing.toolbar['Mark color']"), icon: ColorPaletteSharp,active: false,  disabled: drawingStore.getSelectedRectIndex === -1},
  {key:"delete",name: t("drawing.toolbar.Delete"), icon: TrashSharp, active: false, disabled: drawingStore.getSelectedRectIndex === -1},
])
const rectColor = ref(window.DrawViewer?.rectColor || "#15FF00");
const colorPickerShow = ref(false);

onMounted(() => {
  useAddSignal("drawingMarkDone", drawingMarkDone);
})
onBeforeUnmount(() => {
  useRemoveSignal("drawingMarkDone", drawingMarkDone);
})

function clickMenu(m: IToolbarItem) {
  if (m.disabled) return;

  switch (m.key) {
    case "reset":
      window.DrawViewer?.canvasReset();
      break;
    case "mark":
      m.active = !m.active;

      if (m.active) {
        addMarkCheck(m);
      }else{
        // 退出绘制流程
        window.DrawViewer?.exitRect();
      }
      break;
    case "colorPicker":
      if (colorPickerShow.value) return;

      if (window.DrawViewer?.selectRectIndex === -1) {
        window.$message?.warning(t("drawing['Select the mark whose color you want to change!']"));
      } else {
        rectColor.value = window.DrawViewer?.selectRectColor as string;
        colorPickerShow.value = true;
      }
      break;
    case "delete":
      // 删除标记
      window.DrawViewer?.deleteRect();
      break;
  }
}

function addMarkCheck(m: IToolbarItem) {
  const object = window.editor.selected;
  // 检查是否有选中模型
  if (!object) {
    window.$message?.warning(t("drawing['Please select the model you want to tag']"));
    m.active = false;
    return;
  }

  // 检查该模型是否已有绑定标记
  for (const rect of drawingStore.markList) {
    if (rect.modelUuid === object.uuid) {
      window.$message?.warning(t("drawing['The current model has been tagged']"));
      m.active = false;
      window.DrawViewer?.selectRect(object.uuid);
      return;
    }
  }

  // 新增标记
  window.DrawViewer?.addRect();
  window.$message?.info(t("drawing['Left-drag to add a mark']"));
}

function drawingMarkDone(type:"add" | "update",rect:IDrawingMark){
  switch (type) {
    case "add":
      const mark = toolbar.value.find(m => m.key === "mark");
      if(mark) mark.active = false;
      break;
    case "update":
      break;
  }
}

function changeRectColor(color: string) {
  window.DrawViewer?.setRectColor(color);
}
</script>

<style scoped lang="less">

</style>