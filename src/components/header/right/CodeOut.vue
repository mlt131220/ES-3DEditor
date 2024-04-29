<template>
  <n-button :loading="loading" @click="handleCodeOut">
    <template #icon>
      <n-icon>
        <Code />
      </n-icon>
    </template>
    {{ t("layout.header['Code out']") }}
  </n-button>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {LoadingManager,FileLoader} from "three";
import {zipSync, strToU8} from 'three/examples/jsm/libs/fflate.module.js';
import {Code} from "@vicons/carbon";
import {t} from "@/language";
import {downloadBlob} from "@/utils/common/utils";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {demoEnv} from "@/utils/common/constant";

const sceneInfoStore = useSceneInfoStore();

const loading = ref(false);

function handleCodeOut(){
  if(demoEnv){
    window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
    return;
  }

  loading.value = true;

  const toZip = {};

  let output = window.editor.toJSON();
  output.metadata.type = 'ES-App';
  delete output.history;

  try {
    output = JSON.stringify(output, null, '\t');
    output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
  } catch (error: any) {
    window.$message?.error(error.message);
    loading.value = false;
  }

  toZip['app.json'] = strToU8(output);

  const title = sceneInfoStore.getName;
  const manager = new LoadingManager(function () {
    const zipped = zipSync(toZip, {level: 9});

    const blob = new Blob([zipped.buffer], {type: 'application/zip'});

    downloadBlob(blob, (title !== '' ? title : 'Untitled') + '.zip');

    loading.value = false;
  });

  const loader = new FileLoader(manager);
  loader.load('/release/index.html', function (content: string) {
    content = content.replace('{{ title }}', title);
    const includes = [];
    content = content.replace('{{ includes }}', includes.join('\n\t\t'));
    let editButton = '';
    if (window.editor.config.getKey('project/editable')) {
      editButton = [
        "&lt;script>",
        "			let button = document.createElement( 'a' );",
        "			button.href = '//editor.mhbdng.cn/editor/#file=' + location.href.split( '/' ).slice( 0, - 1 ).join( '/' ) + '/app.json';",
        "			button.style.cssText = 'position: absolute; bottom: 20px; right: 20px; padding: 10px 16px; color: #fff; border: 1px solid #fff; border-radius: 20px; text-decoration: none;';",
        "			button.target = '_blank';",
        "			button.textContent = 'EDIT';",
        '			document.body.appendChild( button );',
        "&lt;/script>",
      ].join('\n');
    }
    content = content.replace('<edit_button />', editButton);
    toZip['index.html'] = strToU8(content);
  });
  loader.load('/release/js/app.js', function (content:string) {
    toZip['js/app.js'] = strToU8(content);
  });
  loader.load('/release/lib/three.module.js', function (content:string) {
    toZip['js/three.module.js'] = strToU8(content);
  });
  loader.load('/release/js/VRButton.js', function (content:string) {
    toZip['js/VRButton.js'] = strToU8(content);
  });
}
</script>

<style scoped lang="less">

</style>