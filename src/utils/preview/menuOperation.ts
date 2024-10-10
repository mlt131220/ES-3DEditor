import { useFullscreen } from 'vue-hooks-plus';
import {
    IPreviewOperation,
    usePreviewOperationStore,
    usePreviewOperationStoreWithOut
} from "@/store/modules/previewOperation";
import {useDispatchSignal} from "@/hooks/useSignal";
import {MeasureMode} from "@/core/utils/Measure";

/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/8/22
 * @description
 */
const operationStore = usePreviewOperationStoreWithOut();

export class MenuOperation {
    static Init(key: string) {
        if(MenuOperation[key]){
            MenuOperation[key]();
        }else{
            window.$message?.warning("相关模块正在开发中...")
        }
    }

    static toHome() {
        window.viewer.modules.operation.resetCameraView();
    }

    static autoRotate(){
        operationStore.menuList.autoRotate.active = !operationStore.menuList.autoRotate.active;

        window.viewer.modules.controls.autoRotate = operationStore.menuList.autoRotate.active;

        // 打开自动旋转配置面板
        useDispatchSignal("autoRotateConfigModal",operationStore.menuList.autoRotate.active,window.viewer.modules.controls.autoRotateSpeed);
    }

    static cutting(){
        operationStore.menuList.cutting.active = !operationStore.menuList.cutting.active;

        if(operationStore.menuList.cutting.active){
            window.viewer.modules.clippedEdges.open();
        }else{
            window.viewer.modules.clippedEdges.close();
        }
    }

    // 测距
    static distance() {
        // 上一个测量也许未完成
        if(!window.viewer.modules.measure.isCompleted){
            window.viewer.modules.measure.complete();
        }

        window.viewer.modules.measure.mode = MeasureMode.Distance;
        window.viewer.modules.measure.open();

        operationStore.menuList.measure.active = true;
    }

    // 测角度
    static angle() {
        if(!window.viewer.modules.measure.isCompleted){
            window.viewer.modules.measure.complete();
        }

        window.viewer.modules.measure.mode = MeasureMode.Angle;
        window.viewer.modules.measure.open();

        operationStore.menuList.measure.active = true;
    }

    // 测面积
    static area() {
        if(!window.viewer.modules.measure.isCompleted){
            window.viewer.modules.measure.complete();
        }

        window.viewer.modules.measure.mode = MeasureMode.Area;
        window.viewer.modules.measure.open();

        operationStore.menuList.measure.active = true;
    }

    // 清除测量结果
    static clearMeasure(){
        (<{ [key: string]: IPreviewOperation }>usePreviewOperationStore().menuList.measure.children).clearMeasure.disabled = true;
        window.viewer.modules.measure.dispose();

        operationStore.menuList.measure.active = false;
    }

    // 漫游
    static roaming(){
        if (!window.viewer.modules.roaming) return;

        operationStore.menuList.roaming.active = !operationStore.menuList.roaming.active;

        if(operationStore.menuList.roaming.active){
            window.viewer.modules.operation.enterRoaming();
        }else{
            window.viewer.modules.operation.leaveRoaming();
        }
    }

    static miniMap(){
        if(window.viewer.modules.miniMap.isShow){
            operationStore.menuList.miniMap.active = false;
            window.viewer.modules.miniMap.close();
        }else{
            operationStore.menuList.miniMap.active = true;
            window.viewer.modules.miniMap.open();
        }
    }

    static fullscreen(){
        const [,{ enterFullscreen }] = useFullscreen();

        operationStore.menuList.fullscreen.show = false;
        operationStore.menuList.exitFullscreen.show = true;

        enterFullscreen();
    }

    static exitFullscreen(){
        const [,{ exitFullscreen }] = useFullscreen();

        operationStore.menuList.fullscreen.show = true;
        operationStore.menuList.exitFullscreen.show = false;

        exitFullscreen();
    }
}