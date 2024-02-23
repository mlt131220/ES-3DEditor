<script lang="ts" setup>
import {ref, onMounted, watch} from "vue";
import * as THREE from 'three';
import type { UploadFileInfo } from 'naive-ui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

const props = defineProps({
    texture: {
        type: Object,
        default: {}
    },
    mapping: {}
})
const emits = defineEmits(["update:texture", "change"]);

watch(()=>props.texture,()=>{
    setValue(props.texture)
})

const file = ref<UploadFileInfo[]>([]);
const uploadRef = ref();
const canvasRef = ref();

onMounted(() => {
    canvasRef.value.addEventListener('drop', function (event) {
        event.preventDefault();
        event.stopPropagation();
        loadFile(event.dataTransfer.files[0]);
    });
})

function updateFileList(fList: UploadFileInfo[]) {
    //永远取最新值
    file.value = [fList[fList.length - 1]];

    file.value[0].file !== null && loadFile(file.value[0].file as File);
}

function canvasClick() {
    //uploadRef.value.clear();
    uploadRef.value.openOpenFileDialog();
}

function setValue(newTexture) {
    const context = canvasRef.value.getContext('2d');

    // 如果画布不可见，则上下文似乎可以为空
    if (context) {
        // 始终在设置新纹理之前清除上下文，因为新纹理可能具有透明度
        context.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }

    if (newTexture !== null) {
        const image = newTexture.image;
        if (image !== undefined && image.width > 0) {
            canvasRef.value.title = newTexture.sourceFile;
            const scale = canvasRef.value.width / image.width;

            if (image.data === undefined) {
                context.drawImage(image, 0, 0, image.width * scale, image.height * scale);
            } else {
                const canvas2 = renderToCanvas(newTexture);
                context.drawImage(canvas2, 0, 0, image.width * scale, image.height * scale);
            }
        } else {
            canvasRef.value.title = newTexture.sourceFile + ' (error)';
        }

        if(file.value.length === 0){
            file.value = [newTexture];
        }

        emits("update:texture", newTexture);
    } else {
        canvasRef.value.title = 'empty';
        uploadRef.value.clear();
        file.value = [];
    }
}

function loadFile(file) {
    //文件后缀
    const extension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    if (extension === 'hdr' || extension === 'pic') {
        reader.addEventListener('load', function (event) {
            // 假设RGBE/Radiance HDR图像格式
            const loader = new RGBELoader();
            loader.load(event.target?.result as string, function (hdrTexture) {
                hdrTexture.sourceFile = file.name;
                //@ts-ignore
                hdrTexture.isHDRTexture = true;

                setValue(hdrTexture);

                emits("change", hdrTexture);
            });
        });

        reader.readAsDataURL(file);
    } else if (extension === 'tga') {
        reader.addEventListener('load', function (event) {
            const canvas = new TGALoader().parse(event.target?.result as ArrayBuffer);

            //@ts-ignore
            const texture = new THREE.CanvasTexture(canvas, props.mapping);
            texture.sourceFile = file.name;

            setValue(texture);
            emits("change", texture);
        }, false);

        reader.readAsArrayBuffer(file);
    } else if (file.type.match('image.*')) {
        reader.addEventListener('load', function (event) {
            const image = document.createElement('img');
            image.addEventListener('load', function () {
                const texture = new THREE.Texture(this, props.mapping as THREE.Mapping);
                texture.sourceFile = file.name;
                texture.needsUpdate = true;

                setValue(texture);
                emits("change", texture);
            }, false);

            image.src = event.target?.result as string;
        }, false);
        reader.readAsDataURL(file);
    }
}

function setEncoding(encoding) {
    if (props.texture !== null) {
        props.texture.encoding = encoding;
    }
}

let renderer;
function renderToCanvas(texture) {
    if (renderer === undefined) {
        renderer = new THREE.WebGLRenderer();
        renderer.outputEncoding = THREE.sRGBEncoding;
    }

    const image = texture.image;
    renderer.setSize(image.width, image.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const quad = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(quad, material);
    scene.add(mesh);
    renderer.render(scene, camera);
    return renderer.domElement;
}

defineExpose({
    setEncoding,setValue
})
</script>

<template>
    <div class="es-texture">
        <n-upload list-type="image-card" ref="uploadRef" v-show="file.length === 0" @update:file-list="updateFileList" />
        <canvas class="es-texture-canvas" ref="canvasRef" v-show="file.length === 1" @click="canvasClick()"></canvas>
    </div>
</template>

<style lang="less" scoped>
:deep(.n-upload) {
    .n-upload-trigger.n-upload-trigger--image-card,
    .n-upload-file--image-card-type {
        width: 2rem;
        height: 2rem;
    }
}

.es-texture{
    width: 2rem;
    height: 2rem;
    &-canvas {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
}
</style>