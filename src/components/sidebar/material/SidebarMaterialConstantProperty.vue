<script lang="ts" setup>
import {inject, ref, onMounted, onUnmounted} from "vue";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import type {Material} from "three";
import {SetMaterialValueCommand} from '@/core/commands/SetMaterialValueCommand';
import {t} from "@/language";

const props = withDefaults(defineProps<{
  property: string,
  name: string,
  options: Array<{ label: string, value: any }>
}>(), {
  property: "",
  name: "",
})

const show = ref(false);
const value = ref();
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
    value.value = material[props.property];
    show.value = true;
  } else {
    show.value = false;
  }
}

function onChange() {
  if (material[props.property] !== value.value) {
    window.editor.execute(new SetMaterialValueCommand(object, props.property, value.value, currentMaterialSlot));
  }
}
</script>

<template>
  <div class="sider-scene-material-constant-property" v-if="show">
    <span>{{ t(`layout.sider.material.${name}`) }}</span>
    <div>
      <n-select size="small" v-model:value="value" :options="options" @update:value="onChange"/>
    </div>
  </div>
</template>

<style lang="less" scoped>
.sider-scene-material-constant-property {
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
