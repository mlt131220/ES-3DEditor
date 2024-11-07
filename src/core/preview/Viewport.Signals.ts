import {useAddSignal} from "@/hooks/useSignal";

export class ViewportSignals {
    private viewport: any;

    constructor(viewport) {
        this.viewport = viewport;

        this.init();
    }

    init() {
        useAddSignal("sceneGraphChanged", this.sceneGraphChanged.bind(this));
        useAddSignal("objectSelected", this.objectSelected.bind(this));
    }

    /**
     * 手动场景渲染
     */
    sceneGraphChanged(){
        this.viewport.render();
    }

    /**
     * 选中模型
     * @param object
     */
    objectSelected(object) {
        // 漫游模式下不选中
        if(this.viewport.modules.roaming?.isRoaming) {
            this.viewport.outlinePass.selectedObjects = [];
            return;
        }

        if (object !== null && object !== this.viewport.scene && object !== this.viewport.camera) {
            this.viewport.outlinePass.selectedObjects = [object];

            // 相机飞行
            this.viewport.flyToMesh(object,800)
        }
    }

    dispose() {}
}