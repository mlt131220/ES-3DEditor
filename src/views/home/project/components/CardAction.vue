<script setup lang="ts">
import {ref} from "vue";
import { RequestQuote,Edit,Airplay,Information,OverflowMenuVertical,SendAlt,Export,Delete } from '@vicons/carbon';
import {t,cpt} from "@/language";
import {renderIcon} from "@/utils/common/render";
import {fetchDeleteScenes} from "@/http/api/scenes";
import ProjectDetail from "@/views/home/project/components/ProjectDetail.vue";

const props = withDefaults(defineProps<{
  data:ISceneFetchData
}>(),{
  data:undefined
})
const emits = defineEmits(["refresh","setLoadingProjectId"]);

const options = [
  {
    label: () => cpt("home.Details").value,
    key: 'details',
    icon: renderIcon(Information)
  },
  {
    label: () => cpt("home.Rename").value,
    key: 'rename',
    icon: renderIcon(Edit)
  },
  {
    label: () => cpt("home.Delete").value,
    key: 'delete',
    icon: renderIcon(Delete)
  },
  {
    label: () => cpt("home.Release").value,
    key: 'release',
    icon: renderIcon(SendAlt)
  },
  {
    label: () => cpt("layout.header.Export").value,
    key: 'export',
    icon: renderIcon(Export)
  }
]
const detail = ref({});
const detailVisible = ref(false);

// 下拉菜单选中处理
function handleOperation(key: string){
  switch (key){
    case "details":
      detail.value = props.data;
      detailVisible.value = true;
      break;
    case "delete":
      window.$dialog.warning({
        title: window.$t('other.warning'),
        content: window.$t("prompt['Are you sure to delete the scene?']"),
        positiveText: window.$t('other.ok'),
        negativeText: window.$t('other.cancel'),
        onPositiveClick: async () => {
          emits("setLoadingProjectId",props.data.id);
          const res = await fetchDeleteScenes(props.data.id);

          emits("setLoadingProjectId",-1);

          if(res.error === null){
            // 刷新父页面列表
            emits('refresh');
          }
        },
      });
      break;
  }
}

// 编辑场景
function editScene(){
  // 新窗口打开
  window.open(window.location.origin + "/#/editor/" + props.data.id, "_blank");
}

//预览场景
function previewScene(){
  // 新窗口打开
  window.open(window.location.origin + "/#/preview/" + props.data.id, "_blank");
}
</script>

<template>
  <div class="w-full flex justify-between items-center">
    <n-tooltip trigger="hover">
      <template #trigger>
        <h4> {{data.sceneName}} </h4>
      </template>
      <span> {{data.sceneName}} </span>
    </n-tooltip>

    <div class="w-75px flex justify-between items-center">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button text @click="editScene">
            <template #icon>
              <n-icon><RequestQuote /></n-icon>
            </template>
          </n-button>
        </template>
        <span> {{ t('layout.sider.script.Edit') }} </span>
      </n-tooltip>

      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button text @click="previewScene">
            <template #icon>
              <n-icon><Airplay /></n-icon>
            </template>
          </n-button>
        </template>
        <span> {{ t('home.Preview') }} </span>
      </n-tooltip>

      <n-dropdown :options="options" @select="handleOperation">
        <n-button text>
          <template #icon>
            <n-icon><OverflowMenuVertical /></n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </div>
  </div>

  <!-- 详情 -->
  <ProjectDetail :detail="detail" v-model:visible="detailVisible" />
</template>

<style scoped lang="less">
h4{
  max-width: calc(100% - 90px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  -o-text-overflow: ellipsis;
}
</style>