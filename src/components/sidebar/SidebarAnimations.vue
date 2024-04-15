<template>
  <div v-if="hasAnimate">
    <n-card title="动画列表" hoverable size="small">
      <div v-for="(animation, index) in animationsList" :key="index" class="flex items-center justify-between w-full py-6px">
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <div class="w-160px !overflow-hidden text-ellipsis whitespace-nowrap">{{ animation.name }}</div>
          </template>
          <span> {{ animation.name }} </span>
        </n-tooltip>
        <n-button size="tiny" type="primary" v-if="!animation.isRunning" @click="play(animation)">{{ t("layout.sider.animation.Play") }}</n-button>
        <n-button size="tiny" type="info" v-else @click="play(animation)">{{ t("layout.sider.animation.Pause") }}</n-button>
      </div>
    </n-card>

    <div class="flex items-center justify-start w-full py-6px">
      <span>{{ t("layout.sider.animation['Time scale']") }}</span>
      <EsInputNumber v-model:value="mixerTimeScaleNumber" class="!w-80px ml-2" size="small" :min="-10" :max="10" :decimal="2"
                     :show-button="false" @change="handleTimeScaleChange()" />
    </div>
  </div>
  <n-result v-else status="418" title="Empty" :description="t('prompt[\'No object selected.\']')" />
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from "vue";
import type {AnimationAction} from "three";
import {t} from "@/language";
import {useAddSignal,useRemoveSignal} from "@/hooks/useSignal";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

interface IAnimation {
  name: string;
  action: AnimationAction;
  isRunning: boolean;
}

const hasAnimate = ref(false);
const animationsList = ref<IAnimation[]>([]);
const mixerTimeScaleNumber = ref(1.00);

onMounted(() => {
  useAddSignal("objectSelected",objectSelected);
  useAddSignal("objectRemoved",objectRemoved);
})
onBeforeUnmount(() => {
  useRemoveSignal("objectSelected",objectSelected);
  useRemoveSignal("objectRemoved",objectRemoved);
})

function objectSelected(object){
  if (object !== null && object.animations.length > 0) {

    animationsList.value = [];

    const animations = object.animations;
    for ( const animation of animations ) {
      const action = window.editor.mixer.clipAction(animation, object);
      animationsList.value.push({name: animation.name, action,isRunning:action.isRunning()});
    }

    hasAnimate.value = true;
  } else {
    hasAnimate.value = false;
  }
}

function objectRemoved(object){
  if (object !== null && object.animations.length > 0) {
    window.editor.mixer.uncacheRoot( object );
  }
}

function play(animation:IAnimation){
  if (animation.isRunning) {
    animation.action.stop();
    animation.isRunning = false;
  } else {
    animation.action.play();
    animation.isRunning = true;
  }
}

function handleTimeScaleChange(){
  window.editor.mixer.timeScale = mixerTimeScaleNumber.value;
}
</script>

<style scoped lang="less">
.n-card{
  max-height: 80vh;
  overflow-y: auto;

  :deep(&__content){
    padding: 10px !important;
  }

  :deep(&-header){
    padding-bottom: 0 !important;
  }
}
</style>