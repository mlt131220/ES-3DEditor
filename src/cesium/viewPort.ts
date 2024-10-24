import * as Cesium from 'cesium';
import CesiumApp from "@/cesium/cesiumApp";
import * as THREE from "three";
import {h} from "vue";
import {useAddSignal, useDispatchSignal, useRemoveSignal} from "@/hooks/useSignal";
// import {TransformControls} from './utils/ThreeTransformControls.js';
import {TransformControls} from "three/examples/jsm/controls/TransformControls.js";
import {SetPositionCommand} from "@/core/commands/SetPositionCommand";
import {SetRotationCommand} from "@/core/commands/SetRotationCommand";
import {SetScaleCommand} from "@/core/commands/SetScaleCommand";
import {NIcon} from "naive-ui";
import { GolfOutline } from '@vicons/ionicons5'
import {getMousePosition} from "@/utils/common/scenes";

/**
 * @Date 2023-02-06
 * @Author 二三
 * @Description: cesium视图出口
 */
export default class ViewPort {
    //核心类
    app: CesiumApp;
    //canvas存放的父级dom
    cesiumParentElement: HTMLElement;
    //three对象
    public _three: {
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        sceneHelpers: THREE.Scene,
        showSceneHelpers:boolean,
        renderer: THREE.WebGLRenderer,
        transformControls:TransformControls | null,
        box: THREE.Box3,//包围盒
    };
    //选中的包围盒
    threeSelectionBox: THREE.Box3Helper;
    // threejs场景定位范围
    minWGS84: Array<number>;
    maxWGS84: Array<number>;
    animationFrameID: number | null;

    constructor(dom) {
        this.app = new CesiumApp(dom);
        this.cesiumParentElement = this.app.cesiumParentElement;
        window.CesiumApp = this.app;

        this.minWGS84 = [100.75483412680308, 22.026856925803223];
        this.maxWGS84 = [100.86206068991605, 21.979558335999187];

        this._three = {
            ...this.app._three,
            transformControls:null,
            box: new THREE.Box3()
        }
        this.threeSelectionBox = new THREE.Box3Helper(this._three.box);
        (this.threeSelectionBox.material as THREE.Material).depthTest = false;
        (this.threeSelectionBox.material as THREE.Material).transparent = true;
        this.threeSelectionBox.visible = false;
        this._three.sceneHelpers.add(this.threeSelectionBox);

        this.animationFrameID = null;

        //处理three canvas 的 transformControls，以便于场景融合;
        this.cesiumParentElement.addEventListener("mousemove",this.handleThreeMouseMove.bind(this))

        this.init();
    }

    init() {
        // 将三维球定位到中国
        this.app.viewer?.camera.setView({
            // Cesium的坐标是以地心为原点，一向指向南美洲，一向指向亚洲，一向指向北极州
            // fromDegrees()方法，将经纬度和高程转换为世界坐标
            destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 24000000),
            orientation: {
                // 指向
                heading: Cesium.Math.toRadians(348.4202942851978),
                // 视角
                pitch: Cesium.Math.toRadians(-90),
                roll: Cesium.Math.toRadians(0),
            },
        });

        this.signalsRegister(true);

        this.handleCesiumEvent();

        this.app.addChinaMask();

        this.addButtonToViewer();

        this.initThreeTransformControls();

        this.calcCenter();

        this.fusionCanvas();

        this.loop();
    }

    /**
     * 相关signals注册
     */
    signalsRegister(isAdd:boolean = true) {
        let _this = this;
        //停止requestAnimationFrame
        function stopLoop(){
            cancelAnimationFrame((_this.animationFrameID as number));
        }
        //显示three辅助
        function handleShowHelpers(showHelpers:boolean){
            _this._three.showSceneHelpers = showHelpers;
            (_this._three.transformControls as TransformControls).enabled = showHelpers;
            _this.renderThree();
        }

        const signals = {
            "cesium_stopLoop":stopLoop,
            "showHelpersChanged":handleShowHelpers,
            "cesium_destroy":this.destroy.bind(this)
        }

        Object.keys(signals).forEach(name => {
            isAdd ? useAddSignal(name,signals[name]) : useRemoveSignal(name,signals[name]);
        })
    }

    /**
     *
     */
    addButtonToViewer(){
        let _this = this;
        const vNode = h("button",{
            type:"button",
            class:"cesium-button cesium-toolbar-button",
            title:"飞行至ThreeJS场景",
            onClick(){
                _this.flyToThree();
            }
        },h(NIcon,{size:22},h(GolfOutline)))

        this.app.addVNodeToViewer(vNode)
    }

    /**
     * cesium 开始加载后的相关操作
     */
    handleCesiumEvent() {
        /* 监听cesium 加载完成事件 */
        const removeOnloadCallback = this.app.helper.add(this.app.viewer.scene.globe.tileLoadProgressEvent, event => {
            if (event == 0) {
                console.log('-------------cesium 加载完成---------------');
                this.flyToThree();
                removeOnloadCallback();
            }
        });

        // 绑定屏幕空间事件(单击)
        // let handler = new Cesium.ScreenSpaceEventHandler(this.app.viewer.scene.canvas);
        // handler.setInputAction(function (event) {
        // 	console.log('左键单击', event);
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        //监听Cesium相机高度变化
        this.app.viewer.camera.changed.addEventListener(() => {
            // 变化后高度
            // let height= viewer.camera.positionCartographic.height;
        });

        //移除左键双击事件
        this.app.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    /**
     * 初始化three变换控制器
     */
    initThreeTransformControls() {
        let objectPositionOnDown: THREE.Vector3 | null = null;
        let objectRotationOnDown: THREE.Euler | null = null;
        let objectScaleOnDown: THREE.Vector3 | null = null;
        this._three.transformControls = new TransformControls(this._three.camera, this._three.renderer.domElement);
        let transformControls = this._three.transformControls;
        transformControls.addEventListener('change', () => {
            transformControls.updateMatrixWorld();
            const object = transformControls.object;
            if (object !== undefined) {
                this._three.box.setFromObject(object, true);
                const helper = window.editor.helpers[object.id];
                if (helper !== undefined && !helper.isSkeletonHelper) {
                    helper.update();
                }
                useDispatchSignal("objectChanged", object);

                // 绑定物体不能去到地下
                if(object.position.y < 0){
                    object.position.setY(0);
                }
            }

            this.renderThree();
        });
        transformControls.addEventListener('mouseDown', ()=>{
            const object = transformControls.object as THREE.Object3D;
            objectPositionOnDown = object.position.clone();
            objectRotationOnDown = object.rotation.clone();
            objectScaleOnDown = object.scale.clone();

            // TODO 此时应该停止其他控制器和cesium渲染
            // controls.enabled = false;
            useDispatchSignal("cesium_stopLoop");
        });
        //记录行为
        transformControls.addEventListener('mouseUp', ()=>{
            const object = transformControls.object;

            if (object !== undefined) {
                switch (transformControls.getMode()) {
                    case 'translate':
                        if (!objectPositionOnDown?.equals(object.position)) {
                            window.editor.execute(new SetPositionCommand(object, object.position, objectPositionOnDown));
                        }
                        break;
                    case 'rotate':
                        if (!objectRotationOnDown?.equals(object.rotation)) {
                            window.editor.execute(new SetRotationCommand(object, object.rotation, objectRotationOnDown));
                        }
                        break;
                    case 'scale':
                        if (!objectScaleOnDown?.equals(object.scale)) {
                            window.editor.execute(new SetScaleCommand(object, object.scale, objectScaleOnDown));
                        }
                        break;
                }
            }

            // TODO 此时应该重新启用其他控制器和cesium渲染
            //controls.enabled = true;
            this.loop()
        });
        transformControls.traverse(child => {
            child.userData.isTransformControls = true;
        })
        this._three.sceneHelpers.add(transformControls);

        //相关方法
        const attachObject = (object) => {
            // this.threeSelectionBox.visible = false;
            transformControls.detach();
            if (object !== null && object !== this._three.scene && object !== this._three.camera) {
                // this._three.box.setFromObject(object, true);
                // if (!this._three.box.isEmpty()) {
                //     this.threeSelectionBox.visible = true;
                // }
                // console.log("attach",object)
                transformControls.attach(object);
            }
            this.renderThree();
        }

        /* transformControls相关的监听 */
        //监听融合场景下的three scene下的点击
        useAddSignal("cesium_clickThreeScene", (object) => {
            attachObject(object)
        })
        useAddSignal("transformModeChanged", (mode) => {
            transformControls.setMode(mode);
        });
        useAddSignal("objectSelected", (object) => {
            attachObject(object)
        });
        useAddSignal("objectRemoved", (object) => {
            if (object === transformControls.object) {
                transformControls.detach();
            }
        });
    }

    /**
     * 计算场景中心位置等信息
     */
    calcCenter(){
        let cartToVec = function (cart) {
            return new THREE.Vector3(cart.x, cart.y, cart.z);
        };

        //将Three.js网格配置为与地球中心位置垂直向上
        let minWGS84 = this.minWGS84;
        let maxWGS84 = this.maxWGS84;
        // 转换纬度/长中心位置为笛卡尔3
        let center = cartToVec(Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2));
        //得到面向模型的前向方向
        let centerHigh = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 1);
        //使用从左下到左上的方向作为上向量
        let bottomLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1]));
        let topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
        let latDir = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize();
        // 配置实体的位置和方向
        this._three.scene.position.copy(center);
        this._three.scene.lookAt(centerHigh.x, centerHigh.y, centerHigh.z);
        this._three.scene.up.copy(latDir);
        this._three.scene.rotateX(Math.PI / 2);
        //sceneHelpers 也需要相同操作
        // this._three.sceneHelpers.position.copy(center);
        // this._three.sceneHelpers.lookAt(centerHigh.x, centerHigh.y, centerHigh.z);
        // this._three.sceneHelpers.up.copy(latDir);
        // this._three.sceneHelpers.rotateX(Math.PI / 2);
    }

    /**
     * 处理three canvas 的 transformControls，以便于场景融合;
     */
    handleThreeMouseMove(event){
        //如果未绑定变换物体则不执行任何逻辑
        if(!this._three.transformControls?.object) return;

        const threeCanvas = this._three.renderer.domElement;

        const onDownPosition = new THREE.Vector2();
        let rayCaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        const array = getMousePosition(threeCanvas, event.clientX, event.clientY);
        onDownPosition.fromArray(array);

        mouse.set( ( onDownPosition.x * 2 ) - 1, - ( onDownPosition.y * 2 ) + 1 );
        //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
        rayCaster.setFromCamera(mouse, this._three.camera);

        const intersects = rayCaster.intersectObjects(this._three.sceneHelpers.children, true);

        if(intersects.length === 0) {
            threeCanvas.style.pointerEvents = 'none';
            return;
        }

        let _object = intersects[0].object;

        if(!_object.userData.isTransformControls){
            threeCanvas.style.pointerEvents = 'none';
            return;
        }

        if(_object.type !== "TransformControlsPlane" && _object.type !== "Line" && _object.children.length === 0){
            threeCanvas.style.pointerEvents = 'auto';
        }else{
            threeCanvas.style.pointerEvents = 'none';
        }
    }

    /**
     * 飞行至three场景
     */
    flyToThree(){
        useDispatchSignal("cesium_flyTo", (this.minWGS84[0] + this.maxWGS84[0]) / 2,(this.minWGS84[1] + this.maxWGS84[1]) / 2,3000,-40)
    }

    /* ----------------------------------- 渲染相关 ----------------------------------------------*/

    /**
     * cesium 渲染
     */
    renderCesium() {
        this.app.viewer.render();
    }

    /**
     * 两个画布相机融合
     */
    fusionCanvas() {
        // @ts-ignore 用Cesium注册Three.js场景
        this._three.camera.fov = Cesium.Math.toDegrees(this.app.viewer.camera.frustum.fovy) //ThreeJS FOV是垂直的

        //克隆Cesium Camera的投影位置
        // Three.js对象将出现在相同的位置，因为Cesium Globe上面
        this._three.camera.matrixAutoUpdate = false;
        // 注意这里，three高版本这行代码需要放在 three.camera.matrixWorld 之前
        this._three.camera.lookAt(0, 0, 0);

        let w = this.cesiumParentElement.offsetWidth;
        let h = this.cesiumParentElement.offsetHeight;
        this._three.camera.aspect = w / h;
        this._three.camera.updateProjectionMatrix();

        this._three.renderer.setSize(w,h);
        this._three.renderer.clear();
        this._three.scene.updateMatrixWorld();
    }

    /**
     * three 渲染器的渲染
     */
    renderThree(){
        let cvm = this.app.viewer.camera.viewMatrix;
        let civm = this.app.viewer.camera.inverseViewMatrix;

        this._three.camera.matrixWorld.set(
            civm[0], civm[4], civm[8], civm[12],
            civm[1], civm[5], civm[9], civm[13],
            civm[2], civm[6], civm[10], civm[14],
            civm[3], civm[7], civm[11], civm[15]
        );

        this._three.camera.matrixWorldInverse.set(
            cvm[0], cvm[4], cvm[8], cvm[12],
            cvm[1], cvm[5], cvm[9], cvm[13],
            cvm[2], cvm[6], cvm[10], cvm[14],
            cvm[3], cvm[7], cvm[11], cvm[15]
        );

        this._three.renderer.render(this._three.scene, this._three.camera);

        if (this._three.camera === window.editor.viewportCamera) {
            this._three.renderer.autoClear = false;
            if (this._three.showSceneHelpers) {
                // this._three.sceneHelpers.updateMatrixWorld();
                this._three.renderer.render(this._three.sceneHelpers, this._three.camera);
            }
            this._three.renderer.autoClear = true;
        }
    }

    // 同步渲染
    loop() {
        this.animationFrameID = requestAnimationFrame(this.loop.bind(this));
        this.renderCesium();
        this.renderThree();
    }

    //销毁
    destroy(){
        //停止渲染
        cancelAnimationFrame((this.animationFrameID as number));
        //清除window的挂载
        window.CesiumApp = undefined;
        //销毁变换控制器
        this._three.transformControls?.dispose();

        // 移除signal
        this.signalsRegister(false);

        // 销毁app内容
        this.app.destroy();
    }
}
