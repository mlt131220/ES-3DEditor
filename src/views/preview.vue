<template>
  <div id="preview" class="w-full h-full">
<!--    <Layout.Header class="preview-header"/>-->

    <div id="player" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import {onMounted} from "vue";
import { useRoute } from 'vue-router';
import {t} from "@/language";
import {EsLoader} from "@/utils/esloader/EsLoader";
import {fetchGetOneScene} from "@/http/api/scenesZip";
import {usePlayerStore} from "@/store/modules/player";

const route = useRoute()
const playerState = usePlayerStore();

onMounted(() => {
  playerState.player().setupPreview();

  init();
});

async function init(){
  // 获取路由参数
  const id = route.params.id;
  if(!id){
    window.$message?.error(t("prompt['Parameter error!']"));
    return;
  }

  const res = await fetchGetOneScene(id);

  getScene(res.data);
}

//拉取场景
function getScene(sceneInfo){
  let notice = window.$notification.info({
    title: window.$t("scene['Get the scene data']") + "...",
    content: window.$t("other.Loading") + "...",
    closable: false,
  })

  fetch(sceneInfo.zip).then(r => r.blob()).then(r => {
    if(r.size !== 0){
      // 解压zip包
      const esLoader = new EsLoader();
      esLoader.unpack(r as Blob).then((sceneJson) => {
        notice.content = window.$t("scene['Parsing to editor']");
        /*加载到场景中*/
        playerState.start(sceneJson)

        notice.destroy();
      });
    }
  })
  return;
}
</script>

<style scoped lang="less">
.preview-header{
  height: 2.1rem;
  line-height: 2.1rem;
  display: flex;
  padding: 0 1rem;
  align-items: center;
}

#player{
  top: 2.1rem;
  bottom: 3.2rem;
  width: 100%;
  //height: calc(100vh - 2.1rem);
  overflow: hidden;
}
</style>