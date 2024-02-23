import MapLayer from "@/cesium/modules/mapLayer";
import CameraUtils from "@/cesium/modules/cameraUtils";
import * as Cesium from 'cesium';
import * as THREE from "three";
import {useDispatchSignal} from "@/hooks/useSignal";
import {render, VNode} from "vue";

/**
 * @Date 2023-03-07
 * @Author 二三
 * @Description: cesium核心
 */
const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();

export default class CesiumApp {
    //挂载的 Dom的Id
    dom: HTMLElement;
    //canvas存放的父级dom
    cesiumParentElement:HTMLElement;
    //
    viewer: Cesium.Viewer;
    //
    helper: Cesium.EventHelper;
    //cesium模块
    module: {
        mapLayer: MapLayer,
        cameraUtils:CameraUtils
    }
    //three对象
    public _three:{
        camera:THREE.PerspectiveCamera,
        scene:THREE.Scene,
        sceneHelpers:THREE.Scene,
        showSceneHelpers:boolean,
        renderer:THREE.WebGLRenderer
    }

    constructor(dom) {
        this.dom = dom;
        // 提前实例化相关模块
        this.module = {
            mapLayer: new MapLayer(),
            cameraUtils:new CameraUtils()
        };

        Cesium.Ion.defaultAccessToken = window.editor.config.getKey('cesium/token');
        /**
         * 避免https://api.cesium.com/v1/assets/1/endpoint?access_token=xxxx请求
         * 1、baseLayerPicker: false必须添加
         * 2、必须给一个imageryProvider作为默认底图
         */
        this.viewer = this.getViewer();
        this.helper = new Cesium.EventHelper();
        this.handleInitCesiumAfter();

        /* 初始化threejs相关(使用threejs场景的camera、scene、renderer) */
        this.cesiumParentElement = this.viewer.cesiumWidget.canvas.parentElement as HTMLElement;
        this._three = {
            camera: window.editor.camera,
            scene: window.editor.scene,
            sceneHelpers: new THREE.Scene(), //不使用window.editor.sceneHelpers,避免两个辅助场景内容重合
            showSceneHelpers:true,
            renderer:new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                // logarithmicDepthBuffer:false,//重叠闪烁
            })
        }
        // 注意这里，直接把three容器（canvas 添加到 cesium中，在cesium的canvas之下），这样的话，两个canvas才会重叠起来。
        this.cesiumParentElement.appendChild(this._three.renderer.domElement);

        //添加场景的事件监听
        this.eventListener();
    }

    getViewer(){
        return new Cesium.Viewer(this.dom, {
            animation: false, //是否创建动画小器件，左下角仪表
            baseLayerPicker: true, //是否显示图层选择器
            fullscreenButton: false, //是否显示全屏按钮
            geocoder: true, //是否显示geocoder小器件，位置查找工具
            homeButton: false, //是否显示Home按钮，返回初始位置
            vrButton: false, // VR
            infoBox: false, //是否显示点击要素之后显示的信息
            sceneModePicker: false, //是否显示3D/2D选择器 - 选择视角的模式（球体、平铺、斜视平铺）
            selectionIndicator: false, //是否显示选取指示器组件
            timeline: false, //是否显示底部时间轴
            navigationHelpButton: false, //是否显示右上角的帮助按钮
            scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
            // @ts-ignore
            clock: new Cesium.Clock(), //用于控制当前时间的时钟对象
            selectedImageryProviderViewModel: undefined, //当前图像图层的显示模型，仅baseLayerPicker设为true有意义
            selectedTerrainProviderViewModel: undefined, //当前地形图层的显示模型，仅baseLayerPicker设为true有意义
            imageryProvider: this.module.mapLayer.getDefaultLayer(window.editor.config.getKey('cesium/defaultMapType')),
            terrainProvider: new Cesium.EllipsoidTerrainProvider(), //地形图层提供者，仅baseLayerPicker设为false有意义
            fullscreenElement: document.body, //全屏时渲染的HTML元素,
            useDefaultRenderLoop: false, //如果需要控制渲染循环，则设为true
            targetFrameRate: undefined, //使用默认render loop时的帧率
            showRenderLoopErrors: true, //如果设为true，将在一个HTML面板中显示错误信息
            automaticallyTrackDataSourceClocks: true, //自动追踪最近添加的数据源的时钟设置
            contextOptions: undefined, //传递给Scene对象的上下文参数（scene.options）
            sceneMode: Cesium.SceneMode.SCENE3D, //初始场景模式
            mapProjection: new Cesium.WebMercatorProjection(), //地图投影体系
            dataSources: new Cesium.DataSourceCollection(), //需要进行可视化的数据源的集合
        });
    }

    /**
     * 场景事件监听
     */
    eventListener(){
        this.cesiumParentElement.addEventListener('pointerdown',this.onMouseDown.bind(this),true);
        this.cesiumParentElement.addEventListener('pointerup', this.onMouseUp.bind(this),true);
    }

    getMousePosition(dom, x, y) {
        const rect = dom.getBoundingClientRect();
        return [(x - rect.left)/rect.width, (y - rect.top)/rect.height];
    }

    /**
     * 鼠标按下处理
     * @param event
     */
    onMouseDown(event) {
        event.preventDefault();
        const array = this.getMousePosition(this.cesiumParentElement, event.clientX, event.clientY);
        onDownPosition.fromArray( array );
    }

    /**
     * 鼠标抬起处理
     * @param event
     */
    onMouseUp(event) {
        const array = this.getMousePosition(this.cesiumParentElement, event.clientX, event.clientY );
        onUpPosition.fromArray(array);
        this.handleClick();
    }

    /**
     * three 场景点击事件
     */
    handleClick() {
        if (onDownPosition.distanceTo(onUpPosition) === 0) {
            const intersects = this.getIntersects(onUpPosition);
            if(intersects.length === 0) return;
            let clickObject = intersects[0].object;

            useDispatchSignal("cesium_clickThreeScene",clickObject);
        }
    }

    /**
     * 初始化cesium 场景后的处理操作
     */
    handleInitCesiumAfter() {
        // @ts-ignore 去除logo
        this.viewer.cesiumWidget.creditContainer.style.display = 'none';

        //实例化完图层再添加标记图层
        window.editor.config.getKey('cesium/markMap') && this.viewer.imageryLayers.addImageryProvider(this.module.mapLayer.getMarkMapByDefaultLayer() as Cesium.UrlTemplateImageryProvider);

        //为modules setViewer
        this.module.mapLayer.setViewer(this.viewer);
        this.module.cameraUtils.setViewer(this.viewer);
    }

    /**
     * 添加中国地图遮罩
     */
    addChinaMask() {
        //使用GeoJsonDataSource加载json格式的数据
        let geojsonOptions = {
            clampToGround: true, //必须添加，否则添加实体对象会被覆盖
        };
        let dataSource = Cesium.GeoJsonDataSource.load(
            '/upyun/assets/geojson/china.json',
            geojsonOptions
        );
        dataSource.then(data => {
            this.viewer.dataSources.add(data);
            let entities = data.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                // @ts-ignore
                entity.polygon.material = Cesium.Color.fromCssColorString('rgba(0,0,0,.2)');
            }
        });
    }

    /**
     * 获取与鼠标点击位置射线相交的对象数组
     */
    getIntersects(point) {
        //声明 rayCaster 和 mouse 变量
        let rayCaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
        //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
        rayCaster.setFromCamera(mouse, this._three.camera);

        //获取与射线相交的对象数组， 其中的元素按照距离排序，越近的越靠前。
        //+true，是对其后代进行查找，这个在这里必须加，因为模型是由很多部分组成的，后代非常多。
        return rayCaster.intersectObjects(this._three.scene.children, true);
    }

    /**
     * 添加VNode至 viewer._toolbar
     */
    addVNodeToViewer(vNode:VNode){
        //@ts-ignore
        render(vNode,this.viewer._toolbar);
    }

    /**
     * 重置cesium场景
     */
    reset(){
        console.log("%c重置cesium场景", "background-color: #e0005a; color: #ffffff; font-weight: bold; padding: 4px;border-radius:3px;");
        //销毁viewer
        this.viewer.destroy();
        // 新建viewer
        this.viewer = this.getViewer();
    }

    /**
     * 销毁
     */
    destroy(){
        // 移除事件监听
        this.cesiumParentElement.removeEventListener('pointerdown', this.onMouseDown);
        this.cesiumParentElement.removeEventListener('pointerup', this.onMouseUp);

        //销毁modules
        this.module.cameraUtils.destroy();

        //销毁viewer
        this.viewer.destroy();
    }
}
