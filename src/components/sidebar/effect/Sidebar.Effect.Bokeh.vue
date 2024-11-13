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
const bokeh = reactive(window.editor.config.getEffectItem('Bokeh'));

const disabled = computed(() => !props.effectEnabled || !bokeh.enabled);

function handleBokehConfigChange(){
  const raw = toRaw(bokeh);
  window.editor.config.setEffectItem("Bokeh",raw);
  useDispatchSignal("effectPassConfigChange","Bokeh",raw);
}
</script>

<template>
  <div class="pass-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="bokeh.enabled" :disabled="!effectEnabled" @update:checked="handleBokehConfigChange"/>
    </div>
  </div>

  <!-- 焦距 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Focus`) }}</span>
    <div>
      <n-slider v-model:value="bokeh.focus" :step="10" :min="10" :max="3000" :disabled="disabled" @update:value="handleBokehConfigChange" />
    </div>
  </div>

  <!-- 孔径 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Aperture`) }}</span>
    <div>
      <n-slider v-model:value="bokeh.aperture" :step="0.000001" :min="0" :max="0.0001" :disabled="disabled"
                @update:value="handleBokehConfigChange" :format-tooltip="(value: number) => `${value * 10000}`" />
    </div>
  </div>

  <!-- 最大模糊 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.MaxBlur`) }}</span>
    <div>
      <n-slider v-model:value="bokeh.maxblur" :step="0.001" :min="0.0" :max="0.01" :disabled="disabled" @update:value="handleBokehConfigChange" />
    </div>
  </div>
</template>

<style scoped lang="less">

</style>