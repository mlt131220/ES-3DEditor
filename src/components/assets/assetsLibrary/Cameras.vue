<template>
  <div id="assets-library-cameras">
    <n-alert type="info" :bordered="false" closable class="mb-2 mx-2">
      {{ t("prompt['Drag or double click to add to scene']") }}
    </n-alert>

    <div class="cards">
      <n-card size="small" hoverable v-for="item in cameras" :key="item.key" @dblclick="addToScene(item.key)"
              draggable="true"
              @dragstart="dragStart($event,item.key)"
              @dragend="dragEnd">
        <template #cover>
          <img :src="item.img" :alt="item.name" draggable="false"/>
        </template>
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger> {{ item.name.value }}</template>
          <span> {{ item.name.value }} </span>
        </n-tooltip>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted} from "vue";
import {MenubarAdd} from "@/utils/menubar/menubar-add";
import {t,cpt} from "@/language";
import {useDragStore} from "@/store/modules/drag";
import {screenToWorld} from "@/utils/common/scenes";

const cameras = [//配图使用平行光灯光颜色 rgb(35,49,221)
  {key:"orthographicCamera",img:"/static/images/assetsLibrary/cameras/orthographicCamera.svg",name:cpt("layout.header.OrthographicCamera")},
  {key:"perspectiveCamera",img:"/static/images/assetsLibrary/cameras/perspectiveCamera.svg",name:cpt("layout.header.PerspectiveCamera")}
]

let menubarAdd;
onMounted(()=>{
  menubarAdd = new MenubarAdd();
})

//双击添加至场景
function addToScene(key){
  menubarAdd.init(key);
}

// 开始拖拽事件
const dragStore = useDragStore();

function dragStart(e,key){
  dragStore.setData(key)
}

function dragEnd(e){
  if(dragStore.getActionTarget !== "addToScene") return;

  const position = screenToWorld(e.clientX,e.clientY);
  menubarAdd.init(dragStore.getData, {position:position});
  dragStore.setActionTarget("");
}
</script>

<style scoped lang="less">
#assets-library-cameras{
  height: calc(100vh - 4.3rem - 90px);
  overflow-y: auto;
  overflow-x: hidden;

  .cards{
    padding: 0 5px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px 8px;
  }

  .n-card{
    //height:max-content;
    cursor:pointer;

    .n-image {
      display: block;
    }

    :deep(.n-card-cover) {
      img {
        height: 89px;
        //object-fit: none;
      }
    }

    :deep(.n-card__content){
      padding: 3px 0;
      font-size: 13px;
      text-align: center;
    }
  }
}
</style>
