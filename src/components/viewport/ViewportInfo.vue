<template>
    <div id="info" class="absolute left-10px bottom-10px color-white">
        <span class="ml-6px">{{ t("layout.scene.viewportInfo.objects") }}: {{ objectsText }}</span>
        <span class="ml-6px">{{ t("layout.scene.viewportInfo.vertices") }}: {{ verticesText }}</span>
        <span class="ml-6px">{{ t("layout.scene.viewportInfo.triangles") }}: {{ trianglesText }}</span>
        <span class="ml-6px">{{ t("layout.scene.viewportInfo.frametime") }}: {{ frametimeText }}</span>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useAddSignal } from "@/hooks/useSignal";
import {t} from "@/language";

const objectsText = ref("0");
const verticesText = ref("0");
const trianglesText = ref("0");
const frametimeText = ref("0 ms");

function update() {
    const scene = window.editor.scene;
    let objects = 0, vertices = 0, triangles = 0;
    for (let i = 0, l = scene.children.length; i < l; i++) {
        const object = scene.children[i];
        object.traverseVisible(function (object) {
            objects++;
            if (object.isMesh || object.isPoints) {
                const geometry = object.geometry;
                vertices += geometry.attributes.position.count;
                if (object.isMesh) {
                    if (geometry.index !== null) {
                        triangles += geometry.index.count / 3;
                    } else {
                        triangles += geometry.attributes.position.count / 3;
                    }
                }
            }
        });
    }

    objectsText.value = objects.format();
    verticesText.value = vertices.format();
    trianglesText.value = triangles.format();
}

useAddSignal("objectAdded",update);
useAddSignal("objectRemoved",update);
useAddSignal("geometryChanged",update);

function updateFrametime( frametime ) {
    frametimeText.value = Number( frametime ).toFixed( 2 ) + ' ms';
}
useAddSignal("sceneRendered",updateFrametime);
</script>

<style scoped>
#info {
    font-size: 12px;
}
</style>