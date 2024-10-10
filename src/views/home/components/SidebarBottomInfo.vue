<script setup lang="ts">
import {useThemeVars} from 'naive-ui';

const themeVars = useThemeVars();

const version = import.meta.env.VITE_GLOB_VERSION;
const author = import.meta.env.VITE_GLOB_AUTHOR;
const beian = import.meta.env.VITE_GLOB_BEIAN;
</script>

<template>
  <div class="h-90px flex flex-col justify-between items-center" :style="{color:themeVars.textColorDisabled}">
    <p>Version {{ version }}</p>
    <p>Made by {{ author }}</p>
    <p><a href="https://beian.miit.gov.cn/" target="_blank">{{beian}}</a></p>
  </div>
</template>

<style scoped lang="less">

</style>