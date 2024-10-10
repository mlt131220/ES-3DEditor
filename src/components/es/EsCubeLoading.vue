<script setup lang="ts">
withDefaults(defineProps<{
  visible:boolean
}>(),{
  visible:false
})
</script>

<template>
  <div class="w-full h-full flex flex-col justify-center items-center bg-#1D82B8 relative z-9999" v-if="visible">
    <div class="es-folding-cube bg-#fff">
      <div class="es-cube1 es-cube"></div>
      <div class="es-cube2 es-cube"></div>
      <div class="es-cube4 es-cube"></div>
      <div class="es-cube3 es-cube"></div>
    </div>
  </div>
</template>

<style scoped lang="less">
.es-folding-cube {
  margin: 20px auto;
  width: 40px;
  height: 40px;
  position: relative;
  -webkit-transform: rotateZ(45deg);
  transform: rotateZ(45deg);
}

.es-folding-cube .es-cube {
  float: left;
  width: 50%;
  height: 50%;
  position: relative;
  -webkit-transform: scale(1.1);
  -ms-transform: scale(1.1);
  transform: scale(1.1);
}
.es-folding-cube .es-cube:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1D82B8;
  -webkit-animation: es-foldCubeAngle 2.4s infinite linear both;
  animation: es-foldCubeAngle 2.4s infinite linear both;
  -webkit-transform-origin: 100% 100%;
  -ms-transform-origin: 100% 100%;
  transform-origin: 100% 100%;
}
.es-folding-cube .es-cube2 {
  -webkit-transform: scale(1.1) rotateZ(90deg);
  transform: scale(1.1) rotateZ(90deg);
}
.es-folding-cube .es-cube3 {
  -webkit-transform: scale(1.1) rotateZ(180deg);
  transform: scale(1.1) rotateZ(180deg);
}
.es-folding-cube .es-cube4 {
  -webkit-transform: scale(1.1) rotateZ(270deg);
  transform: scale(1.1) rotateZ(270deg);
}
.es-folding-cube .es-cube2:before {
  -webkit-animation-delay: 0.3s;
  animation-delay: 0.3s;
}
.es-folding-cube .es-cube3:before {
  -webkit-animation-delay: 0.6s;
  animation-delay: 0.6s;
}
.es-folding-cube .es-cube4:before {
  -webkit-animation-delay: 0.9s;
  animation-delay: 0.9s;
}
@-webkit-keyframes es-foldCubeAngle {
  0%, 10% {
    -webkit-transform: perspective(140px) rotateX(-180deg);
    transform: perspective(140px) rotateX(-180deg);
    opacity: 0;
  } 25%, 75% {
      -webkit-transform: perspective(140px) rotateX(0deg);
      transform: perspective(140px) rotateX(0deg);
      opacity: 1;
    } 90%, 100% {
        -webkit-transform: perspective(140px) rotateY(180deg);
        transform: perspective(140px) rotateY(180deg);
        opacity: 0;
      }
}

@keyframes es-foldCubeAngle {
  0%, 10% {
    -webkit-transform: perspective(140px) rotateX(-180deg);
    transform: perspective(140px) rotateX(-180deg);
    opacity: 0;
  } 25%, 75% {
      -webkit-transform: perspective(140px) rotateX(0deg);
      transform: perspective(140px) rotateX(0deg);
      opacity: 1;
    } 90%, 100% {
        -webkit-transform: perspective(140px) rotateY(180deg);
        transform: perspective(140px) rotateY(180deg);
        opacity: 0;
      }
}
</style>