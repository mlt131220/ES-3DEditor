<template>
  <n-input-number ref="inRef" v-model:value="esNumber" :step="step" :min="min" :max="max" v-bind="attrs"
                  @update:value="handlerChange" @mousedown.stop="onMouseDown">
    <template #suffix v-if="unit !== null">{{ unit }}</template>
  </n-input-number>
</template>

<script lang="ts" setup>
import {ref, useAttrs, onMounted, watch} from "vue";
import {NInputNumber, useThemeVars} from 'naive-ui';

const themeVars = useThemeVars();
const primaryColor = themeVars.value.primaryColor;

const attrs = useAttrs();
let props = withDefaults(defineProps<{
  value: number,
  unit?: string | null,
  min?: number,
  max?: number,
  //保留小数位
  decimal?: number
}>(), {
  value: 0,
  min: -Infinity,
  max: Infinity,
  decimal: 0
})
const emits = defineEmits(["update:value", "change"])

const inRef = ref();
const step = ref(1);
const esNumber = ref(0);

function handlerChange(value: number) {
  if (value === null) {
    esNumber.value = props.value;
    return;
  }
  value = parseFloat(value.toFixed(props.decimal));

  emits("update:value", value);
  emits("change", value)
}

onMounted(() => {
  esNumber.value = props.value;

  if (props.decimal !== 0) {
    step.value = Number(`${Number(0).toFixed(props.decimal - 1)}1`);
  }

  //inRef.value.$el.addEventListener('mousedown', onMouseDown);
})

watch(() => props.value, (newVal) => {
  esNumber.value = newVal;
})

let distance = 0;
let onMouseDownValue = 0;
const pointer = {x: 0, y: 0};
const prevPointer = {x: 0, y: 0};

function onMouseDown(event) {
  event.preventDefault();

  distance = 0;
  onMouseDownValue = esNumber.value;
  prevPointer.x = event.clientX;
  prevPointer.y = event.clientY;

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(event) {
  event.stopPropagation();

  pointer.x = event.clientX;
  pointer.y = event.clientY;

  distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

  let value = onMouseDownValue + (distance / (event.shiftKey ? 5 : 23)) * step.value;
  value = Math.min(props.max, Math.max(props.min, value));

  if (onMouseDownValue !== value && value !== null) {
    value = parseFloat(value.toFixed(props.decimal));

    esNumber.value = value;
    handlerChange(value);
  }

  prevPointer.x = pointer.x;
  prevPointer.y = pointer.y;
}

function onMouseUp(event) {
  event.stopPropagation();

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}
</script>

<style lang="less" scoped>
.n-input-number {
  :deep(.n-input){
    cursor: ns-resize;
  }

  :deep(.n-input__input-el), :deep(.n-input__suffix) {
    color: v-bind(primaryColor) !important;
    cursor: ns-resize;
  }
}
</style>
