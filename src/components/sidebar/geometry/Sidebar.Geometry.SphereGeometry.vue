<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {SphereGeometry,MathUtils} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let objectData = reactive({
  radius: 1.00,
  widthSegments: 32,
  heightSegments:16,
  phiStart:0,
  phiLength:1,
  thetaStart:0,
  thetaLength:0.5,
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
  objectData.phiStart *= MathUtils.RAD2DEG;
  objectData.phiLength *= MathUtils.RAD2DEG;
  objectData.thetaStart *= MathUtils.RAD2DEG;
  objectData.thetaLength *= MathUtils.RAD2DEG;
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new SphereGeometry(
      objectData.radius,
      objectData.widthSegments,
      objectData.heightSegments,
      objectData.phiStart * MathUtils.DEG2RAD,
      objectData.phiLength * MathUtils.DEG2RAD,
      objectData.thetaStart * MathUtils.DEG2RAD,
      objectData.thetaLength * MathUtils.DEG2RAD,
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

    <!--  widthSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Width segments']") }}</span>

      <EsInputNumber v-model:value="objectData.widthSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  heightSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Height segments']") }}</span>

      <EsInputNumber v-model:value="objectData.heightSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  phiStart  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Phi start']") }}</span>

      <EsInputNumber v-model:value="objectData.phiStart" class="!w-90px" size="small" :decimal="1"
                     :show-button="false"  @change="update()"/>
    </div>

    <!--  phiLength  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Phi length']") }}</span>

      <EsInputNumber v-model:value="objectData.phiLength" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  thetaStart  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Theta start']") }}</span>

      <EsInputNumber v-model:value="objectData.thetaStart" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  thetaLength  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Theta length']") }}</span>

      <EsInputNumber v-model:value="objectData.thetaLength" class="!w-90px" size="small" :decimal="1"
                     :show-button="false" @change="update()"/>
    </div>
  </div>
</template>