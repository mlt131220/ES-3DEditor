<script setup lang="ts">
import {ref} from "vue";
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";
import OutLine from './effect/Sidebar.Effect.Outline.vue';
import FXAA from './effect/Sidebar.Effect.FXAA.vue';
import UnrealBloom from './effect/Sidebar.Effect.UnrealBloom.vue';
import Bokeh from './effect/Sidebar.Effect.Bokeh.vue';
import Pixelate from './effect/Sidebar.Effect.Pixelate.vue';
import Halftone from './effect/Sidebar.Effect.Halftone.vue';

const effectEnabled: boolean = ref(window.editor.config.getEffectItem('enabled'));

function handleEffectEnabledChange(value:boolean){
  window.editor.config.setEffectItem('enabled',value);

  useDispatchSignal("effectEnabledChange",value);
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

  <n-collapse display-directive="show" :default-expanded-names="['Anti-aliasing','Outline','UnrealBloom']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>

    <!--  抗锯齿  -->
    <n-collapse-item :title="t('layout.sider.postProcessing[\'Anti-aliasing\']')" name="Anti-aliasing">
      <FXAA :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  Outline:描边线  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Outline')" name="Outline">
      <OutLine :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  UnrealBloom:仿UE辉光  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Glow')" name="UnrealBloom">
      <UnrealBloom :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  Bokeh:变焦  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Bokeh')" name="Bokeh">
      <Bokeh :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  Pixelate:像素风  -->
    <!--    <n-collapse-item :title="t('layout.sider.postProcessing.Pixelate')" name="Pixelate">-->
    <!--      <Pixelate :effect-enabled="effectEnabled" />-->
    <!--    </n-collapse-item>-->

    <!--  Halftone:半色调  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Halftoning')" name="Halftoning">
      <Halftone :effect-enabled="effectEnabled" />
    </n-collapse-item>
  </n-collapse>
</template>

<style lang="less">
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