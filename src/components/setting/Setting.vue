<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button quaternary @click="show = true">
        <template #icon>
          <n-icon :size="24">
            <Settings />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("setting.Setting") }}
  </n-tooltip>

  <n-modal v-model:show="show" class="w-100 h-40vh">
    <n-card size="small">
      <n-tabs type="line" animated default-value="shortcuts">
        <n-tab-pane name="system" :tab="t('setting.System Setting')">
          <SystemSetting />
        </n-tab-pane>
        <n-tab-pane name="shortcuts" :tab="t('setting.Shortcuts')">
          <Shortcuts />
        </n-tab-pane>

        <template #suffix>
          <n-button quaternary circle @click="show = false">
            <template #icon>
              <n-icon :size="24" >
                <Close />
              </n-icon>
            </template>
          </n-button>
        </template>
      </n-tabs>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {Settings,Close} from "@vicons/carbon";
import {t} from "@/language";
import Shortcuts from "./components/Shortcuts.vue";
import SystemSetting from "@/components/setting/components/SystemSetting.vue";

const show = ref(false);
</script>

<style scoped lang="less">
.n-tab-pane{
  width: 100%;

  height: 100%;
}
</style>