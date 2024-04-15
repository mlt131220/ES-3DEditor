<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import {NForm, NFormItem, NButton, NProgress} from 'naive-ui';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';

import {t} from "@/language";
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import {usePlayerStore} from "@/store/modules/player";

const playerState = usePlayerStore();

const videoWidth = ref(1024);
const videoHeight = ref(1024);
const videoFPS = ref(30);
const videoDuration = ref(10);

const rendering = ref(false);
const percentage = ref(0);

onMounted(() => {

})

// 渲染自动play的结果
async function renderVideoCopy() {
  rendering.value = true;
  percentage.value = 0;

  const player = playerState.player();
  player.load(window.editor.toJSON());
  player.setPixelRatio(1);
  player.setSize(videoWidth.value, videoHeight.value);

  const canvas: any = player.dom.firstElementChild;

  const ffmpeg = createFFmpeg({log: true});

  await ffmpeg.load();

  ffmpeg.setProgress(({ratio}) => {
    percentage.value = (ratio * 0.5) + 0.5;
  });

  const fps = videoFPS.value;
  const duration = videoDuration.value;
  const frames = duration * fps;

  let currentTime = 0;

  for (let i = 0; i < frames; i++) {
    player.render(currentTime);

    const num = i.toString().padStart(5, '0');
    ffmpeg.FS('writeFile', `tmp.${num}.png`, await fetchFile(canvas.toDataURL()));
    currentTime += 1 / fps;

    percentage.value = (i / frames) * 0.5;
  }

  await ffmpeg.run('-framerate', String(fps), '-pattern_type', 'glob', '-i', '*.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', String(5), 'es-3d-editor.mp4');
  const data = ffmpeg.FS('readFile', 'es-3d-editor.mp4');
  for (let i = 0; i < frames; i++) {
    const num = i.toString().padStart(5, '0');
    ffmpeg.FS('unlink', `tmp.${num}.png`);
  }
  save(new Blob([data.buffer], {type: 'video/mp4'}), 'es-3d-editor.mp4');

  player.dispose();

  rendering.value = false;
}

// 渲染当前鼠标操作
async function renderVideo() {
  rendering.value = true;
  percentage.value = 0;

  const canvas: HTMLCanvasElement = document.querySelector("#viewport canvas") as HTMLCanvasElement;
  let meta = {
    w: canvas.offsetWidth,
    h: canvas.offsetHeight
  }
  canvas.width = videoWidth.value;
  canvas.height = videoHeight.value;
  canvas.style.width = videoWidth.value + "px";
  canvas.style.height = videoHeight.value + "px";

  const ffmpeg = createFFmpeg({log: true});

  await ffmpeg.load();

  ffmpeg.setProgress(({ratio}) => {
    percentage.value = (ratio * 0.5) + 0.5;
  });

  const fps = videoFPS.value;
  const duration = videoDuration.value;
  const frames = duration * fps;

  let currentTime = 0;

  for (let i = 0; i < frames; i++) {
    // player.render(currentTime);

    const num = i.toString().padStart(5, '0');
    ffmpeg.FS('writeFile', `tmp.${num}.png`, await fetchFile(canvas.toDataURL()));
    currentTime += 1 / fps;

    percentage.value = (i / frames) * 0.5;
  }

  await ffmpeg.run('-framerate', String(fps), '-pattern_type', 'glob', '-i', '*.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', String(5), 'es-3d-editor.mp4');
  const data = ffmpeg.FS('readFile', 'es-3d-editor.mp4');
  for (let i = 0; i < frames; i++) {
    const num = i.toString().padStart(5, '0');
    ffmpeg.FS('unlink', `tmp.${num}.png`);
  }
  save(new Blob([data.buffer], {type: 'video/mp4'}), 'es-3d-editor.mp4');

  rendering.value = false;

  canvas.width = meta.w;
  canvas.height = meta.h;
  canvas.style.width = meta.w + "px";
  canvas.style.height = meta.h + "px";
}

const link = document.createElement('a');

function save(blob, filename) {
  if (link.href) {
    URL.revokeObjectURL(link.href);
  }

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.dispatchEvent(new MouseEvent('click'));
}
</script>

<template>
  <div>
    <n-form label-placement="left" :label-width="90" label-align="left" size="small">
      <n-form-item :label="t('layout.sider.sceneConfig.resolution')">
        <EsInputNumber v-model:value="videoWidth" :min="500" size="tiny" :step="1" :show-button="false"  class="w-8"/>
        <span>×</span>
        <EsInputNumber v-model:value="videoHeight" :min="500" size="tiny" :step="1" :show-button="false" class="w-8"/>
      </n-form-item>

      <n-form-item :label="t('layout.sider.sceneConfig[\'frame rate\']')">
        <EsInputNumber v-model:value="videoFPS" :min="15" :max="240" size="tiny" :step="1" :show-button="false" class="w-16"/>
        <span>&nbsp;fps</span>
      </n-form-item>

      <n-form-item :label="t('layout.sider.sceneConfig.duration')">
        <EsInputNumber v-model:value="videoDuration" :min="1" size="tiny" :step="1" :show-button="false" class="w-16"/>
        <span>&nbsp;{{ t('layout.sider.sceneConfig.seconds') }}</span>
      </n-form-item>
    </n-form>

    <div class="w-full text-center">
      <n-progress type="line" status="success" v-if="rendering" :percentage="percentage * 100">
        {{ (percentage * 100).toFixed(2) }}%
      </n-progress>
      <n-button type="primary" size="small" :loading="rendering" class="w-24" @click="renderVideo">{{
          t('layout.sider.sceneConfig.render')
        }}
      </n-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
:deep(.n-input-number) {
  .n-input-wrapper {
    padding: 0;
    text-align: center;

    .n-input__input-el {
      // color: #3b82f6 !important;
    }
  }
}
</style>
