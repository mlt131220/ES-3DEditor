<template>
  <div class="w-full h-full overflow-y-auto">
    <n-card v-for="item in themeList" :key="item.key" @click="handleStyleChange(item)" hoverable>
      <template #cover>
        <img :src="item.img">
        <h4>{{item.name}}</h4>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {t,cpt} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";
import Script from "@/components/code/Script.vue";
import {reBufferGeometryUv} from "@/utils/common/scenes";
import {BlueTone} from "@/core/sceneTheme/BlueTone";

const themeList = ref([
  {key:"BlueGradient",name:cpt("layout.sider.sceneTheme.Blue tone"),img:"/static/images/modelStyle/BlueGradient.png",theme:BlueTone}
]);

// 切换场景主题
function handleStyleChange(item) {
  // 先透明度，再颜色，最后材质
  window.editor.scene.traverse(child => {
    if (child.isMesh) {
      // 平铺uv
      reBufferGeometryUv(child.geometry);

      const newMesh = item.theme(child);
      newMesh.name = child.name;
      // 矩阵保持不变
      newMesh.matrix.copy(child.matrix);
      newMesh.matrixAutoUpdate = child.matrixAutoUpdate;
      newMesh.matrixWorld.copy(child.matrixWorld);
      newMesh.matrixAutoUpdate = child.matrixAutoUpdate;
      newMesh.updateMatrixWorld(true);

      window.editor.addObject(newMesh,child.parent,child.parent.children.indexOf(child));
      window.editor.removeObject(child);
    }
  });

  useDispatchSignal("sceneGraphChanged")
}
</script>

<style scoped lang="less">
.n-card {
  height:130px;
  overflow-y:hidden;
  position:relative;
  cursor:pointer;

  :deep(&-cover){
    h4{
      font-size: 18px;
      color: #fff;
      position: absolute;
      bottom:0px;
      left: 10px;
    }
  }
}
</style>