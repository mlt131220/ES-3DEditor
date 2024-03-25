<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {TorusGeometry,MathUtils} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  radius: 1.00,
  tube: 0.40,
  radialSegments:12,
  tubularSegments:48,
  arc:Math.PI * 2
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
  objectData.arc *= MathUtils.RAD2DEG;
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new TorusGeometry(
      objectData.radius,
      objectData.tube,
      objectData.radialSegments,
      objectData.tubularSegments,
      objectData.arc * MathUtils.DEG2RAD,
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
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  tube  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Tube") }}</span>

      <EsInputNumber v-model:value="objectData.tube" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  radialSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Radial segments']") }}</span>

      <EsInputNumber v-model:value="objectData.radialSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!-- tubularSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Tubular segments']") }}</span>

      <EsInputNumber v-model:value="objectData.tubularSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!-- arc  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Arc") }}</span>

      <EsInputNumber v-model:value="objectData.arc" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>
  </div>
</template>