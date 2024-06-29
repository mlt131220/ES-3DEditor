<template>
  <n-modal :show="show" @update:show="emits('update:show',$event)" display-directive="show" class="w-66vh h-66vh" @close="emits('update:show',false)">
    <n-card size="small">
      <div ref="materialPreviewRef" class="w-full h-full"></div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import {ref,toRaw,watch,nextTick} from "vue";
import {OrthographicCamera,Scene,PlaneGeometry,Mesh,WebGLRenderer } from "three";

const props =withDefaults(defineProps<{
  show: boolean,
  material: any,
}>(),{
  show: false
})
const emits = defineEmits(['update:show','updatePreview'])

const materialPreviewRef = ref();
watch(() => props.show,async (newVal)=>{
  if(newVal){
    await nextTick();
    init();
    animate();
  }else{
    dispose();
  }
})

let camera, scene, renderer,timer = 0;
function init() {
  camera = new OrthographicCamera(- 1, 1, 1, - 1, 0, 1);

  scene = new Scene();

  const geometry = new PlaneGeometry(2, 2);

  const mesh = new Mesh(geometry, toRaw(props.material));
  scene.add(mesh);

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(materialPreviewRef.value.offsetWidth, materialPreviewRef.value.offsetHeight);
  materialPreviewRef.value.appendChild(renderer.domElement);
}

function animate() {
  timer =requestAnimationFrame(animate);

  emits("updatePreview")

  renderer.render( scene, camera );
}

function dispose() {
  cancelAnimationFrame(timer);
  materialPreviewRef.value.removeChild(renderer.domElement);
  renderer.dispose();
  scene = undefined;
  camera = undefined;
}
</script>