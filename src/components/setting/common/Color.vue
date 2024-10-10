<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button quaternary @click="show = true">
        <template #icon>
          <n-icon>
            <ColorPalette />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Main color") }}
  </n-tooltip>

  <n-modal v-model:show="show" :title="t('layout.header.Main color')" preset="card"
      class="w-300 main-colors" :segmented="{ content: 'soft'}" bordered>
    <div class="flex h-80vh overflow-y-auto">
      <div class="grid grid-cols-4 gap-4 w-70%">
        <n-card v-for="color in recommendColors" :key="color.hex" :bordered="false" embedded
                hoverable class="w-full cursor-pointer" @click="globalConfigStore.setPrimaryColor(color)">
          <div class="w-6px h-full b-rd-3px mr-5px" :style="{backgroundColor: color.hex}"></div>

          <div class="flex flex-col justify-between h-full">
            <div class="flex items-end  mb-1">
              <h4 class="text-14px">{{color.name}}</h4>
              <span class="text-10px text-gray-400 ml-5px">{{ color.pinyin.toUpperCase() }}</span>
            </div>

            <div class="text-13px">
              {{color.hex}} <n-divider vertical />   {{`RGB(${color.RGB[0]},${color.RGB[1]},${color.RGB[2]})`}}
            </div>
          </div>
        </n-card>

        <n-divider class="grid-col-start-1 grid-col-end-5" />

        <n-card v-for="color in colors" :key="color.hex" :bordered="false" embedded
                hoverable class="w-full cursor-pointer" @click="globalConfigStore.setPrimaryColor(color)">
          <div class="w-6px h-full b-rd-3px mr-5px" :style="{backgroundColor: color.hex}"></div>

          <div class="flex flex-col justify-between h-full">
            <div class="flex items-end  mb-1">
              <h4 class="text-14px">{{color.name}}</h4>
              <span class="text-10px text-gray-400 ml-5px">{{ color.pinyin.toUpperCase() }}</span>
            </div>

            <div class="text-13px">
              {{color.hex}} <n-divider vertical />   {{`RGB(${color.RGB[0]},${color.RGB[1]},${color.RGB[2]})`}}
            </div>
          </div>
        </n-card>
      </div>

      <div class="w-30% h-full flex justify-center items-center absolute top-0 right-0">
        <n-card class="w-60% h-60%" content-class="w-full h-full flex justify-around overflow-y-auto color-show" :content-style="{backgroundColor: primaryColor.hex}">
          <div class="c-#FFF h-full flex flex-col justify-center items-center">
            <h1 class="text-60px mb-5px w-60px ">{{primaryColor.name}}</h1>
            <p>{{primaryColor.pinyin.toUpperCase()}}</p>
          </div>

          <div class="flex flex-col text-12px c-#fff">
            <n-divider />
            <span>C</span>
            <n-progress type="circle" :stroke-width="5" class="!w-50px" unit=""
                        :percentage="primaryColor.CMYK[0]" color="#0093D3" indicator-text-color="#0093D3"/>
            <n-divider />
            <span>M</span>
            <n-progress type="circle" :stroke-width="5" class="!w-50px" unit=""
                        :percentage="primaryColor.CMYK[1]" color="#CC006B" indicator-text-color="#CC006B"/>
            <n-divider />
            <span>Y</span>
            <n-progress type="circle" :stroke-width="5" class="!w-50px" unit=""
                        :percentage="primaryColor.CMYK[2]" color="#FFF10C" indicator-text-color="#FFF10C"/>
            <n-divider />
            <span>K</span>
            <n-progress type="circle" :stroke-width="5" class="!w-50px" unit=""
                        :percentage="primaryColor.CMYK[3]" color="#333" indicator-text-color="#333"/>
            <n-divider />
            <span>R</span>
            <div class="text-16px text-end">{{primaryColor.RGB[0]}}</div>
            <n-divider />
            <span>G</span>
            <div class="text-16px text-end">{{primaryColor.RGB[1]}}</div>
            <n-divider />
            <span>B</span>
            <div class="text-16px text-end">{{primaryColor.RGB[2]}}</div>
            <n-divider />
          </div>
        </n-card>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {onMounted,ref,computed} from "vue";
import {ColorPalette} from "@vicons/carbon";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {t} from "@/language";
import ChineseColors from "@/assets/color/ChineseColors.json";
import Recommend from "@/assets/color/recommend.json";

const globalConfigStore = useGlobalConfigStore();

const show = ref(false);
const recommendColors = ref<IConfig.Color[]>(Recommend);
const colors = ref<IConfig.Color[]>(ChineseColors);
const primaryColor = computed(() => globalConfigStore.mainColor as IConfig.Color);

onMounted(() => {
  getColors();
})

function getColors() {
}
</script>

<style scoped lang="less">
.n-card{
  :deep(&__content){
    flex: unset;
    display: flex;
    padding: 10px;

    &:first-child{
      padding-top:10px;
    }
  }
}

.n-divider:not(.n-divider--vertical){
  margin-top: 10px;
  margin-bottom: 10px;

  :deep(.n-divider__line){
    background-color: #F3F3F3;
  }
}
</style>

<style lang="less">
.main-colors{
  background-color:var(--n-color) !important;
}

.color-show{
  background-image: url(/static/images/color-texture.png);
  background-color: #ddd;
  transition: background-color 1s ease-in-out;
}
</style>