<script lang="ts" setup>
import {nextTick} from "vue";
import {Save} from "@vicons/carbon";
import {t} from "@/language";
import {zip} from "@/utils/common/pako";
import {useDrawingStore} from "@/store/modules/drawing";
import {DefaultScreenshot, useSceneInfoStore} from "@/store/modules/sceneInfo";
import {useDispatchSignal} from "@/hooks/useSignal";
import {fetchUpload} from "@/http/api/sys";
import {filterSize} from "@/utils/common/file";
import {fetchUpdateScene} from "@/http/api/scenes";
import {Service} from "~/network";

const sceneInfoStore = useSceneInfoStore();
const drawingStore = useDrawingStore();

function save(){
  // 检查对应sceneId的工程是否存在
  if (!sceneInfoStore.data.id) {
    window.$message?.error(window.$t("scene['The project does not exist!']"));
    return;
  }

  window.$dialog.warning({
    title: window.$t('other.warning'),
    content: window.$t("prompt['Are you sure to update the scene?']"),
    positiveText: window.$t('other.ok'),
    negativeText: window.$t('other.cancel'),
    onPositiveClick: async () => {
      useDispatchSignal("setGlobalLoadingText", window.$t("scene['Generate scene data, please wait']"));
      useDispatchSignal("toggleGlobalLoading", true);

      // 版本自动 +1
      sceneInfoStore.setDataFieldValue("sceneVersion",sceneInfoStore.data.sceneVersion + 1);

      const biz = `${sceneInfoStore.data.id}-V${sceneInfoStore.data.sceneVersion}`;

      let coverPicture = sceneInfoStore.data.coverPicture;
      // 如果生成了封面，则先上传封面
      if(sceneInfoStore.screenshot !== DefaultScreenshot && sceneInfoStore.screenshot !== coverPicture){
        const f = await fetch(sceneInfoStore.screenshot);
        const blob = await f.blob();
        const res = await fetchUpload({
          file: new File([blob],`${sceneInfoStore.data.sceneName}-${Date.now()}.png`, { type: blob.type }),
          biz: `ES3DEditor/screenshot/${biz}`,
        })
        if(res.error === null){
          sceneInfoStore.setDataFieldValue("coverPicture",res.data);
          coverPicture = res.data;
        }else{
          window.$message?.error(window.$t("prompt['Failed to save the cover image']"));
        }
      }

      await nextTick();

      // 保存项目信息
      const sceneInfo = {
        ...sceneInfoStore.data,
        coverPicture,
        // 覆盖原zip包位置
        zip:"",
        hasDrawing: drawingStore.getIsUploaded ? 1 : 0,
        // 图纸信息
        drawingInfo: !drawingStore.getIsUploaded ? undefined : {
          imgSrc: drawingStore.getImgSrc,
          markList: zip(drawingStore.getMarkList),
          imgInfo: JSON.stringify(drawingStore.getImgInfo)
        }
      }

      useDispatchSignal("setGlobalLoadingText", window.$t("scene['Scene is being compressed...']"));

      const packConfig = {
        // 首包名称
        name:`${sceneInfoStore.data.sceneName}`,
        // 拆分的最深层级 0:拆分至最深层
        layer: 3,
        // 场景其他信息（存入首包）
        sceneInfo,
        // 压缩包上传接口函数，多压缩包
        zipUploadFun:async (zipFile: File) => {
          const res = await fetchUpload({
            file: zipFile,
            biz: `ES3DEditor/scene/${biz}`,
          })
          if (res.error !== null) {
            window.$message?.error(window.$t("scene['Failed to save project!']"));
            return "";
          }
          return res.data;
        },
        // 打包进度回调
        onProgress: (progress: number) => {
          useDispatchSignal("setGlobalLoadingText", progress + '%');
        },
        // 打包完成回调
        onComplete: (data: { firstUploadResult: any, totalSize: number, totalZipNumber: number }) => {
          const params = Object.assign(sceneInfo,{
            zip: data.firstUploadResult,
            zipSize: filterSize(data.totalSize)
          })
          params.drawingInfo =  undefined;
          fetchUpdateScene(sceneInfoStore.data.id,params).then((res: Service.SuccessResult<ISceneFetchData>) => {
            useDispatchSignal("setGlobalLoadingText", window.$t("prompt.Saved successfully!"));

            sceneInfoStore.setData(res.data);
            setTimeout(() => {
              useDispatchSignal("toggleGlobalLoading", false);
            }, 500)
          })
        }
      }

      window.viewer.modules.package.pack(packConfig);
    }
  });
}
</script>

<template>
  <n-button type="primary" @click="save">
    <template #icon>
      <n-icon>
        <Save />
      </n-icon>
    </template>
    {{ t("layout.header.Save") }}
  </n-button>
</template>

<style lang="less" scoped>
</style>
