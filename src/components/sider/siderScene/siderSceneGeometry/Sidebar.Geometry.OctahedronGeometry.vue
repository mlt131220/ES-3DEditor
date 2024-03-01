<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {OctahedronGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  radius: 1.00,
  detail: 0
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new OctahedronGeometry(
      objectData.radius,
      objectData.detail
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

    <!--  detail  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Facet segments']") }}</span>

      <EsInputNumber v-model:value="objectData.detail" class="!w-90px" size="small" :decimal="0" :min="0"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>
  </div>
</template>