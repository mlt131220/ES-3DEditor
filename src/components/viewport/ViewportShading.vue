<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click" :style="{padding: 0}">
    <template #trigger>
      <n-button round size="small" class="ml-10px">
        <template #icon>
          <n-icon>
            <component :is="current.icon" />
          </n-icon>
        </template>
        {{ current.label }}
      </n-button>
    </template>
    <n-radio-group v-model:value="current.key" size="small">
      <template v-for="song in options" :key="song.key">
        <n-radio :value="song.key" @click="handlerChange(song)">
          <div class="flex items-center">
            <n-icon class="ml-10px mr-5px">
              <component :is="song.icon" />
            </n-icon>
            <span>{{ song.label }}</span>
          </div>

          <span>{{song.shortcuts}}</span>
        </n-radio>
      </template>
    </n-radio-group>
  </n-popover>
</template>

<script lang="ts" setup>
import type {ComputedRef} from "vue";
import {ref, onMounted, onBeforeUnmount} from "vue";
import {
  WindowBlackSaturation,UvIndexAlt,Wikis,Contrast
} from '@vicons/carbon';
import {useAddSignal,useRemoveSignal} from '@/hooks/useSignal';
import {cpt} from "@/language";

interface IOption {
  label: ComputedRef<string> | string,
  key: string,
  icon?: any,
  shortcuts?: string
}

const options = ref<IOption[]>([
  {
    key:"realistic",
    label:cpt('layout.scene.toolbar.Realistic'),
    icon:WindowBlackSaturation,
    shortcuts:"ALT+1"
  },
  {
    key:"solid",
    label:cpt("layout.scene.toolbar.Solid"),
    icon:Contrast,
    shortcuts:"ALT+2"
  },
  {
    key:"normals",
    label:cpt("layout.scene.toolbar.Normals"),
    icon:UvIndexAlt,
    shortcuts:"ALT+3"
  },
  {
    key:"wireframe",
    label:cpt("layout.scene.toolbar.Wireframe"),
    icon:Wikis,
    shortcuts:"ALT+4"
  }
])

// default value is "solid"
const current = ref<IOption>(options.value[1]);

function handlerChange(value: IOption) {
  current.value = value;
  window.editor.setViewportShading(current.value.key);
}

function editorCleared() {
  current.value = options.value[1];
  window.editor.setViewportShading(current.value.key);
}

onMounted(() => {
  useAddSignal("editorCleared",editorCleared);
})
onBeforeUnmount(() => {
  useRemoveSignal("editorCleared",editorCleared);
})
</script>

<style lang="less" scoped>
.n-radio-group{
  padding: 5px 0;
  .n-radio{
    display: flex;
    align-items: center;
    padding: 5px 10px;

    &:hover{
      background-color: var(--n-divider-color);
    }

    :deep(.n-radio__label){
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 180px;

      & > span{
        font-size: 12px;
        color: var(--n-text-color-disabled);
      }
    }
  }
}

</style>