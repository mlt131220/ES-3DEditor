<script lang="ts" setup>
import { ref } from 'vue';
import {t} from "@/language";
import {zip} from "@/utils/common/pako";
import {useDrawingStore} from "@/store/modules/drawing";

const loading = ref(false);
function saveState() {
  loading.value = true;

  const editor = window.editor;
  const drawingStore = useDrawingStore();

  editor.storage.set(editor.toJSON());

  // 判断是否有图纸
  if (drawingStore.getIsUploaded) {
    // 存储图纸相关信息至indexDB
    editor.storage.setDrawing({
      imgSrc: drawingStore.getImgSrc,
      markList: zip(drawingStore.getMarkList),
      selectedRectIndex: drawingStore.getSelectedRectIndex,
      imgInfo: JSON.stringify(drawingStore.getImgInfo)
    });
  }

  window.$message?.success(t("prompt['Saved successfully!']"));
  loading.value = false;
}
</script>

<template>
  <n-button :loading="loading" size="small" type="primary" @click="saveState">{{ t("layout.header['Save locally']") }}</n-button>
</template>

<style lang="less" scoped>
</style>
