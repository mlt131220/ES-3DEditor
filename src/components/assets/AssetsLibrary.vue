<template>
  <n-tabs v-model:value="currentNav" type='line' size="small" justify-content="space-around">
    <n-tab-pane
        v-for="panel in nav" :key="panel.key"
        :name="panel.key"
        display-directive="show"
    >
      <template #tab>
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <n-icon size="18" class="px-1">
              <component :is="panel.icon"></component>
            </n-icon>
          </template>
          {{ panel.name }}
        </n-tooltip>
      </template>
      <component :is="panel.component"></component>
    </n-tab-pane>
  </n-tabs>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {CubeOutline,SunnyOutline,VideocamOutline,CloudOutline,ImageOutline} from "@vicons/ionicons5";
import Object3d from "./assetsLibrary/Object3d.vue";
import Lights from "./assetsLibrary/Lights.vue";
import Cameras from "./assetsLibrary/Cameras.vue";

const currentNav = ref("object3d");
const nav = ref([
  {key:"object3d",name:"3D对象",icon:CubeOutline,component:Object3d},
  {key:"light",name:"灯光",icon:SunnyOutline,component:Lights},
  {key:"camera",name:"相机",icon:VideocamOutline,component:Cameras},
  {key:"texture",name:"贴图",icon:ImageOutline,component:""},
  {key:"model-library",name:"云端模型库",icon:CloudOutline,component:""}
])
</script>

<style scoped>

</style>
