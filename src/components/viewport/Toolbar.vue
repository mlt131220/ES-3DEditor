<template>
    <div class="absolute top-0 left-0 w-full h-0 z-10 flex justify-between pt-1">
      <div class="pl-2">
        <ViewportCamera />

        <ViewportShading />
      </div>

      <div class="pr-2">
        <n-button-group size="small">
<!--          <n-button :type="transfrom === 'translate' ? 'success' : 'default'" @click.stop="handlerRadioChange('translate')" round>-->
<!--            <template #icon>-->
<!--              <n-icon>-->
<!--                <Cursor1 />-->
<!--              </n-icon>-->
<!--            </template>-->
<!--          </n-button>-->
          <n-button :type="transfrom === 'translate' ? 'success' : 'default'" @click.stop="handlerRadioChange('translate')" round>
            <template #icon>
              <n-icon :size="16">
                <Move />
              </n-icon>
            </template>
          </n-button>
          <n-button :type="transfrom === 'rotate' ? 'success' : 'default'" @click.stop="handlerRadioChange('rotate')">
            <template #icon>
              <n-icon :size="16">
                <Renew />
              </n-icon>
            </template>
          </n-button>
          <n-button :type="transfrom === 'scale' ? 'success' : 'default'" @click.stop="handlerRadioChange('scale')" round>
            <template #icon>
              <n-icon :size="16">
                <Minimize />
              </n-icon>
            </template>
          </n-button>
        </n-button-group>

        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-button circle size="small" class="ml-10px" @click.stop="handlerLocalChange">
              <template #icon>
                <n-icon >
                  <Chart3D v-if="localValue" />
                  <Wikis v-else />
                </n-icon>
              </template>
            </n-button>
          </template>
          <span> {{ localValue ? t("layout.scene.toolbar.local") : t("layout.scene.toolbar.world") }} </span>
        </n-tooltip>
      </div>
    </div>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import { Cursor1,Move,Renew,Minimize,Wikis,Chart3D } from '@vicons/carbon';
import { useDispatchSignal } from '@/hooks/useSignal';
import ViewportCamera from '@/components/viewport/ViewportCamera.vue';
import ViewportShading from '@/components/viewport/ViewportShading.vue';
import {t} from "@/language";

const transfrom = ref("translate");
function handlerRadioChange(value: string) {
    transfrom.value = value;
    useDispatchSignal("transformModeChanged", value);
}

const localValue = ref(false);
function handlerLocalChange() {
    localValue.value = !localValue.value;
    useDispatchSignal("spaceChanged", localValue.value ? 'local' : 'world');
}
</script>

<style lang="less" scoped>
.n-button-group{
  .n-button{
    width: 32px;
  }
}
</style>