import {useAddSignal} from "@/hooks/useSignal";
import * as THREE from "three";
import {RoomEnvironment} from "three/examples/jsm/environments/RoomEnvironment";

export class ViewportSignals {
    private readonly viewport: any;

    private useBackgroundAsEnvironment = false;

    constructor(viewport) {
        this.viewport = viewport;

        this.init();
    }

    init() {
        useAddSignal("editorCleared", this.editorCleared.bind(this));
        useAddSignal("transformModeChanged", this.transformModeChanged.bind(this));
        useAddSignal("snapChanged", this.snapChanged.bind(this));
        useAddSignal("spaceChanged", this.spaceChanged.bind(this));
        useAddSignal("effectEnabledChange", this.effectEnabledChange.bind(this));

        useAddSignal("rendererUpdated", this.rendererUpdated.bind(this));
        useAddSignal("rendererCreated", this.rendererCreated.bind(this));
        useAddSignal("rendererDetectKTX2Support", this.rendererDetectKTX2Support.bind(this));

        useAddSignal("loadDefaultEnvAndBackground", this.viewport.loadDefaultEnvAndBackground.bind(this.viewport));
        useAddSignal("sceneBackgroundChanged", this.sceneBackgroundChanged.bind(this));
        useAddSignal("sceneEnvironmentChanged", this.sceneEnvironmentChanged.bind(this));
        useAddSignal("sceneFogChanged", this.sceneFogChanged.bind(this));
        useAddSignal("sceneFogSettingsChanged", this.sceneFogSettingsChanged.bind(this));
        useAddSignal("sceneGraphChanged", this.sceneGraphChanged.bind(this));
        useAddSignal("cameraChanged", this.cameraChanged.bind(this));
        useAddSignal("cameraResetted", this.viewport.updateAspectRatio.bind(this.viewport));
        useAddSignal("viewportCameraChanged", this.viewportCameraChanged.bind(this));
        useAddSignal("viewportShadingChanged", this.viewportShadingChanged.bind(this));

        useAddSignal("objectSelected", this.objectSelected.bind(this));
        useAddSignal("objectFocused", this.objectFocused.bind(this));
        useAddSignal("objectAdded", this.objectAdded.bind(this));
        useAddSignal("objectChanged", this.objectChanged.bind(this));
        useAddSignal("objectRemoved", this.objectRemoved.bind(this));

        useAddSignal("geometryChanged", this.geometryChanged.bind(this));
        useAddSignal("materialChanged", this.materialChanged.bind(this));

        useAddSignal("sceneResize", this.sceneResize.bind(this));
        useAddSignal("showGridChanged", this.showGridChanged.bind(this));
        useAddSignal("showHelpersChanged", this.showHelpersChanged.bind(this));
    }

    /**
     * 判断对象是否是可射线选中的
     */
    objectIsCanPick(object:THREE.Object3D){
        return object !== null && object !== this.viewport.scene && object !== this.viewport.camera;
    }

    /**
     * 编辑器清空
     */
    editorCleared() {
        this.viewport.modules.controls.setTarget(0, 0, 0,true);
        this.viewport.pathtracer.reset();

        this.viewport.initPT();
        this.viewport.render();
    }

    /**
     * 模型变换控制器模式改变
     * @param mode
     */
    transformModeChanged(mode) {
        this.viewport.modules["transformControls"].setMode(mode);
    }

    /**
     * 模型变换控制器吸附距离改变
     * @param dist
     */
    snapChanged(dist:number) {
        this.viewport.modules["transformControls"].setTranslationSnap(dist);
    }

    /**
     * 模型变换控制器坐标系改变
     * @param space
     */
    spaceChanged(space:"world" | "local") {
        this.viewport.modules["transformControls"].setSpace(space);
    }

    /**
     * 启用/禁用后处理
     */
    effectEnabledChange(enabled:boolean){
        if(enabled){
            this.viewport.selectionBox.visible = false;

            if (this.objectIsCanPick(window.editor.selected)) {
                this.viewport.modules.effect.outlinePass.selectedObjects = [window.editor.selected];
            }
        }else{
            this.viewport.modules.effect.outlinePass.selectedObjects = [];

            if (this.objectIsCanPick(window.editor.selected)) {
                this.viewport.box.setFromObject(window.editor.selected, true);
                if (this.viewport.box.isEmpty() === false) {
                    this.viewport.selectionBox.visible = true;
                }
            }
        }

        this.render();
    }

    /**
     * 渲染器更新
     */
    rendererUpdated() {
        this.viewport.scene.traverse(function (child) {
            if (child.material !== undefined) {
                child.material.needsUpdate = true;
            }
        });
        this.viewport.render();
    }

    /**
     * 渲染器创建
     * @param newRenderer
     */
    rendererCreated(newRenderer: THREE.WebGLRenderer) {
        this.viewport.initRenderer(newRenderer);
    }

    rendererDetectKTX2Support( ktx2Loader ) {
        ktx2Loader.detectSupport(this.viewport.renderer);
    }

    /**
     * 场景背景变更
     * @param backgroundType
     * @param backgroundColor
     * @param backgroundTexture
     * @param backgroundEquirectangularTexture
     * @param backgroundBlurriness
     * @param backgroundIntensity
     * @param backgroundRotation
     */
    sceneBackgroundChanged(backgroundType:string, backgroundColor:string, backgroundTexture, backgroundEquirectangularTexture, backgroundBlurriness:number,backgroundIntensity:number, backgroundRotation:number){
        this.viewport.scene.background = null;

        switch (backgroundType) {
            case 'Color':
                this.viewport.scene.background = new THREE.Color(backgroundColor);
                break;
            case 'Texture':
                if (backgroundTexture) {
                    this.viewport.scene.background = backgroundTexture;
                }
                break;
            case 'Equirectangular':
                if (backgroundEquirectangularTexture) {
                    backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;

                    this.viewport.scene.background = backgroundEquirectangularTexture;
                    this.viewport.scene.backgroundBlurriness = backgroundBlurriness;
                    this.viewport.scene.backgroundIntensity = backgroundIntensity;
                    this.viewport.scene.backgroundRotation.y = backgroundRotation * THREE.MathUtils.DEG2RAD;

                    if (this.useBackgroundAsEnvironment) {
                        this.viewport.scene.environment = this.viewport.scene.background;
                        this.viewport.scene.environmentRotation.y = backgroundRotation * THREE.MathUtils.DEG2RAD;
                    }
                }
                break;
        }

        this.viewport.updatePTBackground();
        this.render();
    }

    /**
     * 场景环境贴图变更
     * @param environmentType
     * @param environmentEquirectangularTexture
     */
    sceneEnvironmentChanged(environmentType, environmentEquirectangularTexture){
        this.viewport.scene.environment = null;
        this.useBackgroundAsEnvironment = false;

        switch ( environmentType ) {
            case 'Background':
                this.useBackgroundAsEnvironment = true;

                this.viewport.scene.environment = this.viewport.scene.background;
                this.viewport.scene.environment.mapping = THREE.EquirectangularReflectionMapping;
                this.viewport.scene.environmentRotation.y = this.viewport.scene.backgroundRotation.y;
                break;
            case 'Equirectangular':
                if (environmentEquirectangularTexture) {
                    this.viewport.scene.environment = environmentEquirectangularTexture;
                    this.viewport.scene.environment.mapping = THREE.EquirectangularReflectionMapping;
                }
                break;
            case 'ModelViewer':
                this.viewport.scene.environment = this.viewport.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
                break;
        }

        this.viewport.updatePTEnvironment();
        this.render();
    }

    /**
     * 场景雾效变更
     * @param fogType
     * @param fogColor
     * @param fogNear
     * @param fogFar
     * @param fogDensity
     */
    sceneFogChanged(fogType, fogColor, fogNear, fogFar, fogDensity){
        switch (fogType) {
            case 'None':
                this.viewport.scene.fog = null;
                break;
            case 'Fog':
                this.viewport.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
                break;
            case 'FogExp2':
                this.viewport.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
                break;
        }
        this.viewport.render();
    }

    /**
     * 场景雾效设置项变更
     * @param fogType
     * @param fogColor
     * @param fogNear
     * @param fogFar
     * @param fogDensity
     */
    sceneFogSettingsChanged(fogType, fogColor, fogNear, fogFar, fogDensity){
        switch ( fogType ) {
            case 'Fog':
                this.viewport.scene.fog.color.setHex(fogColor);
                this.viewport.scene.fog.near = fogNear;
                this.viewport.scene.fog.far = fogFar;
                break;
            case 'FogExp2':
                this.viewport.scene.fog.color.setHex(fogColor);
                this.viewport.scene.fog.density = fogDensity;
                break;
        }
        this.viewport.render();
    }

    /**
     * 手动场景渲染
     */
    sceneGraphChanged(){
        this.viewport.initPT();
        this.render();
    }

    /**
     * 切换主相机
     */
    cameraChanged(){
        this.viewport.pathtracer.reset();
        this.render();
    }

    /**
     * 场景主相机变更
     */
    viewportCameraChanged(){
        const viewportCamera = window.editor.viewportCamera;
        if ( viewportCamera.isPerspectiveCamera || viewportCamera.isOrthographicCamera ) {
            this.viewport.updateAspectRatio();
        }

        if (viewportCamera.isPerspectiveCamera) {
            viewportCamera.aspect = window.editor.camera.aspect;
            viewportCamera.projectionMatrix.copy(window.editor.camera.projectionMatrix);
        } else if ( viewportCamera.isOrthographicCamera ) {
            // TODO
        }

        // 设置用户Camera时禁用EditorControls
        this.viewport.modules.controls.enabled = (viewportCamera === window.editor.camera);

        // 替换控制器相机
        // this.viewport.modules.controls.camera = viewportCamera;

        this.viewport.initPT();
        this.render();
    }

    /**
     * 场景Shading变更
     */
    viewportShadingChanged(){
        const viewportShading = window.editor.viewportShading;

        switch ( viewportShading ) {
            case 'realistic':
                this.viewport.pathtracer.init(this.viewport.scene, this.viewport.camera);
                break;
            case 'solid':
                this.viewport.scene.overrideMaterial = null;
                break;
            case 'normals':
                this.viewport.scene.overrideMaterial = new THREE.MeshNormalMaterial();
                break;
            case 'wireframe':
                this.viewport.scene.overrideMaterial = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
                break;
        }

        this.render();
    }

    /**
     * 选中模型
     * @param object
     */
    objectSelected(object){
        this.viewport.selectionBox.visible = false;

        this.viewport.modules["transformControls"].detach();
        if (this.objectIsCanPick(object)) {
            if(this.viewport.modules.effect.enabled){
                this.viewport.modules.effect.outlinePass.selectedObjects = [object];
            }else{
                this.viewport.box.setFromObject( object, true );
                if (this.viewport.box.isEmpty() === false) {
                    this.viewport.selectionBox.visible = true;
                }
            }
            this.viewport.modules["transformControls"].attach(object);
        }
        this.render();
    }

    /**
     * 聚焦模型
     * @param object
     */
    objectFocused(object){
        this.viewport.modules.controls.fitToBox(object,true);
    }

    /**
     * 场景新增模型
     */
    objectAdded(){
        this.viewport.computedSceneBox3();
    }

    /**
     * 模型属性变更
     * @param object
     */
    objectChanged(object){
        if (window.editor.selected === object) {
            this.viewport.box.setFromObject(object, true);

            this.viewport.computedSceneBox3();
        }
        if (object.isPerspectiveCamera) {
            object.updateProjectionMatrix();
        }
        const helper = window.editor.helpers[object.id];
        if (helper !== undefined && !helper.isSkeletonHelper) {
            helper.update();
        }

        this.viewport.initPT();
        this.render();
    }

    /**
     * 模型被移除
     * @param object
     */
    objectRemoved(object){
        this.viewport.modules.controls.enabled = true;
        if (object === this.viewport.modules["transformControls"].object) {
            this.viewport.modules["transformControls"].detach();
        }

        this.viewport.computedSceneBox3();
    }

    /**
     * geometry 变更
     * @param object
     */
    geometryChanged(object){
        if (object !== undefined) {
            this.viewport.box.setFromObject(object, true);
        }

        this.viewport.initPT();
        this.render();
    }

    /**
     * material 变更
     */
    materialChanged(){
        this.viewport.updatePTMaterials();
        this.render();
    }

    /**
     * windowResize
     */
    sceneResize(){
        this.viewport.updateAspectRatio();
        this.viewport.renderer?.setSize(this.viewport.container.offsetWidth,this.viewport.container.offsetHeight);
        if(this.viewport.modules.effect.enabled){
            this.viewport.modules.effect.composer.setSize(this.viewport.container.offsetWidth,this.viewport.container.offsetHeight);
            if(this.viewport.modules.effect.pass.fxaa){
                const pixelRatio = this.viewport.renderer.getPixelRatio();
                this.viewport.modules.effect.pass.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / (this.viewport.container.offsetWidth * pixelRatio);
                this.viewport.modules.effect.pass.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / (this.viewport.container.offsetHeight * pixelRatio);
            }
        }
        this.viewport.pathtracer.setSize();
        this.render();
    }

    /**
     * 是否显示场景网格
     * @param showGrid
     */
    showGridChanged(showGrid:boolean){
        this.viewport.grid.visible = showGrid;
        this.render();
    }

    /**
     * 显示场景辅助线等
     * @param showHelpers
     */
    showHelpersChanged(showHelpers:boolean){
        this.viewport.showSceneHelpers = showHelpers;
        this.viewport.modules["transformControls"].enabled = showHelpers;
        this.render();
    }

    /**
     * 渲染
     */
    render(){
        this.viewport.render();
    }
}