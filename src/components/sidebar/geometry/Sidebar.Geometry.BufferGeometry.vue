<script lang="ts" setup>
import {ref, reactive, onMounted, onBeforeUnmount} from "vue";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import {t} from "@/language";

const isBufferGeometry = ref(false);
const hasMorphTargets = ref(false);
const objectData = reactive<any>({
  index: null,
  attributes: {},
  morphAttributes: {},
  morphTargetsRelative: false
})

onMounted(() => {
  useAddSignal("objectSelected", updateRows)
  useAddSignal("geometryChanged", updateRows)
})
onBeforeUnmount(() => {
  useRemoveSignal("objectSelected", updateRows)
  useRemoveSignal("geometryChanged", updateRows)
})

async function updateRows(object) {
  if (object === null || object === undefined) return;

  const geometry = object.geometry;
  if (geometry && geometry.isBufferGeometry) {
    isBufferGeometry.value = true;

    const index = geometry.index;
    if (index !== null) {
      objectData.index = (index.count).format();
    }

    objectData.attributes = geometry.attributes;

    // morph targets
    objectData.morphAttributes = geometry.morphAttributes;
    hasMorphTargets.value = Object.keys(objectData.morphAttributes).length > 0;

    // morph relative
    objectData.morphTargetsRelative = geometry.morphTargetsRelative;
  } else {
    isBufferGeometry.value = false;
  }
}
</script>

<template>
  <div v-if="isBufferGeometry">
    <n-divider/>

    <!-- attributes -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.geometry.attributes") }}</span>
      <div>
        <div v-if="objectData.index !== null" class="flex justify-between pr-6">
          <span>{{ t("layout.sider.geometry.index") }}</span>
          <span>{{ objectData.index }}</span>
        </div>
        <div v-for="name in Object.keys(objectData.attributes)" :key="name" class="flex justify-between pr-6">
          <span>{{ name }}</span>
          <span>{{ `${(objectData.attributes[name].count).format()}(${objectData.attributes[name].itemSize})` }}</span>
        </div>
      </div>
    </div>
    <!-- morph attributes -->
    <div class="sider-scene-geometry-item" v-if="hasMorphTargets">
      <span>Morph Attributes</span>
      <div>
        <div v-for="name in Object.keys(objectData.morphAttributes)" :key="name">
          <span>{{ name }}</span>
          <span>{{ (objectData.morphAttributes[name].length).format() }}</span>
        </div>
      </div>
    </div>
    <!-- morph relative -->
    <div class="sider-scene-geometry-item" v-if="hasMorphTargets">
      <span>Morph Relative</span>
      <div>
        <n-checkbox v-model:checked="objectData.morphTargetsRelative" disabled/>
      </div>
    </div>
  </div>
</template>
