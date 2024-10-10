import * as THREE from "three";
import {MapControls} from "three/examples/jsm/controls/MapControls";

interface IMiniMapOptions {
    domElement?: HTMLElement;
}

let onPointerDownFn;


export class MiniMap {
    private viewport;
    private mapControl: MapControls;
    private domElement: HTMLElement;
    private miniMapRenderer: THREE.WebGLRenderer;
    private miniMapCamera: THREE.PerspectiveCamera;

    raycaster = new THREE.Raycaster()

    constructor(viewport,options:IMiniMapOptions = {}) {
        this.viewport = viewport;

        this.domElement = options.domElement || this.createDomElement();
        viewport.container.appendChild(this.domElement);

        const {renderer, camera} = this.init();
        this.miniMapRenderer = renderer;
        this.miniMapCamera = camera;

        this.mapControl = this.initControls();

        this.initEvent();

        this.miniMapRenderer.setAnimationLoop(this.miniMapAnimation.bind(this));
    }

    createDomElement(){
        const domElement = document.createElement("div");
        domElement.setAttribute("id", "es-3d-mini-map");
        domElement.style.position = "absolute";
        domElement.style.top = "10px";
        domElement.style.right = "10px";
        domElement.style.width = "250px";
        domElement.style.height = "250px";
        domElement.style.boxShadow = "0px 0px 5px #000";

        return domElement;
    }

    /**
     * 为小地图准备专门的 渲染器 + 摄像机
     */
    init(){
        const miniMapRenderer = new THREE.WebGLRenderer({antialias:true});
        miniMapRenderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight);
        this.domElement.appendChild(miniMapRenderer.domElement);
        miniMapRenderer.setClearColor(0xffffff);

        const miniMapCamera = new THREE.PerspectiveCamera(
            45,
            this.domElement.clientWidth / this.domElement.clientHeight,
            0.1,
            1000
        )
        miniMapCamera.position.set(0, 50, 0)
        miniMapCamera.lookAt(0,0,0);

        return {
            renderer: miniMapRenderer,
            camera: miniMapCamera
        }
    }

    initControls() {
        const controls = new MapControls(this.miniMapCamera, this.miniMapRenderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;

        return controls;
    }

    initEvent(){
        onPointerDownFn = this.onPointerDown.bind(this);
        this.domElement.addEventListener("pointerdown", onPointerDownFn);
    }

    onPointerDown(e: PointerEvent){
        const mousePosition = new THREE.Vector2()

        let x = e.offsetX
        let y  = e.offsetY
        mousePosition.x = ((x / this.domElement.clientWidth) * 2) - 1;
        mousePosition.y = -((y / this.domElement.clientHeight) * 2) + 1;

        this.raycaster.setFromCamera(mousePosition, this.miniMapCamera);
        let intersections = this.raycaster.intersectObject(this.viewport.scene, true);

        if(intersections[0]){
            const point = intersections[0].point;

            // this.miniMapCamera.position.set(point.x, 8, point.z);
            this.viewport.modules.controls.target.set(point.x, 0, point.z);
        }
    }

    miniMapAnimation(){
        this.miniMapRenderer.render(this.viewport.scene, this.miniMapCamera)
    }

    update(){
        this.mapControl.update();
    }

    dispose(){
        this.mapControl.dispose();
        this.miniMapRenderer.dispose();
        this.domElement.removeChild(this.miniMapRenderer.domElement);

        this.domElement.removeEventListener("pointerdown", onPointerDownFn);
        onPointerDownFn = null;
    }
}