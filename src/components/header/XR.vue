<template>
  <div class="flex items-center mr-2">
    <n-tooltip trigger="hover" v-if="supportVR">
      <template #trigger>
        <n-icon size="20" class="cursor-pointer" @click="enterVR">
          <VrCardboard />
        </n-icon>
      </template>
      VR
    </n-tooltip>

    <n-tooltip trigger="hover" v-if="supportAR">
      <template #trigger>
        <n-icon size="20" class="cursor-pointer" @click="enterAR">
          <Slideshare />
        </n-icon>
      </template>
      AR
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import {onMounted,ref} from "vue";
import {VrCardboard, Slideshare} from "@vicons/fa";
import {NIcon, NTooltip} from "naive-ui";
import {useDispatchSignal} from "@/hooks/useSignal";

const supportAR = ref(false);
const supportVR = ref(false);

onMounted(() => {
  navigator.xr?.isSessionSupported( 'immersive-ar' ).then((supported) => {
    supportAR.value = supported;
  });

  navigator.xr?.isSessionSupported( 'immersive-vr' ).then((supported) => {
    supportVR.value = supported;
  });
})

function enterVR(){
  useDispatchSignal("enterXR",'immersive-ar');
}

function enterAR(){
  useDispatchSignal("enterXR",'immersive-vr');
}
</script>