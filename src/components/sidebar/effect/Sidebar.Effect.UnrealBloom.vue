<script setup lang="ts">
import {computed, reactive, toRaw} from "vue";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";

const props = withDefaults(defineProps<{
  effectEnabled:boolean
}>(),{
  effectEnabled:false
})

// 辉光配置
const unrealBloom = reactive(window.editor.config.getEffectItem('UnrealBloom'));

const disabled = computed(() => !props.effectEnabled || !unrealBloom.enabled);

function handleUnrealBloomConfigChange(){
  const raw = toRaw(unrealBloom);
  window.editor.config.setEffectItem("UnrealBloom",raw);
  useDispatchSignal("effectPassConfigChange","UnrealBloom",raw);
}
</script>

<template>
  <div class="pass-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="unrealBloom.enabled" :disabled="!effectEnabled" @update:checked="handleUnrealBloomConfigChange"/>
    </div>
  </div>

  <!-- 光晕半径 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Radius`) }}</span>
    <div>
      <n-slider v-model:value="unrealBloom.radius" :step="0.01" :min="0.00" :max="1.00" :disabled="disabled" @update:value="handleUnrealBloomConfigChange" />
    </div>
  </div>

  <!-- 光晕阈值 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Threshold`) }}</span>
    <div>
      <n-slider v-model:value="unrealBloom.threshold" :step="0.01" :min="0.00" :max="1.00" :disabled="disabled" @update:value="handleUnrealBloomConfigChange" />
    </div>
  </div>

  <!-- 光晕强度 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Strength`) }}</span>
    <div>
      <n-slider v-model:value="unrealBloom.strength" :step="0.01" :min="0.00" :max="3.00" :disabled="disabled" @update:value="handleUnrealBloomConfigChange" />
    </div>
  </div>
</template>

<style scoped lang="less">

</style>