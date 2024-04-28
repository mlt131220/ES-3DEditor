import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import {useDispatchSignal} from "@/hooks/useSignal";
import {EditorControls} from "@/core/EditorControls";

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
    private style: HTMLStyleElement;
    private readonly mat: THREE.Matrix4;
    private controls: EditorControls;

    constructor(camera: THREE.Camera, parentDom: HTMLDivElement,controls:EditorControls) {
        this.camera = camera;
        this.controls = controls;

        const { container,viewCube,style } = this.createViewCube(parentDom || document.body);
        this.containerDom = container;
        this.viewCubeDom = viewCube;
        this.style = style;

        this.mat = new THREE.Matrix4();
    }

    set visible(value: boolean) {
        this.containerDom.style.display = value ? "block" : "none";
    }

    get visible() {
        return this.containerDom.style.display !== "none";
    }

    createViewCube(parentDom: HTMLDivElement) {
        const container = document.createElement("div");
        container.id = "view-cube-container";

        const viewCube = document.createElement("div");
        viewCube.className = "view-cube";

        Object.values(ViewCubeController.CubeOrientation).forEach((orientation) => {
            const face = document.createElement("div");
            face.className = `view-cube-face view-cube-face--${orientation}`;
            face.innerText = ViewCubeController.CubeText[orientation];
            face.addEventListener("click", () => {
                this.tweenCamera(ViewCubeController.ORIENTATIONS[orientation]);
            })

            viewCube.appendChild(face);
        });

        container.appendChild(viewCube);
        /*---------20240428:直接加在parentDom下无法触发点击事件-----------*/
        (parentDom.parentElement as HTMLDivElement).appendChild(container);

        // 创建css标签写入head
        const style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = `
            #view-cube-container {
               width: 120px;
               height: 120px;
               margin: 10px;
               perspective: 600px;
               position: absolute;
               right: 0;
               bottom: 0;
               z-index: 9999;
               display: block;
            }

            .view-cube {
               width: 100px;
               height: 100px;
               position: relative;
               transform-style: preserve-3d;
               transform: translateZ(-300px);
               text-transform: uppercase;
            }
            
            .view-cube-face {
               display: flex;
               justify-content: center;
               align-items: center;
               position: absolute;
               width: 120px;
               height: 120px;
               border: 1px dashed #808080;
               line-height: 100px;
               font-size: 25px;
               font-weight: bold;
               color: #7d7d7d;
               text-align: center;
               background: #fff;
               transition: all 0.1s;
               cursor: pointer;
               user-select: none;
            }
            
            .view-cube-face:hover {
               background: #adadad;
               color: #fff;
            }

            .view-cube-face--top {
               transform: rotateY(0deg) rotateX(90deg) translateZ(-60px);
            }
            .view-cube-face--bottom {
               transform: rotateX(270deg) translateZ(-60px);
            }
            .view-cube-face--left {
               transform: rotateY(-90deg) rotateX(180deg) rotateZ(0deg) translateZ(-60px);
            }
            .view-cube-face--right {
               transform: rotateY(90deg) rotateX(180deg) rotateZ(0deg) translateZ(-60px);
            }
            .view-cube-face--front {
               transform: rotateX(180deg) translateZ(-60px);
            }
            .view-cube-face--back {
               transform: rotateZ(180deg) translateZ(-60px);
            }
        `

        document.getElementsByTagName("head").item(0)?.appendChild(style);

        return {container,viewCube,style};
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
            const controlCenter = this.controls.center.clone();

            const offsetUnit = this.camera.position.distanceTo(controlCenter);
            const offset = new THREE.Vector3(
                offsetUnit * offsetFactor.x,
                offsetUnit * offsetFactor.y,
                offsetUnit * offsetFactor.z
            );

            const center = controlCenter.clone();
            const finishPosition = center.add(offset);

            // 摄像机应该始终注视的目标位置
            const targetPosition = controlCenter.clone();

            const positionTween = new TWEEN.Tween(this.camera.position)
                .to(finishPosition, 300)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => {
                    // 更新相机旋转以查看目标位置
                    this.camera.lookAt(targetPosition);
                }).onComplete(() => {
                    useDispatchSignal("tweenRemove", positionTween)
                });

            positionTween.start();
            useDispatchSignal("tweenAdd", positionTween)
        }
    }

    update() {
        this.mat.extractRotation(this.camera.matrixWorldInverse);
        this.viewCubeDom.style.transform = `translateZ(-300px) ${this.getCameraCSSMatrix(this.mat)}`;
    }

    dispose() {
        TWEEN.removeAll();

        if (this.containerDom) {
            this.containerDom.remove();
            this.style.remove();
        }
    }
}

export default ViewCubeController;
