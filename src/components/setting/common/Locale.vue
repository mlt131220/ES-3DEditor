<template>
  <n-popselect v-model:value="value" :options="options" @update:value="setLocale">
    <n-button quaternary class="mr-1">
      <template #icon>
        <n-icon>
          <Language />
        </n-icon>
      </template>
    </n-button>
  </n-popselect>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {Language} from "@vicons/carbon";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {setLocale} from "@/language";

const globalConfigStore = useGlobalConfigStore();
const value = ref(<string>globalConfigStore.locale);
const options = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
];
</script>