<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click" :style="{padding: 0}">
    <template #trigger>
      <n-button round size="small">
        <template #icon>
          <n-icon>
            <component :is="current.icon" />
          </n-icon>
        </template>
        {{ current.label }}
      </n-button>
    </template>
    <n-radio-group v-model:value="current.uuid" size="small">
      <template v-for="song in options" :key="song.uuid">
        <n-radio :value="song.uuid" v-if="song.type!== 'divider'" @click="handlerChange(song)">
          <div class="flex items-center">
            <n-icon class="ml-10px mr-5px">
              <component :is="song.icon" />
            </n-icon>
            <span>{{ song.label }}</span>
          </div>

          <span>{{song.shortcuts}}</span>
        </n-radio>
        <n-divider title-placement="left" v-else> {{ song.label }} </n-divider>
      </template>
      <template v-for="song in sceneCamera" :key="song.uuid">
        <n-radio :value="song.uuid" v-if="song.type!== 'divider'" @click="handlerChange(song)">
          <div class="flex items-center">
            <n-icon class="ml-10px mr-5px">
              <component :is="song.icon" />
            </n-icon>
            <span>{{ song.label }}</span>
          </div>

          <span>{{song.shortcuts}}</span>
        </n-radio>
        <n-divider title-placement="left" v-else> {{ song.label }} </n-divider>
      </template>
    </n-radio-group>
  </n-popover>
</template>

<script lang="ts" setup>
import type {ComputedRef} from "vue";
import {ref, onMounted, onBeforeUnmount} from "vue";
import {Camera,Object3D} from "three";
import {
  OpenPanelFilledTop,
  OpenPanelFilledBottom,
  OpenPanelFilledLeft,
  OpenPanelFilledRight,
  RotateCounterclockwiseAlt,
  RotateClockwiseAlt,
  Carbon3DMprToggle,CenterToFit
} from '@vicons/carbon';
import {useAddSignal,useRemoveSignal} from '@/hooks/useSignal';
import {cpt} from "@/language";

interface IOption {
  label: ComputedRef<string> | string,
  uuid: string,
  type?: string,
  icon?: any,
  shortcuts?: string,
  children?: IOption[]
}

const defaultCamera = [
  {
    uuid:"divider",
    type:"divider",
    label:cpt("layout.header.OrthographicCamera")
  },
  {
    uuid: "Top",
    label: cpt("layout.scene.toolbar.Top"),
    icon:OpenPanelFilledTop,
    shortcuts:"ALT+J"
  },
  {
    uuid: "Bottom",
    label: cpt("layout.scene.toolbar.Bottom"),
    icon:OpenPanelFilledBottom,
    shortcuts:"ALT+SHIFT+J"
  },
  {
    uuid: "Left",
    label: cpt("layout.scene.toolbar.Left"),
    icon:OpenPanelFilledLeft,
    shortcuts:"ALT+K"
  },
  {
    uuid: "Right",
    label: cpt("layout.scene.toolbar.Right"),
    icon:OpenPanelFilledRight,
    shortcuts:"ALT+SHIFT+K"
  },
  {
    uuid: "Front",
    label: cpt("layout.scene.toolbar.Front"),
    icon:RotateCounterclockwiseAlt,
    shortcuts:"ALT+H"
  },
  {
    uuid: "Back",
    label: cpt("layout.scene.toolbar.Back"),
    icon:RotateClockwiseAlt,
    shortcuts:"ALT+SHIFT+H"
  }
]

const current = ref<IOption>({
  label: "",
  uuid: ""
});
const options = ref<IOption[]>()
const sceneCamera = ref<IOption[]>();

function handlerChange(value: IOption) {
  current.value = value;
  window.editor.setViewportCamera(current.value.uuid);
}

function handlerOptionsUpdate() {
  options.value = [];
  sceneCamera.value = [];

  const cameras = window.editor.cameras;
  for (const key in cameras) {
    const camera = cameras[key];
    if(camera.uuid === window.editor.camera.uuid){
      // 默认透视相机
      options.value.unshift({
        uuid: window.editor.camera.uuid,
        label: cpt("layout.header.PerspectiveCamera"),
        icon:Carbon3DMprToggle,
        shortcuts:"ALT+G"
      })
      continue;
    }

    // 场景相机
    sceneCamera.value.push({
      uuid: camera.uuid,
      label: camera.name,
      icon:camera.type === "PerspectiveCamera" ? Carbon3DMprToggle : CenterToFit,
      shortcuts:""
    })
  }

  options.value.push(...defaultCamera);

  if(sceneCamera.value.length > 0){
    sceneCamera.value.unshift({
      uuid:"divider2",
      type:"divider",
      label:cpt("layout.scene.toolbar['Scene camera']")
    })
  }

  !current.value.uuid && (current.value = options.value[0]);
}

function objectChanged(object:Object3D) {
  if(object instanceof Camera){
    handlerOptionsUpdate();
  }
}

onMounted(() => {
  useAddSignal("cameraAdded", handlerOptionsUpdate);
  useAddSignal("cameraRemoved", handlerOptionsUpdate);
  useAddSignal("objectChanged",objectChanged );

  handlerOptionsUpdate();
})
onBeforeUnmount(() => {
  useRemoveSignal("cameraAdded", handlerOptionsUpdate);
  useRemoveSignal("cameraRemoved", handlerOptionsUpdate);
  useRemoveSignal("objectChanged",objectChanged);
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

  .n-divider{
    margin: 10px 0;

    :deep(.n-divider__title){
      font-size: 12px;
      font-weight: 400;
      color: #999;
    }
  }
}

</style>