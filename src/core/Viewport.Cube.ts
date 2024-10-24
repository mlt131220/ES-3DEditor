import * as THREE from "three";
import type CameraControls from 'camera-controls';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";

export type Orientation = {
    offsetFactor: {
        x: number;
        y: number;
        z: number;
    };
};

const TOP: Orientation = {
    offsetFactor: {
        x: 0,
        y: 1,
        z: 0,
    },
};

const BOTTOM: Orientation = {
    offsetFactor: {
        x: 0,
        y: -1,
        z: 0,
    },
};

const FRONT: Orientation = {
    offsetFactor: {
        x: 0,
        y: 0,
        z: 1,
    },
};

const BACK: Orientation = {
    offsetFactor: {
        x: 0,
        y: 0,
        z: -1,
    },
};

const LEFT: Orientation = {
    offsetFactor: {
        x: -1,
        y: 0,
        z: 0,
    },
};

const RIGHT: Orientation = {
    offsetFactor: {
        x: 1,
        y: 0,
        z: 0,
    },
};

function epsilon(value) {
    return Math.abs(value) < 1e-10 ? 0 : value;
}

let viewportCameraChangedFn;

class ViewCubeController {
    static CubeOrientation = {
        Top: "top",
        Bottom: "bottom",
        Front: "front",
        Back: "back",
        Left: "left",
        Right: "right",
    };

    static CubeText = {
        top: "上",
        bottom: "下",
        front: "前",
        back: "后",
        left: "左",
        right: "右",
    };

    static ORIENTATIONS = {
        [ViewCubeController.CubeOrientation.Top]: TOP,
        [ViewCubeController.CubeOrientation.Bottom]: BOTTOM,
        [ViewCubeController.CubeOrientation.Front]: FRONT,
        [ViewCubeController.CubeOrientation.Back]: BACK,
        [ViewCubeController.CubeOrientation.Left]: LEFT,
        [ViewCubeController.CubeOrientation.Right]: RIGHT,
    };

    private readonly camera: THREE.Camera;
    private readonly containerDom: HTMLDivElement;
    private viewCubeDom: HTMLDivElement;
    private readonly mat: THREE.Matrix4;
    private controls: CameraControls;

    constructor(camera: THREE.Camera, parentDom: HTMLDivElement,controls:CameraControls) {
        this.camera = camera;
        this.controls = controls;

        const { container,viewCube } = this.createViewCube(parentDom || document.body);
        this.containerDom = container;
        this.viewCubeDom = viewCube;

        this.mat = new THREE.Matrix4();

        viewportCameraChangedFn = this.viewportCameraChanged.bind(this);
        useAddSignal("viewportCameraChanged", viewportCameraChangedFn);
    }

    set visible(value: boolean) {
        this.containerDom.style.display = value ? "block" : "none";
    }

    get visible() {
        return this.containerDom.style.display !== "none";
    }

    viewportCameraChanged(){
        this.visible = window.editor.viewportCamera?.uuid === this.camera.uuid;
    }

    createViewCube(parentDom: HTMLDivElement) {
        const container = document.createElement("div");
        container.id = "es-view-cube-container";

        const viewCube = document.createElement("div");
        viewCube.className = "es-view-cube";

        Object.values(ViewCubeController.CubeOrientation).forEach((orientation) => {
            const face = document.createElement("div");
            face.className = `es-view-cube-face es-view-cube-face--${orientation}`;
            face.innerText = ViewCubeController.CubeText[orientation];
            face.addEventListener("click", () => {
                this.tweenCamera(ViewCubeController.ORIENTATIONS[orientation]);
            })

            viewCube.appendChild(face);
        });

        container.appendChild(viewCube);
        /*---------20240428:直接加在parentDom下无法触发点击事件-----------*/
        (parentDom.parentElement as HTMLDivElement).appendChild(container);

        return {container,viewCube};
    }

    getCameraCSSMatrix(matrix) {
        const {elements} = matrix;

        return `matrix3d(
            ${epsilon(elements[0])},
            ${epsilon(-elements[1])},
            ${epsilon(elements[2])},
            ${epsilon(elements[3])},
            ${epsilon(elements[4])},
            ${epsilon(-elements[5])},
            ${epsilon(elements[6])},
            ${epsilon(elements[7])},
            ${epsilon(elements[8])},
            ${epsilon(-elements[9])},
            ${epsilon(elements[10])},
            ${epsilon(elements[11])},
            ${epsilon(elements[12])},
            ${epsilon(-elements[13])},
            ${epsilon(elements[14])},
            ${epsilon(elements[15])})`;
    }

    tweenCamera(orientation: Orientation) {
        const {offsetFactor} = orientation;

        if (this.camera) {
            const controlCenter = new THREE.Vector3();
            this.controls.getTarget(controlCenter);

            const offsetUnit = this.camera.position.distanceTo(controlCenter);
            const offset = new THREE.Vector3(
                offsetUnit * offsetFactor.x,
                offsetUnit * offsetFactor.y,
                offsetUnit * offsetFactor.z
            );

            const center = controlCenter.clone();
            const finishPosition = center.add(offset);

            this.controls.setPosition(...finishPosition.toArray(),true);
        }
    }

    update() {
        this.mat.extractRotation(this.camera.matrixWorldInverse);
        this.viewCubeDom.style.transform = `translateZ(-300px) ${this.getCameraCSSMatrix(this.mat)}`;
    }

    dispose() {
        if (this.containerDom) {
            this.containerDom.remove();
        }

        if(viewportCameraChangedFn){
            useRemoveSignal("viewportCameraChanged",viewportCameraChangedFn);
            viewportCameraChangedFn = null;
        }
    }
}

export default ViewCubeController;
