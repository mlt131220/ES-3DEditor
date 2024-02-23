import {unref} from 'vue';
import {useWebSocket as $useWebSocket} from 'vue-hooks-plus';
// import {dateTimeFormat} from "@/utils/common/dateTime";
import {useWebsocketStoreWithOut} from "@/store/modules/websocket";
import {generateUUID} from "three/src/math/MathUtils";

const websocketStore = useWebsocketStoreWithOut();

const listeners = new Map();

/**
 * 开启 WebSocket 链接，全局只需执行一次
 * @param url
 */
export function connectWebSocket(url) {
    if (!websocketStore.getIsOpen()) {
        // 设置订阅者标识
        let wsUname;
        if(!websocketStore.uname){
            wsUname = generateUUID();
            websocketStore.setUname(wsUname);
        }else{
            wsUname = websocketStore.uname;
        }

        const ws = $useWebSocket(`${url}?uname=${wsUname}`, {
            onOpen: () => {
                console.log('WebSocket 连接成功');
            },
            onClose: () => {
                console.log('WebSocket 连接关闭');
            },
            onMessage: (message) => {
                onMessage(message);
                // console.log('WebSocket 收到消息：', message);
            },
            onError: () => {
                console.log('WebSocket 连接错误');
            }
        });
        websocketStore.setWebsocket(ws);
    }
}


function onMessage(e: any) {
    if (e.data === 'ping' || e.data === 'heartbeat' || e.data === 'pong') {
        return;
    }
    // console.log('[WebSocket] -----接收消息-------', e.data);
    try {
        const data = JSON.parse(e.data);
        for (const callback of listeners.keys()) {
            try {
                callback(data);
            } catch (err) {
                console.error(err);
            }
        }
    } catch (err) {
        console.error('[WebSocket] data解析失败：', err);
    }
}

/**
 * 添加 WebSocket 消息监听
 * @param callback
 */
export function onWebSocket(callback: (data: object) => any) {
    if (!listeners.has(callback)) {
        if (typeof callback === 'function') {
            listeners.set(callback, null);
        } else {
            console.debug('[WebSocket] 添加 WebSocket 消息监听失败：传入的参数不是一个方法');
        }
    }
}

/**
 * 解除 WebSocket 消息监听
 *
 * @param callback
 */
export function offWebSocket(callback: (data: object) => any) {
    listeners.delete(callback);
}

export function useWebSocket() {
    return unref(websocketStore.ws);
}

export function send(message: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (websocketStore.getIsOpen()) {
        websocketStore.ws?.webSocketIns?.send(message);
    }
}
