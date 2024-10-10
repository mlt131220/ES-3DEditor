<script setup lang="ts">
import { Home } from '@vicons/carbon';
import {IPreviewOperation} from "@/store/modules/previewOperation";
import {MenuOperation} from "@/utils/preview/menuOperation";
import {renderIcon} from "@/utils/common/render";

const props = withDefaults(defineProps<{
  oKey:string,
  operation: IPreviewOperation
}>(), {
  oKey:"",
  operation: () => ({
    name:"",
    icon:Home,
  })
});

function handleClickMenu(){
  if(props.operation.children) return;

  MenuOperation.Init(props.oKey)
}

function getOptions(menuListChildren:{ [key: string]: IPreviewOperation } | undefined) {
  if(!menuListChildren) return [];

  const options: Array<{key: string,label:string,icon:any,disabled:boolean}> = [];
  Object.entries(menuListChildren).forEach(([key, value]: [string, IPreviewOperation]) => {
    options.push({
      key: key,
      label: value.name,
      icon: renderIcon(value.icon),
      disabled: value.disabled || false
    });
  })

  return options;
}

function handleSelect(key: string){
  MenuOperation.Init(key);
}
</script>

<template>
  <n-dropdown v-if="operation.children" trigger="hover"
              :options="getOptions(operation.children)" @select="handleSelect">
    <n-button v-show="operation.show" :bordered="false" tag="div"
              :loading="operation.loading"
              :disabled="operation.disabled"
              :type="operation.active? 'primary' : 'default'"
              @click.stop="handleClickMenu" class="mr-10px">
      <template #icon>
        <n-icon><component :is="operation.icon" /></n-icon>
      </template>
    </n-button>
  </n-dropdown>

  <n-tooltip v-else trigger="hover">
    <template #trigger>
      <n-button v-show="operation.show" :bordered="false" tag="div"
                :loading="operation.loading"
                :disabled="operation.disabled"
                :type="operation.active? 'primary' : 'default'"
                @click.stop="handleClickMenu" class="mr-10px">
        <template #icon>
          <n-icon><component :is="operation.icon" /></n-icon>
        </template>
      </n-button>
    </template>
    {{operation.name}}
  </n-tooltip>
</template>

<style scoped lang="less">

</style>