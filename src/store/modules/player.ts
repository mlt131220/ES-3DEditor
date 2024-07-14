import { defineStore } from 'pinia';
import { store } from '@/store';
import {reactive, toRefs} from "vue";
import {Player} from "@/core/Player";

interface IPlayerState {
    isPlaying: boolean;
}

/* ------------20240425: 在store外定义并实例化，避免Player成员被Proxy污染---------- */
let _player: Player;
function initPlayer() {
    if (!_player) {
        _player = new Player();
    }

    return _player;
}

/**
 * websocket相关
 */
export const usePlayerStore = defineStore('player',()=>{
    const state = reactive<IPlayerState>({
        isPlaying: false,
    })

    /**
     * getter
     **/
    const player = (): Player => {
        return initPlayer();
    };

    /**
     * actions
     **/
    const start = (json = undefined) => {
        state.isPlaying = true;

        player().start(json || window.editor.toJSON());
    }
    const stop = () => {
        state.isPlaying = false;

        player().stop();
    }
    const dispose = () => {
        state.isPlaying = false;

        player().dispose();
    }

    return {
        ...toRefs(state),
        player,
        start,
        stop,
        dispose
    }
});

// setup 之外使用
export function usePlayerStoreWithOut() {
    return usePlayerStore(store);
}