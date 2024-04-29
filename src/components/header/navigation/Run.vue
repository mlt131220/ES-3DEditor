<template>
  <div class="flex items-center mr-2">
    <n-tooltip trigger="hover" v-if="!playerState.isPlaying">
      <template #trigger>
        <n-button text>
          <template #icon>
            <n-icon size="22" class="cursor-pointer" @click="playerState.start()">
              <play-outline/>
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ t("layout.header.Play") }}
    </n-tooltip>

    <n-tooltip trigger="hover" v-else>
      <template #trigger>
        <n-button text>
          <template #icon>
            <n-icon size="22" class="cursor-pointer" @click="playerState.stop()">
              <pause-outline/>
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ t("layout.header.Stop") }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import {NIcon, NTooltip} from "naive-ui";
import {PauseOutline, PlayOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {usePlayerStore} from "@/store/modules/player";

const playerState = usePlayerStore();
</script>

<style scoped lang="less">

</style>