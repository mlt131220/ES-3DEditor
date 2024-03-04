<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {RingGeometry,MathUtils} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  innerRadius: 0.50,
  outerRadius: 1.00,
  thetaSegments:32,
  phiSegments:1,
  thetaStart:0,
  thetaLength:1
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key];
  })
  objectData.thetaStart *= MathUtils.RAD2DEG;
  objectData.thetaLength *= MathUtils.RAD2DEG;
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new RingGeometry(
      objectData.innerRadius,
      objectData.outerRadius,
      objectData.thetaSegments,
      objectData.phiSegments,
      objectData.thetaStart * MathUtils.DEG2RAD,
      objectData.thetaLength * MathUtils.DEG2RAD,
  )))
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  innerRadius  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Inner radius']") }}</span>

      <EsInputNumber v-model:value="objectData.innerRadius" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  outerRadius  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Outer radius']") }}</span>

      <EsInputNumber v-model:value="objectData.outerRadius" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  thetaSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Theta segments']") }}</span>

      <EsInputNumber v-model:value="objectData.thetaSegments" class="!w-90px" size="small" :decimal="0" :min="3"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  phiSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Phi segments']") }}</span>

      <EsInputNumber v-model:value="objectData.phiSegments" class="!w-90px" size="small" :decimal="0" :min="3"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  thetaStart  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Theta start']") }}</span>

      <EsInputNumber v-model:value="objectData.thetaStart" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>

    <!--  thetaLength  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Theta length']") }}</span>

      <EsInputNumber v-model:value="objectData.thetaLength" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" :bordered="false" @change="update()"/>
    </div>
  </div>
</template>