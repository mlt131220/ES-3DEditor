<script setup lang="ts">
import {ref} from "vue";
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";
import OutLine from './effect/Sidebar.Effect.Outline.vue';
import FXAA from './effect/Sidebar.Effect.FXAA.vue';

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

  <n-collapse display-directive="show" :default-expanded-names="['Anti-aliasing','Outline']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>

    <!--  outline:描边线  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Outline')" name="Outline">
      <OutLine :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  抗锯齿  -->
    <n-collapse-item :title="t('layout.sider.postProcessing[\'Anti-aliasing\']')" name="Anti-aliasing">
      <FXAA :effect-enabled="effectEnabled" />
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
</style><script setup lang="ts">
import {ref} from "vue";
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {useDispatchSignal} from "@/hooks/useSignal";
import OutLine from './effect/Sidebar.Effect.Outline.vue';
import FXAA from './effect/Sidebar.Effect.FXAA.vue';

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

  <n-collapse display-directive="show" :default-expanded-names="['Anti-aliasing','Outline']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>

    <!--  outline:描边线  -->
    <n-collapse-item :title="t('layout.sider.postProcessing.Outline')" name="Outline">
      <OutLine :effect-enabled="effectEnabled" />
    </n-collapse-item>

    <!--  抗锯齿  -->
    <n-collapse-item :title="t('layout.sider.postProcessing[\'Anti-aliasing\']')" name="Anti-aliasing">
      <FXAA :effect-enabled="effectEnabled" />
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