<template>
  <n-alert type="success" :show-icon="false" closable class="mb-2">
    <div class="flex items-center">
      <n-icon :size="20">
        <Link />
      </n-icon>
      <a :href="url" target="_blank" class="ml-2">{{ t("other.Related document") }}</a>
    </div>
  </n-alert>
</template>

<script setup lang="ts">
import {t} from "@/language";
import {Link} from "@vicons/carbon";

withDefaults(defineProps<{
  url: string
}>(), {
  url: "",
})
</script>

<style scoped lang="less">

</style>