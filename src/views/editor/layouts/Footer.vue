<script lang="ts" setup>
import Setting from "@/components/setting/Setting.vue";

const version = import.meta.env.VITE_GLOB_VERSION;
const author = import.meta.env.VITE_GLOB_AUTHOR;
const beian = import.meta.env.VITE_GLOB_BEIAN;
</script>

<template>
  <div class="inline-block !flex items-center">
    <a href="https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral"
       target="blank" class="h-full flex items-center">
      本网站由&nbsp;&nbsp;<img class="w-12 mb-3px" src="/static/images/logo/upyun-logo.png" alt="又拍云">
      &nbsp;&nbsp;提供CDN加速/云存储服务
    </a>
    &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; Version {{ version }} · Made by {{ author }} &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
    <p><a href="https://beian.miit.gov.cn/" target="_blank">{{beian}}</a></p>
  </div>

  <Setting />
</template>
