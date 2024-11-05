import { defineStore } from 'pinia';
import { store } from '@/store';

interface ISceneInfo {
    // sceneInfo
    data:ISceneFetchData,
    // 工程（场景截图）Url
    screenshot:string
}

export const DefaultSceneData = {
    id:"",
    sceneName:"",
    sceneType:"其他",
    sceneIntroduction:"",
    sceneVersion:1,
    projectType:0, // 默认 Web3D 项目
    coverPicture:"",
    hasDrawing:0,
    zip:"",
    zipSize:"0",
    cesiumConfig:undefined
}

export const DefaultScreenshot = "/static/images/placeholder/截屏占位图.png";

/**
 * 场景相关信息
 */
export const useSceneInfoStore = defineStore({
    id: 'sceneInfo',
    state: () => <ISceneInfo>({
        data:DefaultSceneData,
        screenshot:DefaultScreenshot
    }),
    getters:{
        isCesiumScene:state=> state.data.projectType === 1,
        cesiumConfig:state => state.data.cesiumConfig as ICesiumConfig,
    },
    actions: {
        setDataFieldValue(field:string,value:string | number){
            if(!this.data[field]) return;

            this.data[field] = value;
        },
        setData(sceneData:ISceneFetchData){
            this.data = sceneData;
        }
    }
})

// setup 之外使用
export function useSceneInfoStoreWithOut() {
    return useSceneInfoStore(store);
}