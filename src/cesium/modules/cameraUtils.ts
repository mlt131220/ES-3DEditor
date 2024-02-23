import * as Cesium from 'cesium';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";

/**
 * @Date 2022-06-09
 * @Author 二三
 * @param {*} viewer Cesium.Viewer
 * @Description: cesium相机类
 */
export default class CameraUtils {
    viewer: Cesium.Viewer | null;
    entity: Cesium.Entity | null;

    constructor() {
        this.viewer = null;
        this.entity = null;
        this.init();
    }

    init() {
        useAddSignal("cesium_flyTo", this.flyTo.bind(this))
    }

    setViewer(viewer) {
        this.viewer = viewer;

        //修改鼠标操作方式
        this.changeMouseOperate()
    }

    /**
     * 修改鼠标操作方式
     */
    changeMouseOperate() {
        let screenSpaceCameraController = (this.viewer as Cesium.Viewer).scene.screenSpaceCameraController;
        //修改缩放操作
        screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
        //修改旋转操作
        screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG];
    }

    flyTo(lng, lat, distance, pitch = -15, heading = 0.0) {
        const viewer = this.viewer as Cesium.Viewer;
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, distance),
            complete: () => {
                if (this.entity) viewer.entities.remove(this.entity);

                this.entity = new Cesium.Entity({
                    id: 'flyToWJM',
                    position: Cesium.Cartesian3.fromDegrees(lng, lat),
                    //该实体关联的点
                    point: {
                        pixelSize: 1,
                        color: Cesium.Color.WHITE.withAlpha(0.9),
                        outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
                        outlineWidth: 1
                    }
                });
                viewer.entities.add(this.entity);
                viewer.flyTo(this.entity, {
                    offset: {
                        heading: Cesium.Math.toRadians(heading), //航向角（弧度）
                        pitch: Cesium.Math.toRadians(pitch), //俯仰角（弧度）
                        range: distance //距中心的距离，以米为单位
                    }
                });
            }
        });
    }

    /**
     * 销毁
     */
    destroy() {
        useRemoveSignal("cesium_flyTo", this.flyTo.bind(this))
    }
}
