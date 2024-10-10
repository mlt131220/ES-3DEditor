<script setup lang="ts">
import {h,ref} from "vue";
import { NIcon, NTooltip } from "naive-ui";
import {ChessBoard,GlobeAsia,Uncharted,Delicious,DrawPolygon,ImageRegular} from "@vicons/fa";
import {ResultOld,Script,Draw,JoinOuter} from "@vicons/carbon";

import {t} from "@/language";
import SidebarRender from "@/components/sidebar/SidebarRender.vue";
import SidebarScene from "@/components/sidebar/SidebarScene.vue";
import SidebarHistory from "@/components/sidebar/SidebarHistory.vue";
import SidebarObject from "@/components/sidebar/SidebarObject.vue";
import SidebarGeometry from "@/components/sidebar/SidebarGeometry.vue";
import SidebarMaterial from "@/components/sidebar/SidebarMaterial.vue";
// import SidebarSceneTheme from "@/components/sidebar/SidebarSceneTheme.vue";
import SidebarAnimations from "@/components/sidebar/SidebarAnimations.vue";
import SidebarScript from "@/components/sidebar/SidebarScript.vue";
import SidebarDrawing from "@/components/sidebar/SidebarDrawing.vue";

const data = ref([
  {name:"render",icon:{text:'Renderer config',component:ChessBoard},component:SidebarRender},
  {name:"scene",icon:{text:'Scene config',component:GlobeAsia},component:SidebarScene},
  // {name:"styles",icon:{text:'Scene theme',component:JoinOuter},component:SidebarSceneTheme},
  {name:"history",icon:{text:'History',component:ResultOld},component:SidebarHistory},
  {name:"drawing",icon:{text:'Scene drawing',component:ImageRegular},component:SidebarDrawing},
  // 以下为动态项
  {name:"object",icon:{text:'Object',component:Uncharted},component:SidebarObject},
  {name:"geometry",icon:{text:'Geometry',component:DrawPolygon},component:SidebarGeometry},
  {name:"material",icon:{text:'Material',component:Delicious},component:SidebarMaterial},
  {name:"animations",icon:{text:'Animations',component:Draw},component:SidebarAnimations},
  {name:"script",icon:{text:'Script',component:Script},component:SidebarScript},
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
  <n-tabs default-value="scene" type="line" size="small" pane-class="!p-10px overflow-y-auto" id="sidebar-attributes"
          placement="left">
    <n-tab-pane v-for="t in data" :key="t.name" :name="t.name" :tab="iconTabName(t.icon.text,t.icon.component)" display-directive="show" :disabled="t.name === 'disabled'">
      <component :is="t.component" />
    </n-tab-pane>
  </n-tabs>
</template>

<style lang="less" scoped>
.n-tabs{
  height: calc(100vh - var(--header-height) - var(--footer-height));

  // 配置按功能类型（常驻/动态） 分割
  :deep(.n-tabs-wrapper){
    .n-tabs-tab-wrapper:nth-child(6){
      margin-top: 10px;
      border-top: 1px solid var(--n-tab-border-color);
    }
  }
}
</style>
