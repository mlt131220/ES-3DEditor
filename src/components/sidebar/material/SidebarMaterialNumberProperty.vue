<script lang="ts" setup>
import {inject, ref, onMounted, onUnmounted} from "vue";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import type {Material} from "three";
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import {SetMaterialValueCommand} from '@/core/commands/SetMaterialValueCommand';
import {t} from "@/language";

const props = withDefaults(defineProps<{
  property: string,
  name: string,
  range: Array<number>,
  decimal: number
}>(), {
  property: "",
  name: "",
  //@ts-ignore
  range: [-Infinity, Infinity],
  decimal: 0
})

const show = ref(false);
const numberValue = ref();
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
    numberValue.value = material[props.property];
    show.value = true;
  } else {
    show.value = false;
  }
}

function onChange() {
  if (material[props.property] !== numberValue.value) {
    window.editor.execute(new SetMaterialValueCommand(object, props.property, numberValue.value, currentMaterialSlot));
  }
}
</script>

<template>
  <div id="sider-scene-material-color-property" v-if="show">
    <span>{{ t(`layout.sider.material.${name}`) }}</span>
    <div>
      <EsInputNumber v-model:value="numberValue" size="tiny" :show-button="false" :min="range[0]" :max="range[1]"
                     :decimal="decimal" @change="onChange"/>
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
     min-width:80px;
  }

  & > div {
    width: 150px;
    color: rgb(165, 164, 164);
  }
}
</style>
