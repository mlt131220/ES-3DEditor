<template>
  <n-tabs v-model:value="currentNav" type='line' size="small" justify-content="space-around"
          class="h-full" pane-class="h-full overflow-y-auto">
    <n-tab-pane
        v-for="panel in nav" :key="panel.key" :name="panel.key"
        display-directive="show">
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
import {CubeOutline,SunnyOutline,VideocamOutline,CloudOutline} from "@vicons/ionicons5";
import {Delicious} from "@vicons/fa";
import {cpt} from "@/language";
import Object3d from "./assetsLibrary/Object3d.vue";
import Lights from "./assetsLibrary/Lights.vue";
import Cameras from "./assetsLibrary/Cameras.vue";
import Material from "./assetsLibrary/Material.vue";


const currentNav = ref("object3d");
const nav = ref([
  {key:"object3d",name:cpt("layout.header.Object3D"),icon:CubeOutline,component:Object3d},
  {key:"light",name:cpt("layout.header.Light"),icon:SunnyOutline,component:Lights},
  {key:"camera",name:cpt("layout.header.Camera"),icon:VideocamOutline,component:Cameras},
  {key:"material",name:cpt("layout.sider.Material"),icon:Delicious,component:Material},
  // {key:"model-library",name:"云端模型库",icon:CloudOutline,component:""}
])
</script>

<style scoped>

</style>
