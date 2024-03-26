/**
 * @author MaHaiBing
 * @email  mlt131220@163.com
 * @date   2023/11/29 10:10
 * @description websocket hook;使用store管理websocket保证全局唯一性
 */
import {unref} from 'vue';
import {useWebSocket as $useWebSocket} from 'vue-hooks-plus';
import {useWebsocketStoreWithOut} from "@/store/modules/websocket";
import {generateUUID} from "three/src/math/MathUtils";

const websocketStore = useWebsocketStoreWithOut();
const listeners = new Map();
const PING = new Uint8Array([0x9]);
let pingInterval:any = null;

/**
 * 开启 WebSocket 链接，全局只需执行一次
 * @param url
 */
export function connectWebSocket(url) {
    if(url.substring(0,3).indexOf('ws') === -1){
        if(url.indexOf('http') !== -1){
            url = url.replace("http", "ws")
        }else{
            url = location.origin.replace("http", "ws") + url;
        }
    }

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
            reconnectLimit:3,
            reconnectInterval:2000,
            onOpen: () => {
                console.log('WebSocket 连接成功');

                // 定时发送 ping 消息
                send(PING);
                if(pingInterval !== null){
                    clearInterval(pingInterval);
                }
                pingInterval = setInterval(() => {
                    send(PING);
                }, 5000);
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
    websocketStore.send(message);
}
