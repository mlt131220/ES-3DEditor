<template>
  <div class="es-input flex items-center w-full">
    <label v-if="label">{{ label }}</label>
    <div v-if="defaultNoBorder && noFocus" @click="handleClickText" class="w-full">{{value}}</div>
    <n-input v-else ref="inRef" :value="value" @input="handleInput" @change="handleChange" @blur="noFocus = true" type="text" v-bind="attrs" />
  </div>
</template>

<script setup lang="ts">
import {useAttrs,ref,nextTick} from "vue";

let props = withDefaults(defineProps<{
  value: string,
  label: string,
  defaultNoBorder: boolean,
}>(), {
  value: '',
  label: '',
  defaultNoBorder: false
})
const emits = defineEmits(["update:value","change"])

const attrs = useAttrs();
const inRef = ref();
const noFocus = ref(true);

async function handleClickText(){
  noFocus.value = false;
  await nextTick();
  inRef.value.focus();
}

function handleInput(value: string) {
  emits("update:value", value);
}

function handleChange(value: string) {
  emits("change", value);
}
</script>

<style scoped lang="less">

</style>