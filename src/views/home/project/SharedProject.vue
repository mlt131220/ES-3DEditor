<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import {t} from "@/language";
import {fetchGetAllScenes} from "@/http/api/scenes";
import CardAction from "@/views/home/project/components/CardAction.vue";
import CreateProject from "@/views/home/project/components/CreateProject.vue";

const data = ref<ISceneFetchData[]>([]);
let paginationReactive = reactive({
  page: 0,
  pageSize: 10,
  pageCount: 1
})
const loadMore = ref(false);
const noMore = ref(false);
const showCreateModal =  ref(false);
const loadingProjectId = ref(-1);

async function handleLoad() {
  if(noMore.value) return;

  loadMore.value = true;
  const res = await fetchGetAllScenes({
    offset: paginationReactive.page * paginationReactive.pageSize,
    limit: paginationReactive.pageSize,
    sortby:"updateTime",
    order:"desc",
    query:``
  });
  if(res.data === null) return;

  data.value.push(...(res.data.items || []));
  paginationReactive.pageCount = res.data.pages;
  paginationReactive.page++;
  loadMore.value = false;

  if(paginationReactive.page >= paginationReactive.pageCount) noMore.value = true;
}

async function refresh(){
  data.value = [];

  loadMore.value = true;
  const res = await fetchGetAllScenes({
    offset: 0,
    limit: paginationReactive.page * paginationReactive.pageSize,
    sortby:"updateTime",
    order:"desc",
    query:``
  });
  if(res.data === null) return;

  data.value.push(...(res.data.items || []));
  paginationReactive.pageCount = res.data.pages;
  loadMore.value = false;

  if(paginationReactive.page >= paginationReactive.pageCount) noMore.value = true;
}

function setLoadingProjectId(id:number){
  loadingProjectId.value = id;
}

// 编辑场景
function editScene(id:number){
  window.open(window.location.origin + "/#/editor/" + id, "_blank");
}

onMounted(() => {
  handleLoad();
})
</script>

<template>
  <n-infinite-scroll class="project-cards-list p-2" :distance="10" @load="handleLoad">
    <n-card embedded hoverable :bordered="false" content-class="!p-2" class="cursor-pointer" @click="showCreateModal = true">
      <div class="new-container h-full min-h-200px flex flex-col justify-center items-center b-1 b-dashed b-rd-1">
        <span class="text-16 color-#fff">🫵</span>
        <p>{{ t('home.New project') }}</p>
      </div>
    </n-card>

    <n-card hoverable v-for="project in data" :key="project.id" >
      <template #cover>
        <n-skeleton v-if="loadingProjectId === project.id" height="100%" width="100%" />
        <template v-else>
          <div class="absolute top-10px right-10px z-10">
            <n-tag type="success" :bordered="false" >
              {{ project.projectType === 0 ? "Web3D" : "WebGIS" }}
            </n-tag>
            <n-tag type="success" :bordered="false" class="ml-5px">
              {{ project.sceneType }}
            </n-tag>
          </div>

          <img :src="project.coverPicture || '/static/images/carousel/18.png'" class="h-full cursor-pointer hover:transform-scale-140 transition-all-200" @click="editScene(project.id)">
        </template>
      </template>

      <template #action>
        <n-skeleton v-if="loadingProjectId === project.id" text :repeat="1" />
        <CardAction v-show="loadingProjectId !== project.id" :data="project" @refresh="refresh" @setLoadingProjectId="setLoadingProjectId" />
      </template>
    </n-card>

    <div v-if="loadMore" class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.Loading') }}...
    </div>
    <div v-else-if="!noMore" class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.Scroll to load more') }} 😽😽😽
    </div>
    <div v-else class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.No more') }} 🤪
    </div>
  </n-infinite-scroll>

  <CreateProject v-model:visible="showCreateModal" @refresh="refresh" />
</template>

<style lang="less">
.project-cards-list {
  height: calc(100% - 2rem - var(--n-pane-padding-top));

  .n-scrollbar-content{
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-flow: row dense;

    .new-container{
      border-color: var(--n-border-color);
      color:var(--n-close-icon-color)
    }

    .n-card-cover{
      height: 100%;
    }
  }
}
</style>