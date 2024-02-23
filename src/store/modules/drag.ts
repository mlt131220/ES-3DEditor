import { defineStore } from 'pinia';
import { store } from '@/store';

interface IDragState {
    data: any,
    actionTarget: "" | "addToScene",
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
        }
    }
});

// setup 之外使用
export function useDragStoreWithOut() {
    return useDragStore(store);
}