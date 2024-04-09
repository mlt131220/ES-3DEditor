<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {TorusKnotGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  radius: 1.00,
  tube: 0.40,
  radialSegments:12,
  tubularSegments:48,
  p:2.00,
  q:3.00
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new TorusKnotGeometry(
      objectData.radius,
      objectData.tube,
      objectData.tubularSegments,
      objectData.radialSegments,
      objectData.p,
      objectData.q
  )))
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  radius  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Radius") }}</span>

      <EsInputNumber v-model:value="objectData.radius" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  tube  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Tube") }}</span>

      <EsInputNumber v-model:value="objectData.tube" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  radialSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Radial segments']") }}</span>

      <EsInputNumber v-model:value="objectData.radialSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!-- tubularSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Tubular segments']") }}</span>

      <EsInputNumber v-model:value="objectData.tubularSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!-- p  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.P") }}</span>

      <EsInputNumber v-model:value="objectData.p" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>

    <!-- q  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Q") }}</span>

      <EsInputNumber v-model:value="objectData.q" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>
  </div>
</template>