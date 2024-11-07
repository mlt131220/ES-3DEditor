<script setup lang="ts">
import {reactive, ref,toRaw } from "vue";
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";

const effectEnabled: boolean = ref(window.editor.config.getEffectItem('enabled'));
// 描边线配置
const outline = reactive(window.editor.config.getEffectItem('outline'));
// 抗锯齿配置
const fxaa = reactive(window.editor.config.getEffectItem('fxaa'));

function handleEffectEnabledChange(value:boolean){
  window.editor.config.setEffectItem('enabled',value);

  useDispatchSignal("effectEnabledChange",value);
}

function handleOutlineConfigChange(){
  const raw = toRaw(outline);
  window.editor.config.setEffectItem("outline",raw);
  useDispatchSignal("effectPassConfigChange","outline",raw);
}

function handleFXAAConfigChange(){
  const raw = toRaw(fxaa);
  window.editor.config.setEffectItem("fxaa",raw);
  useDispatchSignal("effectPassConfigChange","fxaa",raw);
}
</script>

<template>
  <div class="flex items-center justify-between">
    <h4>{{ t('layout.sider.Post processing') }}</h4>
    <n-switch v-model:value="effectEnabled" @update:value="handleEffectEnabledChange">
      <template #checked>
        {{ t("other.Open") }}
      </template>
      <template #unchecked>
        {{ t("other.Close") }}
      </template>
    </n-switch>
  </div>

  <n-divider class="!my-3" />

  <n-collapse display-directive="show" :default-expanded-names="['Anti-aliasing','Outline']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>

    <!--  outline:描边线  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Outline')" name="Outline">
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
          <n-slider v-model:value="outline.edgeStrength" :step="0.01" :min="0.01" :max="10" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />
        </div>
      </div>

      <!-- 边缘发光 -->
      <div class="pass-config-item">
        <span>{{ t(`layout.sider.postProcessing.Edge Glow`) }}</span>
        <div>
          <n-slider v-model:value="outline.edgeGlow" :step="0.01" :min="0" :max="1" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />
        </div>
      </div>

      <!-- 边缘厚度 -->
      <div class="pass-config-item">
        <span>{{ t(`layout.sider.postProcessing.Edge Thickness`) }}</span>
        <div>
          <n-slider v-model:value="outline.edgeThickness" :step="0.01" :min="1" :max="4" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />
        </div>
      </div>

      <!-- 闪烁频率 -->
<!--      <div class="pass-config-item">-->
<!--        <span>{{ t(`layout.sider.postProcessing.Pulse Period`) }}</span>-->
<!--        <div>-->
<!--          <n-slider v-model:value="outline.pulsePeriod" :step="0.01" :min="0" :max="5" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />-->
<!--        </div>-->
<!--      </div>-->

      <!-- 可见边缘的颜色 -->
      <div class="pass-config-item">
        <span>{{ t(`layout.sider.postProcessing.Visible Edge`) }}</span>
        <div>
          <n-color-picker :show-alpha="false" v-model:value="outline.visibleEdgeColor" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />
        </div>
      </div>

      <!-- 不可见边缘的颜色 -->
      <div class="pass-config-item">
        <span>{{ t(`layout.sider.postProcessing.Hidden Edge`) }}</span>
        <div>
          <n-color-picker :show-alpha="false" v-model:value="outline.hiddenEdgeColor" :disabled="!effectEnabled" @update:value="handleOutlineConfigChange" />
        </div>
      </div>
    </n-collapse-item>

    <!--  抗锯齿  -->
    <n-collapse-item :title="t('layout.sider.postProcessing[\'Anti-aliasing\']')" name="Anti-aliasing">
      <div class="pass-config-item">
        <span>{{ t(`other.Enable`) }}</span>
        <div>
          <n-checkbox size="small" v-model:checked="fxaa.enabled" :disabled="!effectEnabled" @update:checked="handleFXAAConfigChange"/>
        </div>
      </div>
    </n-collapse-item>
  </n-collapse>
</template>

<style scoped lang="less">
.pass-config-item{
  display: flex;
  align-items: center;
  padding: 0 1rem 0.5rem 1rem;
  width: 100%;

  &>span{
    width: 30%;
  }

  &>div{
    width: calc(70% - 2rem);
  }
}
</style>