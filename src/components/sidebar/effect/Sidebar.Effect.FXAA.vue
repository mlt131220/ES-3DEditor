<script setup lang="ts">
import {reactive,toRaw } from "vue";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";

withDefaults(defineProps<{
  effectEnabled:boolean
}>(),{
  effectEnabled:false
})

// 抗锯齿配置
const fxaa = reactive(window.editor.config.getEffectItem('fxaa'));

function handleFXAAConfigChange(){
  const raw = toRaw(fxaa);
  window.editor.config.setEffectItem("fxaa",raw);
  useDispatchSignal("effectPassConfigChange","fxaa",raw);
}
</script>

<template>
  <div class="pass-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="fxaa.enabled" :disabled="!effectEnabled" @update:checked="handleFXAAConfigChange"/>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>