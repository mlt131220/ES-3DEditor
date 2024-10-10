<script setup lang="ts">
import {ref} from 'vue';
import {TreeView} from '@vicons/carbon';
import {t} from  "@/language";
import SceneTree from "@/components/tree/SceneTree.vue";

const isShow = ref(false);
</script>

<template>
  <div class="absolute top-2 left-2" @pointerdown.stop>
    <transition name="wh-btn-fade" :duration="500">
      <n-button v-if="!isShow" strong secondary @click="isShow = true" class="absolute w-60px h-40px z-1">
        <n-icon size="24">
          <TreeView/>
        </n-icon>
      </n-button>
    </transition>

    <transition name="wh-fade" :duration="500">
      <n-card v-show="isShow" size="small" :title="t('preview.Scene Tree')" closable @close="isShow = false"
              class="absolute w-300px h-600px z-2" header-style="height:8%;padding: 10px 15px;" content-style="height:92%;padding: 8px 10px;">
        <SceneTree />
      </n-card>
    </transition>
  </div>
</template>

<style scoped lang="less">
.wh-fade-enter-active, .wh-fade-leave-active,.wh-btn-fade-enter-active, .wh-btn-fade-leave-active {
  transition: width .5s,height .5s,opacity .4s;
}

.wh-btn-fade-leave-from {
  width: 60px;
  height: 40px;
  opacity: 1;
}

.wh-btn-fade-leave-to {
  width: 300px;
  height: 600px;
  opacity: 0;
}

.wh-btn-fade-enter-from {
  width: 300px;
  height: 600px;
  opacity: 0;
}

.wh-btn-fade-enter-to {
  width: 60px;
  height: 40px;
  opacity: 1;
}

.wh-fade-leave-from {
  width: 300px;
  height: 600px;
  opacity: 1;
}

.wh-fade-leave-to {
  width: 60px;
  height: 40px;
  opacity: 0;
}

.wh-fade-enter-from {
  width: 60px;
  height: 40px;
  opacity: 0;
}

.wh-fade-enter-to {
  width: 300px;
  height: 600px;
  opacity: 1;
}
</style>