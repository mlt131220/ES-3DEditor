<template>
  <div id="assets-library-object3d">
    <n-alert type="info" :bordered="false" closable class="mb-2 mx-2">
      {{ t("prompt['Drag or double click to add to scene']") }}
    </n-alert>

    <div class="cards">
      <n-card size="small" hoverable v-for="item in objectList" :key="item.key" @dblclick="addToScene(item.key)"
              draggable="true"
              @dragstart="dragStart($event,item.key)"
              @dragend="dragEnd" >
        <template #cover>
          <img :src="item.img" :alt="item.name" draggable="false" />
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
import {BasicObject3D} from "@/core/objects/basicObject3D";
import {t,cpt} from "@/language";
import {useDragStore} from "@/store/modules/drag";
import {screenToWorld} from "@/utils/common/scenes";

const objectList = [//配图使用平行光灯光颜色 rgb(35,49,221)
  {key:"group",img:"/static/images/assetsLibrary/object3d/group.png",name:cpt("layout.header.Group")},
  {key:"sprite",img:"/static/images/assetsLibrary/object3d/sprite.png",name:cpt("layout.header.Sprite")},
  {key:"box",img:"/static/images/assetsLibrary/object3d/box.png",name:cpt("layout.header.Box")},
  {key:"circle",img:"/static/images/assetsLibrary/object3d/circle.png",name:cpt("layout.header.Circle")},
  {key:"cylinder",img:"/static/images/assetsLibrary/object3d/cylinder.png",name:cpt("layout.header.Cylinder")},
  {key:"sphere",img:"/static/images/assetsLibrary/object3d/sphere.png",name:cpt("layout.header.Sphere")},
  {key:"torus",img:"/static/images/assetsLibrary/object3d/torus.png",name:cpt("layout.header.Torus")},
  {key:"plane",img:"/static/images/assetsLibrary/object3d/plane.png",name:cpt("layout.header.Plane")},
  {key:"ring",img:"/static/images/assetsLibrary/object3d/ring.png",name:cpt("layout.header.Ring")},
  {key:"tetrahedron",img:"/static/images/assetsLibrary/object3d/tetrahedron.png",name:cpt("layout.header.Tetrahedron")},
  {key:"octahedron",img:"/static/images/assetsLibrary/object3d/octahedron.png",name:cpt("layout.header.Octahedron")},
  {key:"dodecahedron",img:"/static/images/assetsLibrary/object3d/dodecahedron.png",name:cpt("layout.header.Dodecahedron")},
  {key:"icosahedron",img:"/static/images/assetsLibrary/object3d/icosahedron.png",name:cpt("layout.header.Icosahedron")},
  {key:"capsule",img:"/static/images/assetsLibrary/object3d/capsule.png",name:cpt("layout.header.Capsule")},
  {key:"doubleCone",img:"/static/images/assetsLibrary/object3d/doubleCone.png",name:cpt("layout.header['Double cone']")},
  {key:"torusKnot",img:"/static/images/assetsLibrary/object3d/torusKnot.png",name:cpt("layout.header.TorusKnot")},
  {key:"tube",img:"/static/images/assetsLibrary/object3d/tube.png",name:cpt("layout.header.Tube")},
  {key:"teapot",img:"/static/images/assetsLibrary/object3d/teapot.png",name:cpt("layout.header.Teapot")},
]

let basicObject3D  = new BasicObject3D();

//双击添加至场景..
function addToScene(key){
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
#assets-library-object3d{
  overflow-x: hidden;

  .cards{
    padding: 0 10px 10px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px 8px;
  }

  .n-card{
    cursor:pointer;

    .n-image {
      display: block;
    }

    :deep(.n-card-cover) {
      img {
        height: 85px;
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
