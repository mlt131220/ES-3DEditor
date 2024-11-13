<script setup lang="ts">
import {computed, reactive, toRaw} from "vue";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";

const props = withDefaults(defineProps<{
  effectEnabled:boolean
}>(),{
  effectEnabled:false
})

// 描边线配置
const pixelate = reactive(window.editor.config.getEffectItem('Pixelate'));

const disabled = computed(() => !props.effectEnabled || !pixelate.enabled);

function handlePixelateConfigChange(){
  const raw = toRaw(pixelate);
  window.editor.config.setEffectItem("Pixelate",raw);
  useDispatchSignal("effectPassConfigChange","Pixelate",raw);
}
</script>

<template>
  <div class="pass-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="pixelate.enabled" :disabled="!effectEnabled" @update:checked="handlePixelateConfigChange"/>
    </div>
  </div>

  <!-- 像素大小 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.PixelSize`) }}</span>
    <div>
      <n-slider v-model:value="pixelate.pixelSize" :step="1" :min="0" :max="16" :disabled="disabled" @update:value="handlePixelateConfigChange" />
    </div>
  </div>

  <!-- 法向边缘强度 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.NormalEdgeStrength`) }}</span>
    <div>
      <n-slider v-model:value="pixelate.normalEdgeStrength" :step="0.01" :min="0" :max="2" :disabled="disabled" @update:value="handlePixelateConfigChange" />
    </div>
  </div>

  <!-- 深度边缘强度 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.DepthEdgeStrength`) }}</span>
    <div>
      <n-slider v-model:value="pixelate.depthEdgeStrength" :step="0.01" :min="0" :max="1" :disabled="disabled" @update:value="handlePixelateConfigChange" />
    </div>
  </div>
</template>

<style scoped lang="less">

</style>