import { defineStore } from 'pinia';
import { store } from '@/store';

/**
 * 场景相关信息
 */
export const useSceneInfoStore = defineStore({
    id: 'sceneInfo',
    state: () => <ISceneInfo>({
        id: 0,
        // 场景类型
        type: "其他",
        // 场景名称
        name:"",
        // 场景描述
        introduction:"",
        // 场景版本
        version:1,
        // 是否是 cesium 场景
        isCesium:false
    }),
    getters:{
        getId:state=> state.id,
        getType:state=> state.type,
        getName:state=> state.name,
        getIntroduction:state=> state.introduction,
        getVersion:state=> state.version,
        getIsCesium:state=> state.isCesium,
        getSceneInfo:state=> state,
    },
    actions: {
        setId(id:number){
            this.id = id;
        },
        setType(type:string){
            this.type = type;
        },
        setName(name:string){
            this.name = name;
        },
        setIntroduction(introduction:string){
            this.introduction = introduction;
        },
        setVersion(version:number){
            this.version = version;
        },
        setIsCesium(isCesium:boolean){
            this.isCesium = isCesium;
        },
        setSceneInfo(sceneInfo){
            this.id = sceneInfo.id;
            this.type = sceneInfo.sceneType;
            this.name = sceneInfo.sceneName;
            this.introduction = sceneInfo.sceneIntroduction;
            this.version = sceneInfo.sceneVersion;
            this.isCesium = sceneInfo.isCesium;
        }
    }
})

// setup 之外使用
export function useSceneInfoStoreWithOut() {
    return useSceneInfoStore(store);
}