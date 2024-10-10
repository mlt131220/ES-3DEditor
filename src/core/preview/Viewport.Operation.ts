import * as THREE from "three";
import { Viewport } from "./Viewport";
import {useDispatchSignal} from "@/hooks/useSignal";
import {t} from "@/language";

let RoamPdFn;
export class ViewportOperation {
    viewport:Viewport;

    initCamera:THREE.PerspectiveCamera | undefined;
    // 漫游模式下，上次退出时相机位置
    lastRoadCameraPos = new THREE.Vector3();

    constructor(viewport: Viewport) {
        this.viewport = viewport;
    }

    /**
     * 还原视角
     */
    resetCameraView() {
        if(!this.initCamera) return;

        useDispatchSignal("flyTo",this.initCamera, 600);
    }
    
    /* 选点漫游 */
    enterRoaming(){
        window.$message?.info(t("preview.Please select initial position"));

        const canvas = this.viewport.renderer.domElement;

        const handlePointerDown = (e: MouseEvent) => {
            const raycaster = new THREE.Raycaster();

            const x = e.offsetX;
            const y = e.offsetY;
            const mouse = new THREE.Vector2();
            mouse.x = (x / canvas.offsetWidth) * 2 - 1;
            mouse.y = -(y / canvas.offsetHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.viewport.camera);
            raycaster.firstHitOnly = true;

            let intersects = raycaster.intersectObject(this.viewport.modules.roaming.group, true) || [];
            if (intersects && intersects.length > 0) {
                const intersect = intersects[0];

                // 第三人称
                this.viewport.modules.controls.maxPolarAngle = Math.PI / 2;
                this.viewport.modules.controls.minDistance = 2.5;
                this.viewport.modules.controls.maxDistance = 2.5;

                useDispatchSignal("sceneGraphChanged");

                canvas.removeEventListener("pointerdown", RoamPdFn);
                RoamPdFn = undefined;

                this.lastRoadCameraPos.copy(this.viewport.camera.position);

                const point = new THREE.Vector3(intersect.point.x, intersect.point.y + 2, intersect.point.z);
                this.viewport.modules.roaming.playerInitPos.copy(point);

                this.viewport.modules.roaming.startRoaming();
            }
            return null;
        }

        // 监听选取初始位置
        RoamPdFn = handlePointerDown.bind(this);
        canvas.addEventListener("pointerdown", RoamPdFn);
    }

    /* 退出漫游 */
    leaveRoaming(){
        this.viewport.modules.roaming.exitRoaming(this.lastRoadCameraPos);

        if(RoamPdFn){
            this.viewport.renderer.domElement.removeEventListener("pointerdown", RoamPdFn);
            RoamPdFn = undefined;
        }
    }
}