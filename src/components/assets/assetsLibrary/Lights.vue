<template>
  <div id="assets-library-lights">
    <n-alert type="info" :bordered="false" closable class="mb-2 mx-2">
      {{ t("prompt['Drag or double click to add to scene']") }}
    </n-alert>

    <div class="cards">
      <n-card size="small" hoverable v-for="item in lights" :key="item.key" @dblclick="addToScene(item.key)"
              draggable="true"
              @dragstart="dragStart($event,item.key)"
              @dragend="dragEnd">
        <template #cover>
          <n-icon size="50" class="ml-10px mr-5px">
            <component :is="item.icon" />
          </n-icon>
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
import {Sunny,Haze,BrightnessContrast} from "@vicons/carbon";
import {BulbOutline,FlashlightOutline} from "@vicons/ionicons5";
import {BasicObject3D} from "@/core/objects/basicObject3D";
import {t, cpt} from "@/language";
import {useDragStore} from "@/store/modules/drag";
import {screenToWorld} from "@/utils/common/scenes";
import {NIcon} from "naive-ui";

const lights = [//配图使用平行光灯光颜色 rgb(35,49,221)
  {
    key: "ambientLight",
    icon: Haze,
    name: cpt("layout.header.AmbientLight")
  },
  {
    key: "directionalLight",
    icon: Sunny,
    name: cpt("layout.header.DirectionalLight")
  },
  {
    key: "hemisphereLight",
    icon: BrightnessContrast,
    name: cpt("layout.header.HemisphereLight")
  },
  {key: "pointLight", icon: BulbOutline, name: cpt("layout.header.PointLight")},
  {key: "spotlight", icon: FlashlightOutline, name: cpt("layout.header.SpotLight")}
]

let basicObject3D  = new BasicObject3D();

//双击添加至场景
function addToScene(key) {
  basicObject3D.init(key);
}

// 开始拖拽事件
const dragStore = useDragStore();

function dragStart(e,key){
  dragStore.setData(key)
}

function dragEnd(e){
  if(dragStore.getActionTarget !== "addToScene") return;

  const position = screenToWorld(e.clientX,e.clientY);
  basicObject3D.init(dragStore.getData, {position:position});
  dragStore.setActionTarget("");
}
</script>

<style scoped lang="less">
#assets-library-lights {
  overflow-x: hidden;

  .cards {
    padding: 0 10px 10px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px 8px;
  }

  .n-card {
    cursor: pointer;

    .n-image {
      display: block;
    }

    :deep(.n-card-cover) {
      height: 85px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :deep(.n-card__content) {
      padding: 3px 0;
      font-size: 13px;
      text-align: center;
    }
  }
}
</style>
