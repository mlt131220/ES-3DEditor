<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {CapsuleGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  radius: 1.00,
  length: 1.00,
  capSegments:4.00,
  radialSegments:8,
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new CapsuleGeometry(
      objectData.radius,
      objectData.length,
      objectData.capSegments,
      objectData.radialSegments
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

    <!--  length  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Length") }}</span>

      <EsInputNumber v-model:value="objectData.length" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  Cap Seg  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Cap segments']") }}</span>

      <EsInputNumber v-model:value="objectData.capSegments" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  Cap Seg  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Radial segments']") }}</span>

      <EsInputNumber v-model:value="objectData.radialSegments" class="!w-90px" size="small" :decimal="0"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>
  </div>
</template>