<script lang="ts" setup>
import {inject, ref, onMounted, onUnmounted} from "vue";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import type {Material} from "three";
import {Color} from "three";
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import {SetMaterialColorCommand} from '@/core/commands/SetMaterialColorCommand';
import {SetMaterialValueCommand} from '@/core/commands/SetMaterialValueCommand';
import {t} from "@/language";

const props = withDefaults(defineProps<{
  property: string,
  name: string
}>(), {
  property: "",
  name: ""
})

const show = ref(false);
const color = ref<string>("");
const intensity = ref(0);
let object: { material: Material };
let material: Material;
let currentMaterialSlot = 0;

onMounted(() => {
  useAddSignal("objectSelected", handleObjectSelected);
  useAddSignal("materialChanged", update);
  useAddSignal("materialCurrentSlotChange", currentSlotChange);
})

onUnmounted(() => {
  useRemoveSignal("objectSelected", handleObjectSelected);
  useRemoveSignal("materialChanged", update);
  useRemoveSignal("materialCurrentSlotChange", currentSlotChange)
})

function currentSlotChange(currentSlot) {
  currentMaterialSlot = currentSlot;
  update();
}

function handleObjectSelected(selected) {
  object = selected;
  update();
}

function update() {
  if (object === null || object.material === undefined) return;

  material = window.editor.getObjectMaterial(object, currentMaterialSlot);

  if (props.property in material) {
    color.value = material[props.property].getStyle();
    if (intensity !== undefined) {
      intensity.value = material[`${props.property}Intensity`];
    }
    show.value = true;
  } else {
    show.value = false;
  }
}

function onChange() {
  const newColor = new Color(color.value).getHex();
  if (material[props.property].getHex() !== newColor) {
    window.editor.execute(new SetMaterialColorCommand(object, props.property, newColor, currentMaterialSlot));
  }

  if (intensity !== undefined) {
    if (material[`${props.property}Intensity`] !== intensity.value) {
      window.editor.execute(new SetMaterialValueCommand(object, `${props.property}Intensity`, intensity.value, currentMaterialSlot));
    }
  }
}

</script>

<template>
  <div id="sider-scene-material-color-property" v-if="show">
    <span>{{ t(`layout.sider.material.${name}`) }}</span>
    <div>
      <n-color-picker v-model:value="color" :show-alpha="false" size="small" @update:value="onChange()"/>
      <EsInputNumber v-if="property === 'emissive'" v-model:value="intensity" size="tiny" :show-button="false" @change="onChange()"/>
    </div>
  </div>
</template>

<style lang="less" scoped>
#sider-scene-material-color-property {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  align-items: center;

  & > span {
    min-width: 80px;
  }

  & > div {
    width: 150px;
    color: rgb(165, 164, 164);
  }
}
</style>
