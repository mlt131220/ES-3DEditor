<template>
  <div id="bim-library">
    <n-alert type="info" :show-icon="false" :bordered="false" class="mb-2 mx-2">
      <n-button quaternary round type="warning" @click="showHistoryModal = true">
        {{ t("layout.footer.History") }}
      </n-button>

      <n-button quaternary circle type="primary" @click="showBIMUpload = true">
        <template #icon>
          <n-icon>
            <CloudUpload/>
          </n-icon>
        </template>
      </n-button>
    </n-alert>

    <div class="cards">
      <n-card size="small" hoverable v-for="item in objectList.filter(o => o.conversionStatus !== 2)"
              :key="item.id" @dblclick="addToScene(item)"
              draggable="true"
              @dragstart="dragStart($event,item)"
              @dragend="dragEnd">
        <template #cover>
          <img :src="item.thumbnail ? item.thumbnail : '/static/images/占位图.png'" :alt="item.fileName"
               draggable="false">
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
             :title="t('bim[\'BIM lightweight\']')+t('layout.footer.History')">
      <n-data-table class="mt-20px" size="small" :loading="tableLoading"
                    :columns="columns" :data="objectList"></n-data-table>
      <div class="flex justify-end mt-15px">
        <n-pagination v-bind="paginationReactive"></n-pagination>
      </div>
    </n-modal>

    <!--  BIM文件上传  -->
    <UploadDialog v-model:show="showBIMUpload" ref="uploadDialogRef" />
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, h} from "vue";
import type {DataTableColumns} from 'naive-ui';
import {NButton, NTag, NIcon} from 'naive-ui'
import {CloudUpload, Reload, CheckmarkCircle, CloseOutline} from '@vicons/ionicons5';
import {t} from "@/language";
import {useDragStore} from "@/store/modules/drag";
import {fetchGetBim2GltfList} from "@/http/api/bim";
import {Bim2GltfWsData, Service, WebSocketMessage} from "../../../types/network";
import {useDispatchSignal} from "@/hooks/useSignal";
import {filterSize} from "@/utils/common/file";
import {onWebSocket} from "@/hooks/useWebSocket";
import {useWebsocketStore} from "@/store/modules/websocket";
import {dateTimeFormat} from "@/utils/common/dateTime";
import UploadDialog from "./bimLibrary/UploadDialog.vue";

const websocketStore = useWebsocketStore();

let objectList = ref<IBIMData[]>([]);
const showHistoryModal = ref(false);
const tableLoading = ref(false);
const columns: DataTableColumns<IBIMData> = [
  {
    title: '文件名',
    key: 'fileName'
  },
  {
    title: 'bim文件体积',
    key: 'bimFileSize',
    render(row) {
      return filterSize(row.bimFileSize);
    }
  },
  {
    title: 'gltf文件体积',
    key: 'gltfFileSize',
    render(row) {
      return filterSize(row.gltfFileSize);
    }
  },
  {
    title: '转换时长',
    key: 'conversionDuration',
    render(row) {
      return row.conversionDuration.toFixed(2) + "s";
    }
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
  pageSize: 15,
  pageCount: 1,
  "on-update:page": (page: number) => {
    paginationReactive.page = page;
    getBim2GltfList();
  }
})

const showBIMUpload = ref(false);
const uploadDialogRef = ref();

// 获取BIM转换列表
async function getBim2GltfList() {
  const res = await fetchGetBim2GltfList({
    offset: (paginationReactive.page - 1) * paginationReactive.pageSize,
    limit: paginationReactive.pageSize
  }) as Service.SuccessResult<Service.ListPageResult<IBIMData>>;

  objectList.value = res.data?.items || [];
  paginationReactive.pageCount = res.data?.pages || 1;
}

async function addToScene(item) {
  showHistoryModal.value = false;

  let notice = window.$notification.info({
    title: window.$t("scene['Get the scene data']") + "...",
    content: window.$t("other.Loading") + "...",
    closable: false,
  })

  // 从gltfFilePath字段去服务器获取gltf文件
  fetch(item.gltfFilePath)
      .then(res => res.blob())
      .then(data => {
        const file = new File([data as Blob], `${item.fileName}.glb`, {type: 'model/gltf-binary'});

        notice.content = window.$t("scene['Parsing to editor']");

        window.editor.loader.loadFiles([file], undefined, () => {
          setTimeout(() => {
            notice.destroy();
            useDispatchSignal("sceneGraphChanged");
          }, 800)
          useDispatchSignal("sceneGraphChanged");
        })
      })
      .catch(err => {
        notice.content = window.$t("scene['Failed to get scene data']");
        setTimeout(() => {
          notice.destroy();
        }, 500)
        return null;
      })
}

// 开始拖拽事件
const dragStore = useDragStore();

function dragStart(e, item) {
  dragStore.setData(item)
}

function dragEnd() {
  if (dragStore.getActionTarget !== "addToScene") return;

  addToScene(dragStore.getData);

  dragStore.setActionTarget("");
}

// websocket监听 bim2gltf 消息
function Bim2GltfWsHandle(data: WebSocketMessage<Bim2GltfWsData>) {
  if (data.type === "bim2gltf") {
    // 判断订阅者，以确定是自己还是别人轻量化的结果
    if (data.subscriber === websocketStore.uname) {
      let wsNotice = uploadDialogRef.value?.getNotice();
      // 如果是自己的轻量化结果，使用用户登录结果作为uname，则用户可能关闭页面再打开时接收到消息，应继续显示
      if (!wsNotice) {
        wsNotice = window.$notification.info({
          title: t("bim['BIM lightweight']"),
          content: "",
          closable: false,
        })
      }

      if (data.data.conversionStatus === "progress") {
        wsNotice.content = t("bim['BIM lightweight is in progress']") + "...";
      } else if (data.data.conversionStatus === "completed") {
        wsNotice.content = `${t("bim['BIM lightweight completed']")},${t("bim.In")} ${data.data.item.conversionDuration} ${t("bim.seconds")}`;
        setTimeout(() => {
          wsNotice?.destroy();
          window.$dialog.info({
            title: t("bim['BIM lightweight completed']"),
            content: t("bim['Whether to load the BIM model into the scene?']"),
            positiveText: window.$t('other.Load'),
            negativeText: window.$t('other.cancel'),
            onPositiveClick: () => {
              addToScene(data.data.item);
            }
          })
        }, 800)
        getBim2GltfList();
      } else if (data.data.conversionStatus === "failed") {
        wsNotice.content = t("bim['BIM lightweight failed']");
        setTimeout(() => {
          wsNotice?.destroy();
        }, 1500)
      }
    } else {
      if (data.data.conversionStatus !== "completed") return;

      // 别人的轻量化结果
      const n = window.$notification.info({
        title: t("bim['BIM lightweight']"),
        content: t("bim['New lightweight BIM model received, do you want to view it?']"),
        duration: 5000,
        closable: true,
        meta: dateTimeFormat("yyyy-MM-dd HH:mm:ss"),
        action: () =>
            h(NButton, {
                  text: true,
                  type: 'primary',
                  onClick: () => {
                    addToScene(data.data.item);
                    n.destroy();
                  }
                },
                {
                  default: () => t("other.Load")
                }
            ),
      })
    }
  }
}

onMounted(() => {
  getBim2GltfList();

  // 注册websocket消息监听
  onWebSocket(Bim2GltfWsHandle);
})
</script>

<style scoped lang="less">
#bim-library {
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