import {Scene, AnimationMixer,Object3D} from "three";
import {Animation} from "./Animation";

/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/4/24 10:39
 * @description 迁移Editor.ts中的一些方法（也有新增）提供脚本使用，因为脚本在运行态时执行，应该与原环境隔离
 */
export default class Helper {
    scene: Scene;

    /* 动画 */
    static mixer: AnimationMixer;
    Animation: typeof Animation;

    constructor(scene: Scene) {
        this.scene = scene;

        Helper.mixer = new AnimationMixer(this.scene);

        this.Animation = Animation;

        // 注册一个资源管理类，用于管理资源的加载和释放

        // 注册一个flyControls类，用于控制场景中的物体的飞行动画
    }

    /**
     * 通过uuid获取对象
     * @param uuid
     * @returns THREE.Object3D
     */
    objectByUuid(uuid: string) {
        return this.scene.getObjectByProperty('uuid', uuid);
    }

    /**
     * 移动3D对象到指定位置
     * @param object
     * @param parent
     * @param before
     */
    moveObject(object: Object3D, parent: Object3D, before: Object3D) {
        if (parent === undefined) {
            parent = this.scene;
        }

        parent.add(object);

        // 对子数组进行排序
        if (before !== undefined) {
            const index = parent.children.indexOf(before);
            parent.children.splice(index, 0, object);
            parent.children.pop();
        }
    }

    /**
     * 移除对象
     * @param object
     */
    removeObject(object: Object3D) {
        if (object.parent === null) return;

        // TODO 未处理材质的释放
        object.parent.remove(object);
    }
}