import {Object3D, AnimationAction, LoopOnce, LoopRepeat, LoopPingPong,} from "three";
import type {AnimationActionLoopStyles} from "three";
import Helper from "@/core/script/Helper";

export class Animation {
    object:Object3D;
    actionsMap:Map<string,  AnimationAction>;
    lastPlayedAction:AnimationAction | undefined;
    // 整个动作过程动画剪辑（AnimationClip）执行的次数
    repetitions:number = Infinity;

    static ActionLoop = {
        LoopOnce: LoopOnce,
        LoopRepeat: LoopRepeat,
        LoopPingPong: LoopPingPong,
    }

    constructor(object:Object3D) {
        this.object = object;

        this.actionsMap = this.getActionsMap();
    }

    /**
     * 获取对象的AnimationActions。
     * @returns AnimationAction Map.
     */
    getActionsMap():Map<string,  AnimationAction> {
        const actionsMap = new Map<string,  AnimationAction>();
        const animations = this.object.animations;
        if (animations.length > 0) {
            for ( const animation of animations ) {
                const action = Helper.mixer.clipAction(animation, this.object);
                actionsMap.set(animation.name, action);
            }
        }

        return actionsMap;
    }

    /**
     * 返回 AnimationAction，用于用户直接调用AnimationAction的方法。
     * AnimationAction 文档：https://threejs.org/docs/index.html#api/zh/animation/AnimationAction
     * @param name 动画名称。
     * @returns AnimationAction | undefined
     */
    getAction(name:string):AnimationAction | undefined {
        return this.actionsMap.get(name);
    }

    get actions():AnimationAction[] {
        return Array.from(this.actionsMap.values());
    }

    /**
     * 播放动画,支持链式调用
     */
    play(name:string, loop:AnimationActionLoopStyles = Animation.ActionLoop.LoopRepeat, timeScale:number = 1):Animation {
        const action = this.actionsMap.get(name);
        if (action) {
            action.paused = false;
            action.repetitions = this.repetitions;
            action.loop = loop;
            action.timeScale = timeScale;
            action.play();

            this.lastPlayedAction = action;
        }

        return this;
    }

    /**
     * 暂停动画，支持链式调用
     */
    pause(name:string | undefined):Animation {
        if(name === undefined){
            this.lastPlayedAction && (this.lastPlayedAction.paused = true);

            return this;
        }

        const action = this.actionsMap.get(name);
        if (action) {
            action.paused = true;
        }

        return this;
    }

    /**
     * 停止动画，支持链式调用
     */
    stop(name:string | undefined):Animation {
        if (name === undefined) {
            this.lastPlayedAction &&this.lastPlayedAction.stop();

            this.lastPlayedAction = undefined;
            return this;
        }

        const action = this.actionsMap.get(name);
        if (action) {
            action.stop();
        }

        if (this.lastPlayedAction === action) {
            this.lastPlayedAction = undefined;
        }

        return this;
    }
}