/**
 * @author MaHaiBing
 * @email  mlt131220@163.com
 * @date   2024/8/4 20:55
 * @description 预览
 */
import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {XRButton} from "three/examples/jsm/webxr/XRButton";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass.js";
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
// 伽马校正后处理Shader
import {GammaCorrectionShader} from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import {useAddSignal, useDispatchSignal} from "@/hooks/useSignal";
import {XR} from "@/core/Viewport.XR";
import ViewCube from "@/core/Viewport.Cube";
import {Package} from "@/core/loader/Package";
import {TweenManger} from "@/core/utils/TweenManager";
import {ShaderMaterialManager} from "@/core/shaderMaterial/ShaderMaterialManager";
import Helper from "@/core/script/Helper";
import {ViewportSignals} from "@/core/preview/Viewport.Signals";
import {ViewportOperation} from "@/core/preview/Viewport.Operation";
import {getMousePosition} from "@/utils/common/scenes";
import FlyTo from "@/core/utils/FlyTo";
import {ClippedEdgesBox} from "@/core/utils/ClippedEdgesBox";
import EsDragControls from "@/core/controls/EsDragControls";
import Measure, {MeasureMode} from "@/core/utils/Measure";
import {MiniMap} from "@/core/utils/MiniMap";
import Roaming from "@/core/utils/Roaming";

const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();

let sceneResizeFn, onKeyDownFn, onKeyUpFn, onPointerDownFn, onPointerUpFn, onPointerMoveFn, animateFn;
let events = {
    init: [],
    start: [],
    stop: [],
    beforeUpdate: [],
    update: [],
    afterUpdate: [],
    beforeDestroy: [],
    destroy: [],
    onKeydown: [],
    onKeyup: [],
    onPointerdown: [],
    onPointerup: [],
    onPointermove: [],
};

export class Viewport {
    private container: HTMLDivElement;
    private scene: THREE.Scene;
    private sceneHelpers: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    outlinePass: OutlinePass;

    css2DRenderer: CSS2DRenderer = new CSS2DRenderer();

    clock: THREE.Clock = new THREE.Clock();
    private readonly xrButton: HTMLElement;
    private raycaster: THREE.Raycaster;

    modules: {
        xr:XR,
        controls:OrbitControls,
        dragControl:EsDragControls,
        viewCube:ViewCube,
        package:Package,
        tweenManager:TweenManger,
        shaderMaterialManager:ShaderMaterialManager,
        operation:ViewportOperation,
        fly:FlyTo,
        registerSignal:ViewportSignals,
        clippedEdges:ClippedEdgesBox,
        measure:Measure,
        miniMap:MiniMap,
        roaming:Roaming
    };

    // animations
    prevActionsInUse = 0;

    // 场景box3
    sceneBox3 = new THREE.Box3();

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.scene = window.editor.scene;
        this.sceneHelpers = window.editor.sceneHelpers;
        this.camera = window.editor.camera;

        this.renderer = this.initEngine();
        const {composer, outlinePass} = this.initComposer();
        this.composer = composer;
        this.outlinePass = outlinePass;

        this.xrButton = XRButton.createButton(this.renderer);

        // 拾取对象
        this.raycaster = new THREE.Raycaster();
        //Raycaster 将只从它遇到的第一个对象中获取信息
        //this.raycaster.firstHitOnly = true;

        this.modules = this.initModules();

        this.initEvent();

        this.loadDefaultEnvAndBackground();
    }

    initEngine() {
        let renderer: THREE.WebGLRenderer | WebGPURenderer;
        // if (WebGPU.isAvailable()) {
        //     console.log("使用WebGPU渲染器");
        //     renderer = new WebGPURenderer({antialias: true});
        //     renderer.toneMapping = THREE.ACESFilmicToneMapping;
        //     renderer.toneMappingExposure = 1;
        // } else {
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        });
        // }

        // 开启模型对象的局部剪裁平面功能. 如果不设置为true，设置剪裁平面的模型不会被剪裁
        renderer.localClippingEnabled = true;

        renderer.autoClear = false;
        renderer.setClearColor(0x272727, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        // renderer.shadowMap.enabled = true; // 允许在场景中使用阴影贴图
        // renderer.shadowMap.type = THREE.BasicShadowMap; // 阴影贴图类型
        renderer.toneMapping = THREE.ACESFilmicToneMapping; // 色调映射

        renderer.setViewport(0, 0, this.container.offsetWidth, this.container.offsetHeight);
        renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        renderer.setPixelRatio(Math.max(Math.ceil(window.devicePixelRatio), 1));
        renderer.xr.enabled = true;
        renderer.domElement.setAttribute("id", "es-3d-preview");
        renderer.domElement.style.touchAction = "none";
        this.container.appendChild(renderer.domElement);

        this.css2DRenderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.css2DRenderer.domElement.setAttribute("id", "es-3d-preview-css2DRenderer");
        this.css2DRenderer.domElement.style.position = 'absolute';
        this.css2DRenderer.domElement.style.top = '0px';
        this.css2DRenderer.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.css2DRenderer.domElement);

        return renderer;
    }

    initComposer(){
        const pixelRatio = this.renderer.getPixelRatio();

        // 创建后处理对象EffectComposer，WebGL渲染器作为参数
        let composer = new EffectComposer(this.renderer);
        composer.setPixelRatio(pixelRatio)
        composer.setSize(this.container.offsetWidth, this.container.offsetHeight);

        let ssaaRenderPass = new SSAARenderPass(this.scene, this.camera);
        ssaaRenderPass.unbiased = false;
        ssaaRenderPass.sampleLevel = 2;
        composer.addPass(ssaaRenderPass);

        const outlinePass = new OutlinePass(new THREE.Vector2(this.container.offsetWidth, this.container.offsetHeight), this.scene, this.camera)
        outlinePass.visibleEdgeColor = new THREE.Color(1, 0.2, 0) // 可见边缘的颜色
        //outlinePass.hiddenEdgeColor = new THREE.Color(0.098, 0.023, 0.007) // 不可见边缘的颜色
        outlinePass.edgeGlow = Number(1.0); // 发光强度
        outlinePass.usePatternTexture = false; // 禁用纹理以获得纯线的效果
        outlinePass.edgeThickness = Number(1.0); // 边缘浓度
        outlinePass.edgeStrength = Number(5.0);  // 边缘的强度，值越高边框范围越大
        outlinePass.pulsePeriod = 0; // 闪烁频率，值越大频率越低
        outlinePass.selectedObjects = [];
        composer.addPass(outlinePass);

        // 创建伽马校正通道. 解决gltf模型后处理时，颜色偏差的问题
        const gammaPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(gammaPass);

        return {composer, outlinePass};
    }

    protected initModules() {
        let modules:any = {};

        modules.xr = new XR(modules.transformControls);

        modules.controls = new OrbitControls(this.camera as THREE.PerspectiveCamera, this.renderer.domElement);
        modules.controls.enableDamping = true;
        modules.controls.dampingFactor = 0.05;
        modules.controls.addEventListener("change", () => {
            if (!this.modules.roaming || !this.modules.roaming.isRoaming) {
                requestIdleCallback(() => {
                    this.render();
                })
            } else {
                if(!this.modules.roaming.person) return;
                // 漫游模式下,玩家跟随旋转
                this.modules.roaming.person.rotation.y = this.modules.controls.getAzimuthalAngle() + Math.PI;
                //this.modules["roaming"].player.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), this.modules["orbit"].getAzimuthalAngle() + Math.PI);
            }
        });

        // 注册拖拽组件
        modules.dragControl = new EsDragControls(this);

        modules.viewCube = new ViewCube(this.camera,this.container,modules.controls);

        modules.package = new Package();

        // 补间动画
        modules.tweenManager = new TweenManger();

        // 相机飞行
        modules.fly = new FlyTo(this.camera,modules.controls);

        modules.shaderMaterialManager = new ShaderMaterialManager();

        // 注册signal
        modules.registerSignal = new ViewportSignals(this);

        // 底部操作栏对应的操作模块
        modules.operation = new ViewportOperation(this);

        // 剖切组件
        modules.clippedEdges = new ClippedEdgesBox(this, modules.controls);

        // 测量组件
        modules.measure = new Measure(this, MeasureMode.Distance);

        // 小地图
        modules.miniMap = new MiniMap(this,{
            mapSize:100,
            mapRenderSize:350,
            followTarget:this.camera,
            isShow:false,
        });

        // 人物漫游
        modules.roaming = new Roaming(this,modules.controls);

        return modules;
    }

    initEvent(){
        sceneResizeFn = this.sceneResize.bind(this);
        useAddSignal("sceneResize", sceneResizeFn);

        onKeyDownFn = this.onKeyDown.bind(this);
        onKeyUpFn = this.onKeyUp.bind(this);
        onPointerDownFn = this.onPointerDown.bind(this);
        onPointerUpFn = this.onPointerUp.bind(this);
        onPointerMoveFn = this.onPointerMove.bind(this);

        animateFn = this.animation.bind(this);
        this.renderer.setAnimationLoop(animateFn);
    }

    /**
     * 加载环境和背景
     * @param definition 分辨率
     */
    loadDefaultEnvAndBackground(definition = 1) {
        window.editor.resource.loadURLTexture(`/upyun/assets/texture/hdr/kloofendal_48d_partly_cloudy_puresky_${definition}k.hdr`, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            if (this.scene) {
                this.scene.environment = texture;
                this.scene.background = texture;
            }
        })
    }

    sceneResize() {
        if (this.camera) {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
            this.camera.updateProjectionMatrix();
        }

        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.composer.setSize(this.container.offsetWidth, this.container.offsetHeight);

        if (this.css2DRenderer) {
            this.css2DRenderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        }

        this.render();
    };

    load(json:ISceneJson) {
        const project = json.project;

        if (project.xr !== undefined) this.renderer.xr.enabled = project.xr;
        if (project.shadows !== undefined) this.renderer.shadowMap.enabled = project.shadows;
        if (project.shadowType !== undefined) this.renderer.shadowMap.type = project.shadowType;
        if (project.toneMapping !== undefined) this.renderer.toneMapping = project.toneMapping;
        if (project.toneMappingExposure !== undefined) this.renderer.toneMappingExposure = project.toneMappingExposure;

        this.sceneResize();
    }

    /**
     * 场景加载完成后调用
     */
    setup(){
        this.handleScripts()

        this.dispatch(events.init, arguments);

        if (this.renderer.xr.enabled) this.container.append(this.xrButton);

        window.addEventListener('keydown', onKeyDownFn);
        window.addEventListener('keyup', onKeyUpFn);
        this.container.addEventListener('pointerdown', onPointerDownFn);
        this.container.addEventListener('pointerup', onPointerUpFn);
        this.container.addEventListener('pointermove', onPointerMoveFn);

        this.dispatch(events.start, arguments);

        // 计算场景box
        this.sceneBox3.setFromObject(this.scene);
    }

    getIntersects(point: THREE.Vector2) {
        const mouse = new THREE.Vector2();
        mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
        this.raycaster.setFromCamera(mouse, this.camera);

        const objects: THREE.Object3D[] = [];
        this.scene.traverseVisible(function (child) {
            objects.push(child);
        });

        return this.raycaster.intersectObjects(objects, false);
    }

    handleScripts(){
        // 注册 Helper
        const helper = new Helper(this.scene as THREE.Scene);

        events = {
            init: [],
            start: [],
            stop: [],
            beforeUpdate: [],
            update: [],
            afterUpdate: [],
            beforeDestroy: [],
            destroy: [],
            onKeydown: [],
            onKeyup: [],
            onPointerdown: [],
            onPointerup: [],
            onPointermove: [],
        };

        let scriptWrapParams = 'helper,renderer,scene,camera,controls,clock';
        const scriptWrapResultObj = {};

        for (const eventKey in events) {
            scriptWrapParams += ',' + eventKey;
            scriptWrapResultObj[eventKey] = eventKey;
        }

        const scriptWrapResult = JSON.stringify(scriptWrapResultObj).replace(/"/g, '');

        for (const uuid in window.editor.scripts) {
            const object = this.scene?.getObjectByProperty('uuid', uuid);

            if (object === undefined) {
                console.warn('Preview: Script without object.', uuid);
                continue;
            }

            const scripts = window.editor.scripts[uuid];

            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const functions = (new Function(scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';').bind(object))(helper, this.renderer, this.scene, this.camera, this.modules.controls, this.clock);

                for (const name in functions) {
                    if (functions[name] === undefined) continue;

                    if (events[name] === undefined) {
                        console.warn('Preview: Event type not supported (', name, ')');
                        continue;
                    }

                    events[name].push(functions[name].bind(object));
                }
            }
        }
    }

    handleClick(){
        if (onDownPosition.distanceTo(onUpPosition) === 0) {
            const intersects = this.getIntersects(onUpPosition);
            useDispatchSignal("intersectionsDetected", intersects);
            this.render();
        }
    }

    animation() {
        this.modules.tweenManager?.update();

        let needsUpdate = false;

        const delta = this.clock.getDelta();
        const mixer = Helper.mixer;
        if (mixer) {
            // @ts-ignore Animations
            const actions = mixer.stats.actions;
            if (actions.inUse > 0 || this.prevActionsInUse > 0) {
                this.prevActionsInUse = actions.inUse;

                mixer.update(delta);
                needsUpdate = true;
            }
        }

        this.modules.controls?.update();
        this.modules.viewCube.update();
        this.modules.miniMap.update();
        this.modules.shaderMaterialManager.update();
        if(this.modules.shaderMaterialManager.needRender){
            needsUpdate = true;
        }

        if (this.renderer?.xr.isPresenting) {
            needsUpdate = true;
        }

        if (this.modules.roaming?.isRoaming) {
            needsUpdate = true;
        }

        if(needsUpdate) {
            this.dispatch(events.beforeUpdate, arguments);
            this.render(delta);
        }
    }

    render(delta?: number) {
        if(!delta){
            delta = Math.min(this.clock.getDelta(), 0.05);
        }

        try {
            this.dispatch(events.update, {time: this.clock.elapsedTime, delta: delta});
        } catch (e: any) {
            console.error((e.message || e), (e.stack || ''));
        }

        this.renderer.autoClear = false;

        if (this.modules.roaming?.isRoaming) {
            const roamingDelta = delta / 3;
            for (let i = 0; i < 3; i++) {
                this.modules.roaming.render(roamingDelta);
            }
        }

        this.composer.render(delta);

        this.renderer.render(this.sceneHelpers, this.camera);
        // css2d 在sceneHelpers内
        this.css2DRenderer.render(this.sceneHelpers, this.camera);

        this.renderer.autoClear = true;

        this.dispatch(events.afterUpdate, arguments);
    }

    /**
     * 重置场景,会从window.editor.reset()中调用
     */
    reset(){
        // 清空 css2DRenderer
        this.css2DRenderer.domElement.innerHTML = "";
    }

    dispose() {
        this.dispatch(events.beforeDestroy, arguments);

        this.composer.dispose();
        this.renderer.dispose();

        this.container.removeChild(this.renderer.domElement);
        this.container.removeChild(this.css2DRenderer.domElement);

        Object.keys(this.modules).forEach(key => {
            this.modules[key].dispose && this.modules[key].dispose();
        })

        sceneResizeFn = undefined;
        onKeyDownFn = undefined;
        onKeyUpFn = undefined;
        onPointerDownFn = undefined;
        onPointerUpFn = undefined;
        onPointerMoveFn = undefined;

        animateFn = undefined;

        this.dispatch(events.destroy, arguments);
    }

    /* 事件 */
    dispatch(array: any[], event: any) {
        for (let i = 0, l = array.length; i < l; i++) {
            array[i](event);
        }
    }

    onKeyDown(event: Event) {
        this.dispatch(events.onKeydown, event);
    }

    onKeyUp(event: Event) {
        this.dispatch(events.onKeyup, event);
    }

    onPointerDown(event: MouseEvent) {
        this.dispatch(events.onPointerdown, event);

        // 右键不触发点击事件
        if (event.button === 2) return;
        // 正在执行测量时不触发点击事件(必须写在这，不记录点位数据，写在handleClick中的话，由于PointerUp事件触发顺序不同，测量角度时会触发点击事件)
        if(!this.modules.measure.isCompleted) return;

        event.preventDefault();
        const array = getMousePosition(this.container, event.clientX, event.clientY);
        onDownPosition.fromArray(array);
    }

    onPointerUp(event: MouseEvent) {
        this.dispatch(events.onPointerup, event);

        // 右键不触发点击事件
        if (event.button === 2) return;
        // 正在执行测量时不触发点击事件
        if(!this.modules.measure.isCompleted) return;

        const array = getMousePosition(this.container, event.clientX, event.clientY);
        onUpPosition.fromArray(array);
        this.handleClick();
    }

    onPointerMove(event: MouseEvent) {
        this.dispatch(events.onPointermove, event);
    }
}