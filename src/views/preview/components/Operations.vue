<script setup lang="ts">
import {usePreviewOperationStore} from "@/store/modules/previewOperation";
import OperationConfig from "./operationConfigModal/index.vue";
import OperationsItem from "@/views/preview/components/OperationsItem.vue";

const operationStore = usePreviewOperationStore();

</script>

<template>
  <div class="w-full h-0 flex justify-center items-end absolute bottom-15px">
    <n-card size="small" class="w-max" content-style="padding: 5px 0 5px 10px; display: flex;">
      <OperationsItem v-for="o in Object.keys(operationStore.menuList)" :key="o" :oKey="o" :operation="operationStore.menuList[o]" />
    </n-card>
  </div>

  <OperationConfig />
</template>

<style scoped lang="less">
:deep(.n-menu){
  &-item{
    height: 24px;

    &-content{
      padding: 0 !important;
    }
  }
}
</style>