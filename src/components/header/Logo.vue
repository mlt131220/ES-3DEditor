<template>
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="m27.19815,87.08654l-20.82,-11.88l0,-50.24l20.82,12.33l0,49.79z" :fill="primaryColor.hex"/>
    <path d="m25.32815,13.95654l-18.95,11.01l20.82,12.33l18.95,-10.83l-20.82,-12.51z" :fill="primaryColor.hexHover"/>
    <path d="m92.90815,50.47654l-0.11,24.39l-43.39,25.06l0.14,-24.56l43.36,-24.89z" :fill="primaryColor.hexHover"/>
    <path d="m30.47815,88.79654l18.93,11.13l0.14,-24.56l-19.02,-10.58l-0.05,24.01z" :fill="primaryColor.hex"/>
    <path d="m28.78815,12.09654l20.65,-12.17l43.28,25.04l-20.42,12.16l-43.51,-25.03z" :fill="primaryColor.hexHover"/>
    <path d="m92.74815,46.90654l-0.03,-21.94l-20.42,12.16l0.02,21.81l20.43,-12.03z" :fill="primaryColor.hexHover"/>
    <path d="m67.16815,60.04654l-17.52,10.11l-17.52,-10.11l0,-20.24l17.52,-10.11l17.52,10.11l0,20.24z" :fill="primaryColor.hexHover"/>
    <path d="m32.14875,39.8347l17.43802,-10.33057l17.43801,10.24793l-18.26446,10.49587" :fill="primaryColor.hex"/>
  </svg>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";

const globalConfigStore = useGlobalConfigStore();
const primaryColor = computed(() => globalConfigStore.mainColor as IConfig.Color);
</script>