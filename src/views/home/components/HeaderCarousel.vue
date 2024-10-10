<script setup lang="ts">
import {ArrowLeft, ArrowRight} from '@vicons/carbon';

</script>

<template>
  <n-carousel show-arrow mousewheel autoplay draggable effect="custom" :transition-props="{name: 'creative'}"
              class="w-full h-25vh">
    <img class="carousel-img" src="/static/images/carousel/18.png">
    <img class="carousel-img" src="/static/images/carousel/54.png">

    <template #arrow="{ prev, next }">
      <div class="custom-arrow">
        <button type="button" class="custom-arrow--left" @click="prev">
          <n-icon>
            <ArrowLeft />
          </n-icon>
        </button>
        <button type="button" class="custom-arrow--right" @click="next">
          <n-icon>
            <ArrowRight />
          </n-icon>
        </button>
      </div>
    </template>

    <template #dots="{ total, currentIndex, to }">
      <ul class="custom-dots">
        <li v-for="index of total" :key="index" :class="{ ['is-active']: currentIndex === index - 1 }"
            @click="to(index - 1)"/>
      </ul>
    </template>
  </n-carousel>
</template>

<style scoped lang="less">
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-arrow {
  display: flex;
  position: absolute;
  bottom: 25px;
  right: 10px;
}

.custom-arrow button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 12px;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
  border-width: 0;
  border-radius: 8px;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.custom-arrow button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.custom-arrow button:active {
  transform: scale(0.95);
  transform-origin: center;
}

.custom-dots {
  display: flex;
  margin: 0;
  padding: 0;
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.custom-dots li {
  display: inline-block;
  width: 12px;
  height: 4px;
  margin: 0 3px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.4);
  transition: width 0.3s,background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.custom-dots li.is-active {
  width: 40px;
  background: #fff;
}

:deep(.creative-enter-from),
:deep(.creative-leave-to) {
  opacity: 0;
  transform: scale(0.8);
}

:deep(.creative-enter-active),
:deep(.creative-leave-active) {
  transition: all 0.3s ease;
}
</style>