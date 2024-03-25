<script lang="ts" setup>
import {t} from "@/language";
import {ArchiveOutline as ArchiveIcon} from '@vicons/ionicons5';
import {UploadFileInfo} from "naive-ui";
import {ref, watch} from "vue";
import {useDrawingStore} from "@/store/modules/drawing";
import {base64ToFile} from "@/utils/common/utils";

const drawingStore = useDrawingStore();

const fileList = ref<UploadFileInfo[]>([])

function updateFileList(fList: UploadFileInfo[]) {
  if (fList.length === 0) return;

  //永远取最新值
  const file = fList[fList.length - 1];

  file.file !== null && loadFile(file.file as File);

  fileList.value[0].status = "finished";
}

function loadFile(file: File) {
  let img;

  // 通过FileReader.readAsDataURL(file)可以获取一段data:base64的字符串
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    img = reader.result; // reader.result就是文件的base64
    drawingStore.setIsUploaded(true);
    drawingStore.setImgSrc(img);
  };
}

function removeDrawing() {
  return new Promise((resolve, reject) => {
    window.$dialog.warning({
      title: t("other.warning"),
      content: t("drawing['Are you sure you want to delete the drawing?']"),
      positiveText: t("other.ok"),
      negativeText: t("other.cancel"),
      onPositiveClick: () => {
        resolve(true);
        drawingStore.$reset();
        fileList.value = [];
      },
      onNegativeClick: () => {
        resolve(false);
      }
    });
  });
}

watch(() => drawingStore.getImgSrc, (newVal) => {
  if (newVal) {
    const file = base64ToFile(drawingStore.getImgSrc, "drawing");
    fileList.value = [{
      id: "1",
      name: file.name,
      file: file,
      type: file.type,
      status: "finished",
      url: null,
    }]
  }
})
</script>

<template>
  <div id="sider-scene-drawing">
    <!-- 上传图纸 -->
    <n-upload :max="1"
              accept="image/*|.pdf"
              list-type="image-card"
              v-model:file-list="fileList"
              @update:file-list="updateFileList"
              @remove="removeDrawing"
    >
      <n-upload-dragger>
        <n-icon size="48" :depth="3">
          <archive-icon/>
        </n-icon>
        <n-text style="font-size: 16px">
          {{ t("layout.sider.drawing['Click to select or drag the drawing to this area']") }}
        </n-text>
      </n-upload-dragger>
    </n-upload>
  </div>
</template>

<style scoped lang="less">
#sider-scene-drawing {
  position: relative;

  .n-upload {
    :deep(.n-upload-file-list) {
      &--grid {
        grid-template-columns:repeat(1, 100%);
        width: 100%;
        min-height: 160px;
      }

      .n-upload-trigger {
        &--image-card {
          width: 100%;
          height: 100%;
          border-radius: 0.25rem;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease-in-out;

          .n-icon {
            margin-bottom: 12px;
          }

          .n-text {
            font-size: 16px;
          }
        }
      }

      .n-upload-file {
        width: 100%;
        height: 100%;
      }
    }

    &-dragger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>