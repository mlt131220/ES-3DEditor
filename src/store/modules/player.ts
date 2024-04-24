import { defineStore } from 'pinia';
import { store } from '@/store';
import {reactive, toRefs} from "vue";
import {Player} from "@/core/Player";

interface IPlayerState {
    playerInstance: Player | null;
    isPlaying: boolean;
}

/**
 * websocket相关
 */
export const usePlayerStore = defineStore('player',()=>{
    const state = reactive<IPlayerState>({
        playerInstance: null,
        isPlaying: false,
    })

    /**
     * getter
     **/
    const player = (): Player => {
        if (!state.playerInstance) {
            state.playerInstance = new Player();
        }
        return state.playerInstance as Player;
    };

    /**
     * actions
     **/
    const start = (json = undefined) => {
        state.isPlaying = true;
        window.editor.history.historyDisabled = true;

        player().start(json || window.editor.toJSON());
    }
    const stop = () => {
        state.isPlaying = false;
        window.editor.history.historyDisabled = false;

        player().stop();
    }

    return {
        ...toRefs(state),
        player,
        start,
        stop,
    }
});

// setup 之外使用
export function usePlayerStoreWithOut() {
    return usePlayerStore(store);
}