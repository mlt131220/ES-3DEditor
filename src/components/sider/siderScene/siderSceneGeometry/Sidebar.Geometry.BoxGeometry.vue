<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {BoxGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  width: 0,
  height: 0,
  depth: 0,
  widthSegments: 0,
  heightSegments: 0,
  depthSegments: 0
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new BoxGeometry(
      objectData.width,
      objectData.height,
      objectData.depth,
      objectData.widthSegments,
      objectData.heightSegments,
      objectData.depthSegments
  )))
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  width  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Width") }}</span>

      <EsInputNumber v-model:value="objectData.width" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  height  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Height") }}</span>

      <EsInputNumber v-model:value="objectData.height" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  depth  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Depth") }}</span>

      <EsInputNumber v-model:value="objectData.depth" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  widthSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Width segments']") }}</span>

      <EsInputNumber v-model:value="objectData.widthSegments" class="!w-90px" size="small" :min="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  heightSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Height segments']") }}</span>

      <EsInputNumber v-model:value="objectData.heightSegments" class="!w-90px" size="small" :min="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  depthSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Depth segments']") }}</span>

      <EsInputNumber v-model:value="objectData.depthSegments" class="!w-90px" size="small" :min="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>
  </div>
</template>