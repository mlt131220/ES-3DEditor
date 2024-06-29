<template>
  <div id="assets-library-material">
    <div class="cards">
      <n-card size="small" hoverable v-for="item in materialList" :key="item.key" @click="addToScene(item)">
        <template #cover>
          <img :src="item.img" :alt="item.key" draggable="false" />
        </template>
        <p @click.stop="handlePreview(item)"> 预览 </p>
      </n-card>
    </div>

    <MaterialPreview v-model:show="showPreview" :material="previewMaterial" @updatePreview="previewMaterialUpdate" />
  </div>
</template>

<script lang="ts" setup>
import {ref,toRaw} from "vue";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";
import {reBufferGeometryUv, setMetaData} from "@/utils/common/scenes";
import MaterialPreview from "@/components/three/MaterialPreview.vue";
import {CircleGridShaderMaterial} from "@/core/shaderMaterial/modules/CircleGridShaderMaterial";
import {DynamicCheckerboardShaderMaterial} from "@/core/shaderMaterial/modules/DynamicCheckerboardShaderMaterial";
import {SlowSmokeShaderMaterial} from "@/core/shaderMaterial/modules/SlowSmokeShaderMaterial";
import {FlickerShaderMaterial} from "@/core/shaderMaterial/modules/FlickerShaderMaterial";
import {StreamerWallShaderMaterial} from "@/core/shaderMaterial/modules/StreamerWallShaderMaterial";

const materialList = [//配图使用平行光灯光颜色 rgb(35,49,221)
  {key:"CircleGridShaderMaterial",img:"/static/images/assetsLibrary/material/CircleGrid.jpg",class:CircleGridShaderMaterial},
  {key:"DynamicCheckerboardShaderMaterial",img:"/static/images/assetsLibrary/material/DynamicCheckerboard.png",class:DynamicCheckerboardShaderMaterial},
  {key:"SlowSmokeShaderMaterial",img:"/static/images/assetsLibrary/material/SlowSmoke.png",class:SlowSmokeShaderMaterial},
  {key:"StreamerWallShaderMaterial",img:"/static/images/assetsLibrary/material/StreamerWall.png",class:StreamerWallShaderMaterial},
  {key:"FlickerShaderMaterial",img:"/static/images/assetsLibrary/material/Flicker.png",class:FlickerShaderMaterial},
];

const showPreview = ref(false);
const previewMaterial = ref();
let previewMaterialUpdate = () => {};
function handlePreview(item){
  previewMaterial.value = item.class.PreviewMaterial;
  const toRawMaterial = toRaw(previewMaterial.value);
  previewMaterialUpdate = () => item.class.UpdatePreview(toRawMaterial);

  showPreview.value = true;
}

function addToScene(item){
  const object = window.editor.selected;
  if(object && object.material){
    if(Array.isArray(object.material)){
      if(object.material.length === 0){
        window.$message?.error(t("prompt['No object selected.']"))
        return;
      }

      setMetaData(object,"material",object.material.map(m => m.uuid))
      object.material = item.class.Material;
      // 平铺uv
      reBufferGeometryUv(object.geometry);
      useDispatchSignal("materialChanged",object.material);
      useDispatchSignal("sceneGraphChanged");

      return;
    }

    setMetaData(object,"material",object.material.uuid)
    object.material = item.class.Material;
    // 平铺uv
    reBufferGeometryUv(object.geometry);
    useDispatchSignal("materialChanged",object.material);
    useDispatchSignal("sceneGraphChanged");
    return;
  }

  window.$message?.error(t("prompt['No object selected.']"))
}
</script>

<style scoped lang="less">
#assets-library-material{
  overflow-x: hidden;

  .cards{
    padding: 0 10px 10px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px 8px;
  }

  .n-card{
    cursor:pointer;

    .n-image {
      display: block;
    }

    :deep(.n-card-cover) {
      img {
        height: 85px;
      }
    }

    :deep(.n-card__content){
      padding: 3px 0;
      font-size: 13px;
      text-align: center;
    }
  }
}
</style>
