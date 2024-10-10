<template>
  <div id="cad-library">
    <n-alert type="info" :show-icon="false" :bordered="false" class="mb-2 mx-2">
      <n-button quaternary round type="primary" @click="showHistoryModal = true">
        {{ t("layout.sider.History") }}
      </n-button>

      <n-button quaternary circle type="primary" @click="showCadUpload = true">
        <template #icon>
          <n-icon>
            <CloudUpload/>
          </n-icon>
        </template>
      </n-button>
    </n-alert>

    <div class="cards">
      <n-card size="small" hoverable v-for="item in objectList"
              :key="item.id" @dblclick="addToScene(item)"
              draggable="true"
              @dragstart="dragStart($event,item)"
              @dragend="dragEnd">
        <template #cover>
          <n-spin :show="item.conversionStatus === 0">
            <template #description>
              正在解析...
            </template>
            <img :src="item.thumbnail ? item.thumbnail : '/static/images/placeholder/占位图.png'" :alt="item.fileName"
                 draggable="false">
            <n-tag :color="{ color: '#F1C3CC', textColor: '#D03050' }" :bordered="false"
                   size="small" class="absolute top-33px w-full" v-if="item.conversionStatus === 2">
              解析失败
              <template #icon>
                <n-icon>
                  <CloseCircleSharp/>
                </n-icon>
              </template>
            </n-tag>
          </n-spin>
        </template>
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger> {{ item.fileName }}</template>
          <span> {{ item.fileName }} </span>
        </n-tooltip>
      </n-card>
    </div>
    <div class="flex justify-center mt-15px">
      <n-pagination v-bind="paginationReactive"></n-pagination>
    </div>

    <n-modal v-model:show="showHistoryModal" class="!w-60vw" preset="dialog" display-directive="show"
             :title="t('cad[\'CAD parse\']')+t('layout.sider.History')">
      <n-data-table class="mt-20px" size="small" :loading="tableLoading"
                    :columns="columns" :data="objectList"></n-data-table>
      <div class="flex justify-end mt-15px">
        <n-pagination v-bind="paginationReactive"></n-pagination>
      </div>
    </n-modal>

    <!--  CAD文件上传  -->
    <CadUploadDialog v-model:show="showCadUpload" @refreshList="getCadList" ref="uploadDialogRef"/>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, h, onBeforeUnmount} from "vue";
import type {DataTableColumns} from 'naive-ui';
import {NButton, NTag, NIcon} from 'naive-ui'
import {CloudUpload, Reload, CheckmarkCircle, CloseOutline, CloseCircleSharp} from '@vicons/ionicons5';
import {t} from "@/language";
import {useDragStore} from "@/store/modules/drag";
import {useDrawingStore} from "@/store/modules/drawing";
import {fetchGetCadList} from "@/http/api/cad";
import {onWebSocket, offWebSocket} from "@/hooks/useWebSocket";
import {useWebsocketStore} from "@/store/modules/websocket";

const websocketStore = useWebsocketStore();
const drawingStore = useDrawingStore();

let objectList = ref<ICad.IData[]>([]);
const showHistoryModal = ref(false);
const tableLoading = ref(false);
const columns: DataTableColumns<ICad.IData> = [
  {
    title: '文件名',
    key: 'fileName'
  },
  {
    title: '状态',
    key: 'conversionStatus',
    render(row) {
      return h(
          NTag,
          {
            bordered: false,
            type: row.conversionStatus === 0 ? "warning" : row.conversionStatus === 1 ? "success" : "error",
          },
          {
            default: () => row.conversionStatus === 0 ? "转换中" : row.conversionStatus === 1 ? "成功" : "失败",
            icon: () => h(
                NIcon, {
                  component: row.conversionStatus === 0 ? Reload : row.conversionStatus === 1 ? CheckmarkCircle : CloseOutline
                }
            )
          }
      )
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      if (row.conversionStatus !== 1) return "";
      return h(
          NButton,
          {
            size: 'small',
            onClick: () => addToScene(row)
          },
          {default: () => t("other.Load")}
      )
    }
  }
];
let paginationReactive = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  "on-update:page": (page: number) => {
    paginationReactive.page = page;
    getCadList();
  }
})

const showCadUpload = ref(false);
const uploadDialogRef = ref();

// 获取cad列表
async function getCadList() {
  const res = await fetchGetCadList({
    offset: (paginationReactive.page - 1) * paginationReactive.pageSize,
    limit: paginationReactive.pageSize
  });

  objectList.value = res.data?.items || [];
  paginationReactive.pageCount = res.data?.pages || 1;
}

async function addToScene(item: ICad.IData) {
  showHistoryModal.value = false;

  if (drawingStore.getIsUploaded) {
    window.$dialog.warning({
      title: `${window.$t("other.Load")} "${item.fileName}" ${window.$t("drawing.Drawing")} ?`,
      content: window.$t("drawing['This operation will overwrite the current drawing, and any unsaved data will be lost. Do you want to continue?']"),
      positiveText: window.$t('other.ok'),
      negativeText: window.$t('other.cancel'),
      onPositiveClick: () => {
        // 先清空图纸
        drawingStore.$reset();

        drawingStore.setImgSrc(item.converterFilePath);
        drawingStore.setIsUploaded(true);
      },
    });
  } else {
    // 先清空图纸
    drawingStore.$reset();

    drawingStore.setImgSrc(item.converterFilePath);
    drawingStore.setIsUploaded(true);
  }
}

// 开始拖拽事件
const dragStore = useDragStore();

function dragStart(e, item) {
  if (item.conversionStatus !== 1) return;
  dragStore.setData(item)
}

function dragEnd() {
  if (dragStore.getActionTarget !== "addToScene") return;

  const data = dragStore.getData
  if (data.conversionStatus !== 1) return;

  addToScene(data);

  dragStore.setActionTarget("");
}

// websocket监听 Cad 消息
function CadWsHandle(data) {
  if (data.type !== "cad") return;

  // 判断订阅者，以确定是自己还是别人轻量化的结果
  if (data.subscriber !== websocketStore.uname) return;

  let wsNotice = uploadDialogRef.value?.getNotice();
  // 如果是自己的轻量化结果，使用用户登录结果作为uname，则用户可能关闭页面再打开时接收到消息，应继续显示
  if (!wsNotice) {
    wsNotice = window.$notification.info({
      title: t("cad['CAD parse']"),
      content: "",
      closable: false,
    })
  }

  if (data.data.conversionStatus === "progress") {
    wsNotice.content = t("cad['CAD parse is in progress']") + "...";
  } else if (data.data.conversionStatus === "completed") {
    wsNotice.content = t("cad['CAD parse completed']");
    getCadList();
    setTimeout(() => {
      wsNotice?.destroy();
      window.$dialog.info({
        title: t("cad['CAD parse']"),
        content: t("cad['Do you want to load the preview?']"),
        positiveText: window.$t('other.Load'),
        negativeText: window.$t('other.cancel'),
        onPositiveClick: () => {
          addToScene(data.data.item);
        }
      })
    }, 800)
    getCadList();
  } else if (data.data.conversionStatus === "failed") {
    wsNotice.content = t("cad['CAD parse failed']");
    setTimeout(() => {
      wsNotice?.destroy();
    }, 1500)
  }
}

onMounted(() => {
  getCadList();

  // 注册websocket消息监听
  onWebSocket(CadWsHandle);
})
onBeforeUnmount(() => {
  offWebSocket(CadWsHandle)
})
</script>

<style scoped lang="less">
#cad-library {
  overflow-x: hidden;

  .n-alert {
    :deep(.n-alert-body) {
      padding: 10px;

      &__content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }

  .cards {
    padding: 0 5px;
    display: grid;
    width: 290px;
    grid-template-columns: repeat(3, 91px);
    grid-gap: 10px 8px;
  }

  .n-card {
    //height:max-content;
    cursor: pointer;

    .n-image {
      display: block;
    }

    :deep(.n-card-cover) {
      img {
        height: 89px;
        object-fit: cover;
      }
    }

    :deep(.n-card__content) {
      padding: 3px 5px;
      font-size: 13px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>