<script setup lang="ts">
import {reactive, onMounted} from "vue";
import {ExtrudeGeometry,ShapeGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let options = reactive({
  curveSegments: 12,
  steps:1,
  depth:100,
  bevelEnabled:true,
  bevelThickness:6,
  bevelSize:4,
  bevelOffset: 0,
  bevelSegments:3
});
let shapes;

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  shapes = parameters.shapes;
  options = parameters.options;
  options.curveSegments = options.curveSegments != undefined ? options.curveSegments : 12;
  options.steps = options.steps != undefined ? options.steps : 1;
  options.depth = options.depth != undefined ? options.depth : 100;
  options.bevelThickness = options.bevelThickness !== undefined ? options.bevelThickness : 6;
  options.bevelSize = options.bevelSize !== undefined ? options.bevelSize : 4;
  options.bevelOffset = options.bevelOffset !== undefined ? options.bevelOffset : 0;
  options.bevelSegments = options.bevelSegments !== undefined ? options.bevelSegments : 3;
})

function toShape(){
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new ShapeGeometry(
      shapes, options.curveSegments
  )))
}

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new ExtrudeGeometry(
      shapes,
      {
        curveSegments: options.curveSegments,
        steps: options.steps,
        depth: options.depth,
        bevelEnabled: options.bevelEnabled,
        bevelThickness: options.bevelThickness,
        bevelSize: options.bevelSize !== undefined ? options.bevelSize : options.bevelSize,
        bevelOffset: options.bevelOffset !== undefined ? options.bevelOffset : options.bevelOffset,
        bevelSegments: options.bevelSegments !== undefined ? options.bevelSegments : options.bevelSegments
      }
  )))
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  curveSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Curve Segments']") }}</span>

      <EsInputNumber v-model:value="options.curveSegments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  steps  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Steps") }}</span>

      <EsInputNumber v-model:value="options.steps" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  depth  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Depth") }}</span>

      <EsInputNumber v-model:value="options.depth" class="!w-90px" size="small" :decimal="2" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  enabled  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Enabled bevel']") }}</span>

      <n-checkbox size="small" v-model:checked="options.bevelEnabled" @update:checked="update" />
    </div>

    <template v-if="options.bevelEnabled">
      <!--  thickness  -->
      <div class="sider-scene-geometry-item">
        <span>{{ t("layout.sider.scene['Bevel thickness']") }}</span>

        <EsInputNumber v-model:value="options.bevelThickness" class="!w-90px" size="small" :decimal="2"
                       :show-button="false" @change="update"/>
      </div>

      <!--  size  -->
      <div class="sider-scene-geometry-item">
        <span>{{ t("layout.sider.scene['Bevel size']") }}</span>

        <EsInputNumber v-model:value="options.bevelSize" class="!w-90px" size="small" :decimal="2"
                       :show-button="false" @change="update"/>
      </div>

      <!--  offset  -->
      <div class="sider-scene-geometry-item">
        <span>{{ t("layout.sider.scene['Bevel offset']") }}</span>

        <EsInputNumber v-model:value="options.bevelOffset" class="!w-90px" size="small" :decimal="2"
                       :show-button="false" @change="update"/>
      </div>

      <!--  segments  -->
      <div class="sider-scene-geometry-item">
        <span>{{ t("layout.sider.scene['Bevel segments']") }}</span>

        <EsInputNumber v-model:value="options.bevelSegments" class="!w-90px" size="small" :decimal="2" :min="0"
                       :show-button="false" @change="update"/>
      </div>

      <!--  Convert to Shape  -->
      <div class="sider-scene-geometry-item text-center">
        <n-button @click="toShape">{{ t("layout.sider.scene['Convert to Shape']") }}</n-button>
      </div>
    </template>
  </div>
</template>