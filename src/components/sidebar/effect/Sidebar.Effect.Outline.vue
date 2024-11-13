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
const outline = reactive(window.editor.config.getEffectItem('Outline'));

const disabled = computed(() => !props.effectEnabled || !outline.enabled);

function handleOutlineConfigChange(){
  const raw = toRaw(outline);
  window.editor.config.setEffectItem("Outline",raw);
  useDispatchSignal("effectPassConfigChange","Outline",raw);
}
</script>

<template>
  <div class="pass-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="outline.enabled" :disabled="!effectEnabled" @update:checked="handleOutlineConfigChange"/>
    </div>
  </div>

  <!-- 边缘强度 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Edge Strength`) }}</span>
    <div>
      <n-slider v-model:value="outline.edgeStrength" :step="0.01" :min="0.01" :max="10" :disabled="disabled" @update:value="handleOutlineConfigChange" />
    </div>
  </div>

  <!-- 边缘发光 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Edge Glow`) }}</span>
    <div>
      <n-slider v-model:value="outline.edgeGlow" :step="0.01" :min="0" :max="1" :disabled="disabled" @update:value="handleOutlineConfigChange" />
    </div>
  </div>

  <!-- 边缘厚度 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Edge Thickness`) }}</span>
    <div>
      <n-slider v-model:value="outline.edgeThickness" :step="0.01" :min="1" :max="4" :disabled="disabled" @update:value="handleOutlineConfigChange" />
    </div>
  </div>

  <!-- 闪烁频率 -->
  <!--      <div class="pass-config-item">-->
  <!--        <span>{{ t(`layout.sider.postProcessing.Pulse Period`) }}</span>-->
  <!--        <div>-->
  <!--          <n-slider v-model:value="outline.pulsePeriod" :step="0.01" :min="0" :max="5" :disabled="disabled" @update:value="handleOutlineConfigChange" />-->
  <!--        </div>-->
  <!--      </div>-->

  <!-- 可见边缘的颜色 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Visible Edge`) }}</span>
    <div>
      <n-color-picker :show-alpha="false" v-model:value="outline.visibleEdgeColor" :disabled="disabled" @update:value="handleOutlineConfigChange" />
    </div>
  </div>

  <!-- 不可见边缘的颜色 -->
  <div class="pass-config-item">
    <span>{{ t(`layout.sider.postProcessing.Hidden Edge`) }}</span>
    <div>
      <n-color-picker :show-alpha="false" v-model:value="outline.hiddenEdgeColor" :disabled="disabled" @update:value="handleOutlineConfigChange" />
    </div>
  </div>
</template>

<style scoped lang="less">

</style>