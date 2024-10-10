<script setup lang="ts">
import {t} from "@/language";
</script>

<template>
  <n-tabs type="line" animated default-value="shortcuts">
    <n-tab-pane name="system" :tab="t('setting.System Setting')" display-directive="show">
      <SystemSetting />
    </n-tab-pane>
    <n-tab-pane name="shortcuts" :tab="t('setting.Shortcuts')" display-directive="show">
      <Shortcuts />
    </n-tab-pane>
  </n-tabs>
</template>

<style scoped lang="less">

</style>