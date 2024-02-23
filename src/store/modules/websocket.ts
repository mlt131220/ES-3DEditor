import { defineStore } from 'pinia';
import { store } from '@/store';
import type {UseWebSocketResult} from "vue-hooks-plus/lib/useWebSocket";
import {reactive, toRefs} from "vue";
import { useLocalStorageState } from 'vue-hooks-plus'

interface IWebsocketState {
    ws: null | UseWebSocketResult,
    uname:string
}

/**
 * websocket相关
 */
export const useWebsocketStore = defineStore('websocket',()=>{
    const [unameLocal, setUnameLocal] = useLocalStorageState('WS_UNAME', {
        defaultValue: '',
    });

    const state = reactive<IWebsocketState>({
        // websocket实例
        ws: null,
        // uname
        uname:unameLocal.value as string
    })

    /**
     * getter
     **/
    const getIsOpen = () =>  state.ws && state.ws.readyState === 1;

    /**
     * actions
     **/
    const setWebsocket = (websocket) => {
        state.ws = websocket;
    }
    const setUname = (uname:string) => {
        setUnameLocal(uname);
        state.uname = uname;
    }
    // 发送websocket消息
    const send = (message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        if (getIsOpen()) {
            state.ws?.webSocketIns?.send(message);
        }
    }

    return {
        ...toRefs(state),
        getIsOpen,
        setWebsocket,
        setUname,
        send
    }
});

// setup 之外使用
export function useWebsocketStoreWithOut() {
    return useWebsocketStore(store);
}