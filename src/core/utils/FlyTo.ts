/**
 * @author 二三
 * @email  mlt131220@163.com
 * @date   2024/8/21
 * @description 摄像机飞行方法控制类
 */
import * as THREE from 'three'
import TWEEN from "@tweenjs/tween.js";
import {useSignal} from '@/hooks';

const {add: addSignal, dispatch, remove} = useSignal();

let flyFn;
export default class FlyTo {
    private camera: THREE.PerspectiveCamera;
    private controls: any;

    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;

        flyFn = this.flyTo.bind(this);
        addSignal("flyTo", flyFn);
    }

    /**
     * @param {*} arguments[0] 带有type属性，识别并调用相关方法
     * @param {Number} arguments[1] 相机飞行时间
     * @param {Function} arguments[2] 回调函数
     */
    flyTo() {
        const runTime = arguments[1] === undefined ? 800 : arguments[1];
        const done = arguments[2] === undefined ? () => {
        } : arguments[2];
        switch (arguments[0].type) {
            case "PerspectiveCamera":
                this.flyToCamera(arguments[0], runTime, done);
                break;
            default:
                this.flyToMesh(arguments[0], runTime,arguments[3] || 4, done);
                break;
        }
    }

    flyToCamera(initCamera: THREE.PerspectiveCamera, runTime: number, done = () => {
    }) {
        //设置相机的位置为与目标正面且距离distance的地方
        const cameraToTarget = new TWEEN.Tween(this.camera.position);
        cameraToTarget.to(initCamera.position, runTime);

        let qa = new THREE.Quaternion().copy(this.camera.quaternion); // src quaternion
        let qb = new THREE.Quaternion().setFromEuler(new THREE.Euler().copy(initCamera.rotation)); // dst quaternion
        let qm = new THREE.Quaternion();

        let o = {t: 0};
        const cameraRotation = new TWEEN.Tween(o);
        cameraRotation.to({t: 1}, runTime);

        cameraToTarget.onComplete(() => {
            dispatch("tweenRemove", cameraToTarget);
        });
        cameraRotation.onUpdate(() => {
            // THREE.Quaternion.slerp(qa, qb, qm, o.t);
            qm.slerpQuaternions(qa, qb, o.t)
            this.camera.quaternion.set(qm.x, qm.y, qm.z, qm.w);
        })
        cameraRotation.onComplete(() => {
            dispatch("tweenRemove", cameraRotation);
            done();
        })
        //如果需要相机飞行完成时再调用旋转，则注释 cameraRotation.start()且取消cameraToTarget.chain(cameraRotation)的注释
        // cameraToTarget.chain(cameraRotation);
        cameraToTarget.start();
        cameraRotation.start();
        dispatch("tweenAdd", cameraToTarget);
        dispatch("tweenAdd", cameraRotation);
    }

    /**
     * 飞行至mesh
     */
    flyToMesh(mesh: THREE.Object3D, runTime: number, distanceCoefficient = 4, done = () => {
    }) {
        const center = new THREE.Vector3();
        const delta = new THREE.Vector3();

        const box = new THREE.Box3();
        box.setFromObject(mesh);
        box.getCenter(center);

        const distance = box.getBoundingSphere(new THREE.Sphere()).radius;
        delta.set(0, 0, 1);
        delta.multiplyScalar(distance * distanceCoefficient);

        const targetCamera = this.camera.clone();
        delta.applyQuaternion(targetCamera.quaternion);
        targetCamera.position.copy(center).add(delta);

        const controlsToTarget = new TWEEN.Tween(this.controls.target);
        controlsToTarget.to(center, runTime / 2);
        controlsToTarget.onComplete(() => {
            dispatch("tweenRemove", controlsToTarget);
        });
        controlsToTarget.start();
        dispatch("tweenAdd", controlsToTarget);

        this.flyToCamera(targetCamera, runTime, done);

        // 改变控制器中心点
        // setTimeout(() => {
        //     this.controls.target.copy(center);
        // }, 50);
    }

    dispose() {
        remove("flyTo", flyFn);
    }
}
