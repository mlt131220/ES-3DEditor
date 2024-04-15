<script setup lang="ts">
import {h,ref} from "vue";
import { NIcon, NTooltip } from "naive-ui";
import {ChessBoard,GlobeAsia,Uncharted,Delicious,DrawPolygon,ImageRegular} from "@vicons/fa";
import {Script,Draw} from "@vicons/carbon";

import {t} from "@/language";
import SidebarRender from "@/components/sidebar/SidebarRender.vue";
import SidebarScene from "@/components/sidebar/SidebarScene.vue";
import SidebarObject from "@/components/sidebar/SidebarObject.vue";
import SidebarGeometry from "@/components/sidebar/SidebarGeometry.vue";
import SidebarMaterial from "@/components/sidebar/SidebarMaterial.vue";
import SidebarAnimations from "@/components/sidebar/SidebarAnimations.vue";
import SidebarScript from "@/components/sidebar/SidebarScript.vue";
import SidebarDrawing from "@/components/sidebar/SidebarDrawing.vue";

const data = ref([
  {name:"render",icon:{text:'Renderer config',component:ChessBoard},component:SidebarRender},
  {name:"scene",icon:{text:'Scene config',component:GlobeAsia},component:SidebarScene},
  {name:"object",icon:{text:'Object',component:Uncharted},component:SidebarObject},
  {name:"geometry",icon:{text:'Geometry',component:DrawPolygon},component:SidebarGeometry},
  {name:"material",icon:{text:'Material',component:Delicious},component:SidebarMaterial},
  {name:"animations",icon:{text:'Animations',component:Draw},component:SidebarAnimations},
  {name:"script",icon:{text:'Script',component:Script},component:SidebarScript},
  {name:"drawing",icon:{text:'Drawing',component:ImageRegular},component:SidebarDrawing},
])

function iconTabName(text:string,icon:any){
  return h(NTooltip,{
    placement:"left"
  }, {
    default:() => t(`layout.sider["${text}"]`),
    trigger:() => h(NIcon, {size:14}, h(icon)),
  })
}
</script>

<template>
  <n-tabs default-value="scene" type="line" size="small" pane-class="!p-10px overflow-y-auto"
          placement="left">
    <n-tab-pane v-for="t in data" :key="t.name" :name="t.name" :tab="iconTabName(t.icon.text,t.icon.component)" display-directive="show">
      <component :is="t.component" />
    </n-tab-pane>
  </n-tabs>
</template>

<style lang="less" scoped>
.n-tabs{
  height: calc(100vh - 2.1rem - 2.2rem);
}
</style>
