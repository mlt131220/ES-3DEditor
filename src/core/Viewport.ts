import * as THREE from 'three';
// import {ViewHelper as ViewHelperBase} from 'three/examples/jsm/helpers/ViewHelper.js';
import {TransformControls} from "three/examples/jsm/controls/TransformControls";

import {EditorControls} from "@/core/controls/EditorControls";
import ViewCube from "./Viewport.Cube";
import {SetPositionCommand} from "@/core/commands/SetPositionCommand";
import {SetRotationCommand} from "@/core/commands/SetRotationCommand";
import {SetScaleCommand} from "@/core/commands/SetScaleCommand";
import {useDispatchSignal} from "@/hooks/useSignal";
import {GRID_COLORS_DARK, GRID_COLORS_LIGHT} from "@/utils/common/constant";
import {getMousePosition} from "@/utils/common/scenes";
import { XR } from './Viewport.XR';
import {ViewportSignals} from "@/core/Viewport.Signals";
import { ViewportPathTracer } from './Viewport.PathTracer';
import {TweenManger} from "@/core/utils/TweenManager";
import {ShaderMaterialManager} from "@/core/shaderMaterial/ShaderMaterialManager";
import {Package} from "@/core/loader/Package";
import FlyTo from "@/core/utils/FlyTo";

const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDoubleClickPosition = new THREE.Vector2();

let mouseUpFn;

// animations
let prevActionsInUse = 0;
const clock = new THREE.Clock();

// 计算帧时
let startTime = 0;
let endTime = 0;

export class Viewport {
    private container: HTMLDivElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private sceneHelpers: THREE.Scene;
    private renderer: THREE.WebGLRenderer | undefined;
    private pmremGenerator: THREE.PMREMGenerator | undefined;
    private pathtracer:ViewportPathTracer | undefined;
    private showSceneHelpers: boolean = true;

    private grid: THREE.Group;
    private box = new THREE.Box3();
    private selectionBox: THREE.Box3Helper;
    private raycaster: THREE.Raycaster;

    private modules: {
        xr:XR,
        controls:EditorControls,
        transformControls:TransformControls,
        viewCube:ViewCube,
        fly:FlyTo,
        package:Package,
        tweenManager:TweenManger,
        registerSignal:ViewportSignals,
        shaderMaterialManager:ShaderMaterialManager
    };

    constructor(container: HTMLDivElement) {
        this.container = container;

        this.scene = window.editor.scene;
        this.camera = window.editor.camera;
        this.sceneHelpers = window.editor.sceneHelpers;

        /** helpers **/
        this.grid = new THREE.Group();
        this.initGrid();

        //选中时的包围框
        this.selectionBox = new THREE.Box3Helper(this.box);
        (this.selectionBox.material as THREE.Material).depthTest = false;
        (this.selectionBox.material as THREE.Material).transparent = true;
        this.selectionBox.visible = false;
        this.sceneHelpers.add(this.selectionBox);

        // 拾取对象
        this.raycaster = new THREE.Raycaster();
        //Raycaster 将只从它遇到的第一个对象中获取信息
        //this.raycaster.firstHitOnly = true;

        this.modules = this.initModules();

        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.container.addEventListener('dblclick', this.onDoubleClick.bind(this));
    }

    protected initRenderer(newRenderer: THREE.WebGLRenderer) {
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
            this.renderer.dispose();
            this.pmremGenerator?.dispose();

            this.container.removeChild(this.renderer.domElement);
        }

        this.renderer = newRenderer;

        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.renderer.setClearColor(0xaaaaaa, 1);

        if (window.matchMedia) {
            const grid1 = this.grid.children[0];
            const grid2 = this.grid.children[1];

            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (event) => {
                this.renderer?.setClearColor(event.matches ? 0x333333 : 0xaaaaaa);
                updateGridColors(grid1, grid2, event.matches ? GRID_COLORS_DARK : GRID_COLORS_LIGHT);
                this.render();
            });

            this.renderer.setClearColor(mediaQuery.matches ? 0x333333 : 0xaaaaaa);
            updateGridColors(grid1, grid2, mediaQuery.matches ? GRID_COLORS_DARK : GRID_COLORS_LIGHT);
        }

        this.renderer.setPixelRatio(Math.max(Math.ceil(window.devicePixelRatio), 1));
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);

        // 创建一个PMREMGenerator，从立方体映射环境纹理生成预过滤的 Mipmap 辐射环境贴图
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        this.pathtracer = new ViewportPathTracer(this.renderer);

        // this.container.appendChild(this.renderer.domElement);
        // 在container中最前面插入渲染器的dom元素
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        this.loadDefaultEnvAndBackground();

        this.render();
    }

    protected initGrid() {
        const grid1 = new THREE.GridHelper(1000, 1000);
        // @ts-ignore
        grid1.material.color.setHex(0x999999);
        (grid1.material as THREE.Material).vertexColors = false;
        this.grid.add(grid1);

        const grid2 = new THREE.GridHelper(1000, 2);
        // @ts-ignore
        grid2.material.color.setHex(0x777777);
        (grid2.material as THREE.Material).vertexColors = false;
        this.grid.add(grid2);
    }

    protected initModules() {
        const controls = new EditorControls(this.camera, this.container);
        controls.addEventListener("change", () => {
            useDispatchSignal("cameraChanged", this.camera);
            useDispatchSignal("refreshSidebarObject3D", this.camera);
        });

        let objectPositionOnDown = new THREE.Vector3();
        let objectRotationOnDown = new THREE.Euler();
        let objectScaleOnDown = new THREE.Vector3();
        const transformControls = new TransformControls(this.camera, this.container);
        transformControls.addEventListener("change", () => {
            const object = transformControls.object;

            if (object !== undefined) {
                this.box.setFromObject(object, true);

                const helper = window.editor.helpers[object.id];
                if (helper !== undefined && !helper.isSkeletonHelper) {
                    helper.update();
                }

                useDispatchSignal("refreshSidebarObject3D", object);
            }

            this.render();
        })
        transformControls.addEventListener("mouseDown", () => {
            const object = transformControls.object as THREE.Object3D;

            objectPositionOnDown = object.position.clone();
            objectRotationOnDown = object.rotation.clone();
            objectScaleOnDown = object.scale.clone();

            this.modules.controls.enabled = false;
        })
        transformControls.addEventListener("mouseUp", () => {
            const object = transformControls.object as THREE.Object3D;

            if (object !== undefined) {
                switch (transformControls.getMode()) {
                    case 'translate':
                        if (!objectPositionOnDown.equals(object.position)) {
                            window.editor.execute(new SetPositionCommand(object, object.position, objectPositionOnDown));
                        }
                        break;
                    case 'rotate':
                        if (!objectRotationOnDown.equals(object.rotation)) {
                            window.editor.execute(new SetRotationCommand(object, object.rotation, objectRotationOnDown));
                        }
                        break;
                    case 'scale':
                        if (!objectScaleOnDown.equals(object.scale)) {
                            window.editor.execute(new SetScaleCommand(object, object.scale, objectScaleOnDown));
                        }
                        break;
                }
            }
            this.modules.controls.enabled = true;
        })
        this.sceneHelpers.add(transformControls);

        // const viewHelper = new ViewHelperBase(this.camera, this.container);
        // viewHelper.controls = controls;

        return {
            xr: new XR(transformControls),
            controls,
            transformControls,
            viewCube: new ViewCube(this.camera,this.container,controls),
            // viewHelper,
            // 相机飞行
            fly: new FlyTo(this.camera,controls),
            package: new Package(),
            // 补间动画
            tweenManager: new TweenManger(),
            // 注册signal
            registerSignal: new ViewportSignals(this),
            shaderMaterialManager: new ShaderMaterialManager()
        }
    }

    updateAspectRatio() {
        for (const uuid in window.editor.cameras) {
            const camera = window.editor.cameras[uuid];

            const aspect = this.container.offsetWidth / this.container.offsetHeight;

            if (camera.isPerspectiveCamera) {
                camera.aspect = aspect;
            } else {
                camera.left = - aspect;
                camera.right = aspect;
            }

            camera.updateProjectionMatrix();

            const cameraHelper = window.editor.helpers[camera.id];
            if (cameraHelper) cameraHelper.update();
        }
    }

    /**
     * 加载环境和背景
     * @param definition 分辨率
     */
    loadDefaultEnvAndBackground(definition = 2) {
        window.editor.resource.loadURLTexture(`/upyun/assets/texture/hdr/kloofendal_48d_partly_cloudy_puresky_${definition}k.hdr`, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.environment = texture;
            this.scene.background = texture;

            useDispatchSignal("sceneGraphChanged");
        })
    }

    getIntersects(point: THREE.Vector2) {
        const mouse = new THREE.Vector2();
        mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
        this.raycaster.setFromCamera(mouse, this.camera);

        const objects: THREE.Object3D[] = [];
        this.scene.traverseVisible(function (child) {
            objects.push(child);
        });

        this.sceneHelpers.traverseVisible(function (child) {
            if (child.name === 'picker') objects.push(child);
        });

        return this.raycaster.intersectObjects(objects, false);
    }

    handleClick() {
        if (onDownPosition.distanceTo(onUpPosition) === 0) {
            const intersects = this.getIntersects(onUpPosition);
            useDispatchSignal("intersectionsDetected", intersects);
            this.render();
        }
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        const array = getMousePosition(this.container, event.clientX, event.clientY);
        onDownPosition.fromArray(array);
        mouseUpFn = this.onMouseUp.bind(this);
        document.addEventListener('mouseup', mouseUpFn);
    }

    onMouseUp(event: MouseEvent) {
        const array = getMousePosition(this.container, event.clientX, event.clientY);
        onUpPosition.fromArray(array);
        this.handleClick();
        document.removeEventListener('mouseup', mouseUpFn);
        mouseUpFn = undefined;
    }

    onTouchStart(event: TouchEvent) {
        const touch = event.changedTouches[0];
        const array = getMousePosition(this.container, touch.clientX, touch.clientY);
        onDownPosition.fromArray(array);
        mouseUpFn = this.onTouchEnd.bind(this);
        document.addEventListener('touchend', mouseUpFn);
    }

    onTouchEnd(event: TouchEvent) {
        const touch = event.changedTouches[0];
        const array = getMousePosition(this.container, touch.clientX, touch.clientY);
        onUpPosition.fromArray(array);
        this.handleClick();
        document.removeEventListener('touchend', mouseUpFn);
        mouseUpFn = undefined;
    }

    onDoubleClick(event: MouseEvent) {
        const array = getMousePosition(this.container, event.clientX, event.clientY);
        onDoubleClickPosition.fromArray(array);
        const intersects = this.getIntersects(onDoubleClickPosition);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            useDispatchSignal("objectFocused", intersect.object);
        }
    }

    animate() {
        this.modules.tweenManager?.update();

        const mixer = window.editor.mixer;
        const delta = clock.getDelta();

        let needsUpdate = false;
        // Animations
        const actions = mixer.stats.actions;
        if (actions.inUse > 0 || prevActionsInUse > 0) {
            prevActionsInUse = actions.inUse;

            mixer.update(delta);
            needsUpdate = true;

            if (window.editor.selected !== null) {
                // 避免某些蒙皮网格的帧延迟效应(e.g. Michelle.glb)
                window.editor.selected.updateWorldMatrix( false, true );
                //  选择框应反映当前动画状态
                this.selectionBox.box.setFromObject(window.editor.selected, true );
            }
        }

        this.modules.viewCube.update();
        this.modules.shaderMaterialManager.update();
        if(this.modules.shaderMaterialManager.needRender){
            needsUpdate = true;
        }

        if (this.renderer?.xr.isPresenting) {
            needsUpdate = true;
        }

        if (needsUpdate) this.render();

        this.updatePT();
    }

    initPT() {
        if (window.editor.viewportShading === 'realistic') {
            this.pathtracer?.init(this.scene, this.camera);
        }
    }

    updatePTBackground() {
        if (window.editor.viewportShading === 'realistic') {
            this.pathtracer?.setBackground();
        }
    }

    updatePTEnvironment() {
        if (window.editor.viewportShading === 'realistic') {
            this.pathtracer?.setEnvironment();
        }
    }

    updatePTMaterials() {
        if (window.editor.viewportShading === 'realistic' ) {
            this.pathtracer?.updateMaterials();
        }
    }

    updatePT() {
        if (window.editor.viewportShading === 'realistic') {
            this.pathtracer?.update();
            useDispatchSignal("pathTracerUpdated",this.pathtracer?.getSamples())
        }
    }

    render() {
        if (!this.renderer) return;

        startTime = performance.now();

        this.renderer.setViewport(0, 0, this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.render(this.scene, window.editor.viewportCamera);

        if (this.camera === window.editor.viewportCamera) {
            this.renderer.autoClear = false;
            if (this.grid.visible) this.renderer.render(this.grid, this.camera);
            if (this.showSceneHelpers) this.renderer.render(this.sceneHelpers, this.camera);
            // if (!this.renderer.xr.isPresenting) this.modules["viewHelper"].render(this.renderer);
            this.renderer.autoClear = true;
        }

        endTime = performance.now();
        useDispatchSignal("sceneRendered", endTime - startTime);
    }
}

function updateGridColors(grid1, grid2, colors) {
    grid1.material.color.setHex(colors[0]);
    grid2.material.color.setHex(colors[1]);
}