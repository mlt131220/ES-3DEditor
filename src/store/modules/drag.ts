import { defineStore } from 'pinia';
import { store } from '@/store';
import {Vector2} from "three";

interface IDragState {
    data: any,
    actionTarget: "" | "addToScene",
    endArea:"" | "Drawing" | "Scene",
    endPosition: Vector2
}

/**
 * 拖拽相关
 */
export const useDragStore = defineStore({
    id: 'drag',
    state: () => <IDragState>({
        // 拖拽的数据
        data: {},
        // 拖拽行为目的
        actionTarget:"",
        // 鼠标释放时的区域
        endArea:"",
        // 鼠标释放时的区域屏幕坐标
        endPosition: new Vector2()
    }),
    getters:{
        getData:state=> state.data,
        getActionTarget:state=> state.actionTarget,
    },
    actions: {
        setData(data:any){
            this.data = data;
        },
        setActionTarget(actionTarget){
            this.actionTarget = actionTarget;
        },
        setEndArea(area){
            this.endArea = area;
        }
    }
});

// setup 之外使用
export function useDragStoreWithOut() {
    return useDragStore(store);
}