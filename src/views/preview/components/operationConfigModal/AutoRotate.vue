<script setup lang="ts">
import { onMounted,onBeforeUnmount,ref } from 'vue';
import {useAddSignal,useRemoveSignal} from "@/hooks/useSignal";
import {t} from "@/language";

const showModal = ref(false);
const autoRotateSpeed = ref(2);

function handleConfig(isShow:boolean,speed:number){
  showModal.value = isShow;
  autoRotateSpeed.value = speed;
}

function handleClose(){
  showModal.value = false;
}

function handleDragEnd(){
  window.viewer.modules.controls.autoRotateSpeed = autoRotateSpeed.value;
}

onMounted(() => {
  useAddSignal("autoRotateConfigModal",handleConfig)
});
onBeforeUnmount(() => {
  useRemoveSignal("autoRotateConfigModal",handleConfig)
})
</script>

<template>
  <n-card v-if="showModal" :title="t('preview.Auto rotation')" closable @close="handleClose" size="small" :segmented="{
      content: true,
      footer: 'soft',
    }">
    <div class="flex w-full">
      <span class="w-30%">{{ t("preview.Rotational speed") }}</span>
      <n-slider v-model:value="autoRotateSpeed" show-tooltip :step="1" :min="1" :max="10"
                @dragend="handleDragEnd" class="w-70%" />
    </div>
  </n-card>
</template>

<style scoped lang="less">

</style>