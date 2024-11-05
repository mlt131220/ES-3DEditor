<script setup lang="ts">
import {ref, onMounted, reactive, nextTick} from "vue";
import {Close} from '@vicons/carbon';
import {t} from "@/language";
import {fetchSceneExampleList} from "@/http/api/sceneExample";
import ProjectInfoForm from "@/components/project/ProjectInfoForm.vue";
import {DefaultSceneData, useSceneInfoStore} from "@/store/modules/sceneInfo";
import CesiumConfig from "@/components/project/CesiumConfig.vue";
import {fetchAddScene} from "@/http/api/scenes";
import EsTip from "@/components/es/EsTip.vue";

const props = withDefaults(defineProps<{
  visible: boolean
}>(), {
  visible: false
})
const emits = defineEmits(['update:visible', "refresh"]);

const sceneInfoStore = useSceneInfoStore();

const projectInfoFormRef = ref();
const cesiumConfigRef = ref();

const spin = ref(false);

const settingTabsValue = ref("project");
const currentType = ref<"Web3D" | "WebGIS">("Web3D");
const currentExample = ref<ISceneFetchData | null>(null);
const typeList: { name: string, type: "Web3D" | "WebGIS", img: string,isDev:boolean }[] = [
  {name: "Web3D", type: "Web3D", img: "/static/images/placeholder/Web3D.jpg",isDev:false},
  {name: "WebGIS", type: "WebGIS", img: "/static/images/placeholder/WebGIS.png",isDev:true},
];
const exampleList = reactive<{
  Web3D: ISceneFetchData[],
  WebGIS: ISceneFetchData[]
}>({
  Web3D: [],
  WebGIS: []
})

async function getExampleScene() {
  const res = await fetchSceneExampleList({
    limit: 1000
  })
  if (res.data === null) return;

  res.data.items.forEach(item => {
    switch (item.projectType) {
      case 0:
        exampleList.Web3D.push(item);
        break;
      case 1:
        exampleList.Web3D.push(item);
        break;
    }
  })
}

// 切换场景类型
function handleChangeProjectType(type) {
  if(type.isDev){
    window.$message?.warning(`${type.name}: ${t("prompt['Related modules are under development, unstable versions.']")}`)
  }

  currentType.value = type.type;

  // 选中空场景
  currentExample.value = null;
  sceneInfoStore.setData(DefaultSceneData);

  settingTabsValue.value = '';
  nextTick(() => {
    settingTabsValue.value = 'project';
  })
}

// 选中示例模板
function handleSelectExample(example: ISceneFetchData | null) {
  currentExample.value = example;

  sceneInfoStore.setData(example || DefaultSceneData);
}

// 确认创建项目
function handleSubmit() {
  projectInfoFormRef.value.validate().then(() => {
    const submit = async () => {
      const data: ISceneFetchData = projectInfoFormRef.value.getData();
      let cesiumData;
      if (currentType.value === 'WebGIS') {
        cesiumData = cesiumConfigRef.value.getData();
        data.projectType = 1;
      }

      spin.value = true;
      const res = await fetchAddScene({
        ...data,
        id: "",
        zip: "",
        coverPicture:"",
        sceneVersion:1,
        exampleSceneId: data.id,
        cesiumConfig: cesiumData ? JSON.stringify(cesiumData) : undefined
      })

      spin.value = false;

      if (res.error === null) {
        window.$dialog.success({
          title: t("other.Tips"),
          content: t("prompt['The project is created successfully. Do you want to enter?']"),
          positiveText: t("other.ok"),
          negativeText: t('other.cancel'),
          onPositiveClick: () => {
            // 新窗口打开项目
            window.open(window.location.origin + "/#/editor/" + res.data.id, "_blank");

            emits('update:visible', false);
            // 刷新父页面列表
            emits('refresh');
          },
          onNegativeClick: () => {
            emits('update:visible', false);
            // 刷新父页面列表
            emits('refresh');
          }
        })
      }
    }

    // 如果是创建GIS项目，还得验证GIS表单
    if (currentType.value === 'WebGIS') {
      cesiumConfigRef.value.validate().then(() => {
        submit();
      }).catch(() => {
        settingTabsValue.value = 'cesium'
      })
    } else {
      submit();
    }
  }).catch(() => {
    settingTabsValue.value = 'project'
  })
}

onMounted(() => {
  getExampleScene()
})
</script>

<template>
  <n-modal :show="visible" @update:show="(v) => emits('update:visible',v)">
    <n-spin :show="spin">
      <n-card :title="t('home.New project')" :bordered="false" size="small" class="w-max"
              header-style="background:var(--n-color);">
        <template #header-extra>
          <n-icon size="20" class="cursor-pointer" @click="emits('update:visible',false)">
            <Close/>
          </n-icon>
        </template>

        <div class="flex flex-wrap justify-between pt-20px h-max">
          <div class="flex flex-col mr-20px">
            <div v-for="type in typeList" :key="type.type" @click="handleChangeProjectType(type)"
                 class="relative cursor-pointer">
              <img width="300" :src="type.img" class="mb-15px b-rd-2 transition-all-500"
                   :style="{border:currentType === type.type ? '2px solid var(--n-color-target)' : '2px solid transparent'}"/>
              <p class="text-16px absolute bottom-30px left-10px" style="text-shadow: 1px 1px 2px black;">
                {{ type.name }}</p>

              <EsTip v-if="type.isDev" size="25" class="absolute top-10px right-10px">
                {{ t("prompt['Related modules are under development, unstable versions.']") }}
              </EsTip>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-10px grid-auto-rows-max w-560px max-h-full mr-10px">
            <div style="grid-column: 1 / -1;">
              <h4>{{ t("home.Template") }}</h4>
              <n-divider class="!my-10px"/>
            </div>

            <n-card hoverable @click="handleSelectExample(null)"
                    class="w-178px h-max cursor-pointer"
                    :style="{border:currentExample === null ? '1px solid var(--n-color-target)' : '1px solid transparent'}"
                    :footer-style="`background:var(${currentExample === null ? '--n-color-target' : '--n-action-color'});padding:10px;`">
              <template #cover>
                <img src="/static/images/carousel/18.png" :alt="t('home.Empty project')"
                     class="h-110px hover:transform-scale-140 transition-all-200">
              </template>

              <template #footer>
                <span> {{ t("home.Empty project") }} </span>
              </template>
            </n-card>

            <n-card hoverable v-for="example in exampleList[currentType]" :key="example.id"
                    @click="handleSelectExample(example)"
                    class="w-178px h-max cursor-pointer"
                    :style="{border:currentExample === example ? '1px solid var(--n-color-target)' : '1px solid transparent'}"
                    :footer-style="`background:var(${currentExample === example ? '--n-color-target' : '--n-action-color'});padding:10px;`">
              <template #cover>
                <n-tag type="success" :bordered="false" class="absolute top-10px right-10px z-10">
                  {{ example.sceneType }}
                </n-tag>
                <img :src="example.coverPicture || '/static/images/carousel/18.png'" :alt="example.sceneName"
                     class="h-110px hover:transform-scale-140 transition-all-200">
              </template>

              <template #footer>
                <span> {{ example.sceneName }} </span>
              </template>
            </n-card>
          </div>

          <div class="h-full flex">
            <n-divider vertical class="!h-auto"/>

            <div class="h-full w-320px flex flex-col justify-start ml-10px">
              <img :src="currentExample?.coverPicture || '/static/images/carousel/18.png'" class="w-full">

              <h3 class="mt-10px mb-8px">{{ currentExample?.sceneName || t("home.Empty project") }}</h3>
              <p class="h-100px overflow-y-auto">
                {{
                  currentExample === null ? t("home.A blank project without any scene elements") : currentExample.sceneIntroduction
                }}</p>

              <n-button tertiary size="small" class="mt-8px w-full text-left block">
                {{ t("home.Project default settings") }}
              </n-button>

              <n-tabs v-model:value="settingTabsValue" type="segment" size="small"
                      class="project-setting-tabs mt-24px" pane-class="h-220px">
                <n-tab-pane name="project" :tab="t('home.Project')" display-directive="show">
                  <ProjectInfoForm :value="currentExample" ref="projectInfoFormRef" class="!p-15px"/>
                </n-tab-pane>
                <n-tab-pane name="cesium" tab="Cesium" v-if="currentType === 'WebGIS'" display-directive="show">
                  <CesiumConfig ref="cesiumConfigRef" class="!p-15px"/>
                </n-tab-pane>
              </n-tabs>

              <div class="w-full text-end mt-15px">
                <n-button type="primary" size="small" @click.stop="handleSubmit">{{ t("other.ok") }}</n-button>
                <n-button size="small" class="ml-10px" @click="emits('update:visible',false)">{{ t("other.cancel") }}
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </n-spin>
  </n-modal>
</template>

<style scoped lang="less">
.project-setting-tabs {
  :deep(.n-tabs-nav) {
    justify-content: center;

    .n-tabs-rail {
      width: 50%;
    }
  }
}
</style>