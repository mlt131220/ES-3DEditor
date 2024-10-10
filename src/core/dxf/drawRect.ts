import * as THREE from "three";
import {stopRender, renderLoop, render} from "./drawShare"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {DragControls} from './DragControls.js';

let cpmFn, cpdFn, cpuFn;

function throttle(func, wait) {
    let timer: NodeJS.Timeout | null = null;
    return function (e) {
        if (timer) return;
        timer = setTimeout(function () {
            func(e);
            timer = null;
        }, wait)
    }
}

/**
 * three中绘制矩形
 * @param {THREE.Scene}  scene 场景
 **/
export class DrawRect {
    static RectShapeMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.1,
        color: 0xccebff,
        side: THREE.FrontSide
    });
    static LineMaterial = new THREE.LineBasicMaterial({
        color: 0x15FF00,
        linewidth: 10,
        linecap: 'round',
        linejoin: 'round'
    })
    static HoverLineMaterial = new THREE.LineBasicMaterial({
        color: 0xff0015,
        linewidth: 10,
        linecap: 'round',
        linejoin: 'round'
    })

    private canvas: HTMLCanvasElement;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private controls: OrbitControls | undefined;
    private signal: (args: { type: 'add' | 'remove' | 'dispatch', name: string, data?: any }) => void;
    private middleObject: any;

    private readonly group: THREE.Group;
    private readonly dragObjects: THREE.Group[] = [];
    private readonly dragControls: DragControls;
    private isDrag: boolean = false;

    private tempModelUuid: string | undefined;
    private tempRect: THREE.Group | undefined;
    private downPoint: THREE.Vector2 = new THREE.Vector2();

    constructor(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.OrthographicCamera, signal, middleObject) {
        this.canvas = canvas;
        this.scene = scene;
        this.camera = camera;
        this.signal = signal;

        this.middleObject = middleObject;
        middleObject.markList = []; // 矩形标记数组
        middleObject.selectRectIndex = -1; // 当前选中的矩形下标
        middleObject.selectRect = {}; // 当前选中的矩形数据
        middleObject.hoverRectIndex = -1; // 当前鼠标经过的矩形的下标

        this.group = new THREE.Group();
        this.group.name = "cadDrawRect";
        this.scene.add(this.group);

        this.dragControls = new DragControls(this.dragObjects, camera, canvas);
        this.dragControls.addEventListener("hoveron", (event) => {
            if(this.isDrag) return;

            this.isDrag = true;
            this.controls && (this.controls.enabled = false);

            this.group.children.forEach((child, index) => {
                if (child.userData.rect.modelUuid !== event.object.userData.rect.modelUuid) return;

                this.middleObject.hoverRectIndex = index;

                child.children.forEach((c:any) => {
                    if(c.isLine){
                        c.material = DrawRect.HoverLineMaterial;
                    }
                })
            });
        });
        this.dragControls.addEventListener("dragstart", () => {
            // 有上一次选中
            if(this.middleObject.selectRectIndex !== -1){
                this.group.children[this.middleObject.selectRectIndex]?.children.forEach((c:any) => {
                    if(c.isLine){
                        c.material = DrawRect.LineMaterial;
                    }
                })

                // 两次选中同一个则取消
                if(this.middleObject.selectRectIndex === this.middleObject.hoverRectIndex){
                    this.middleObject.selectRectIndex = -1;
                    this.middleObject.selectRect = {};

                    this.signal({
                        type: "dispatch",
                        name:  "objectFocusByUuid",
                        data: [undefined]
                    })

                    return;
                }
            }

            this.middleObject.selectRectIndex = this.middleObject.hoverRectIndex;
            this.middleObject.selectRect = this.group.children[this.middleObject.selectRectIndex]?.userData.rect;

            this.signal({
                type: "dispatch",
                name: "objectFocusByUuid",
                data: [this.middleObject.selectRect.modelUuid]
            })
        });
        this.dragControls.addEventListener("drag", () => {
            render();
        });
        this.dragControls.addEventListener("dragend", (event) => {
            if (!event.object) return;

            const rectItem = event.object.userData.rect;
            rectItem.x += event.object.position.x;
            rectItem.y += event.object.position.y;

            this.signal({
                type: "dispatch",
                name: "drawingMarkDone",
                data: ["update", rectItem]
            })
        });
        this.dragControls.addEventListener("hoveroff", () => {
            if(!this.isDrag) return;

            this.isDrag = false;
            this.controls && (this.controls.enabled = true);

            // 经过的模型未被选择
            if(this.middleObject.selectRectIndex !== this.middleObject.hoverRectIndex){
                this.group.children[this.middleObject.hoverRectIndex].children.forEach((c:any) => {
                    if(c.isLine){
                        c.material = DrawRect.LineMaterial;
                    }
                })
            }

            this.middleObject.hoverRectIndex = -1;
            render();
        });
        this.dragControls.enabled = true;

        cpmFn = throttle(this.onpointermove.bind(this), 16);
        cpdFn = this.onpointerdown.bind(this);
        cpuFn = this.onpointerup.bind(this);

        this.init();
    }

    init() {
        // 若list长度不为0, 则显示已标记框
        if (this.middleObject.markList.length !== 0) {
            this.middleObject.markList.forEach((item: IDrawingMark) => {
                const rectObject = this.draw(item);
                this.dragObjects.push(rectObject);
            });
        }
    }

    setList({list}) {
        this.middleObject.markList = list;
        this.init();
    }

    // 设置controls
    setControls(controls: OrbitControls) {
        this.controls = controls;
    }

    // 设置选中
    setSelect({modelUuid}){
        // 先去除上一次选中
        this.group.children[this.middleObject.selectRectIndex]?.children.forEach((c:any) => {
            if(c.isLine){
                c.material = DrawRect.LineMaterial;
            }
        })
        this.middleObject.selectRectIndex = -1;
        this.middleObject.selectRect = {};

        if(modelUuid === undefined) return;

        this.group.children.forEach((child, index) => {
                if (child.userData.rect?.modelUuid !== modelUuid) return;

                this.middleObject.selectRectIndex = index;
                this.middleObject.selectRect = child.userData.rect;

                child.children.forEach((c:any) => {
                    if(c.isLine){
                        c.material = DrawRect.HoverLineMaterial;
                    }
                })
            });
    }

    // 还原rect
    restoreRect({rect}) {
        this.group.children.forEach((child, index) => {
            if (child.userData.rect.modelUuid !== rect.modelUuid) return;

            const re = JSON.parse(JSON.stringify(child.userData.rect));

            this.middleObject.markList.splice(index, 1, re);
            this.group.remove(child);

            const rectObject = this.draw(re);
            this.dragObjects.splice(this.dragObjects.findIndex(item => item.userData.rect.modelUuid === rect.modelUuid), 1, rectObject);
        })
    }

    /**
     * 准备开始画矩形标记框
     */
    addRect({modelUuid}) {
        if (!this.controls) return;

        this.tempModelUuid = modelUuid;
        this.controls.enabled = false;
        this.dragControls.enabled = false;

        this.canvas.style.cursor = "crosshair";
        stopRender();

        this.canvas.addEventListener("pointerdown", cpdFn);
    }

    // 删除当前选中的模型
    deleteRect({modelUuid}){
        this.group.children.forEach((child, index) => {
            if (child.userData.rect.modelUuid !== modelUuid) return;

            this.middleObject.markList.splice(index, 1);
            this.group.remove(child);

            this.dragObjects.splice(this.dragObjects.findIndex(item => item.userData.rect.modelUuid === modelUuid), 1);
        })
    }

    // 鼠标按下事件
    onpointerdown(event: PointerEvent) {
        event.stopPropagation();
        if (this.isDrag || event.button !== 0) return;

        const wp = this.screenToScenePosition(event);
        this.downPoint = new THREE.Vector2(wp.x, wp.y);

        this.canvas.addEventListener("pointermove", cpmFn);
        this.canvas.addEventListener("pointerup", cpuFn);
    }

    // 鼠标移动事件
    onpointermove(event: PointerEvent) {
        event.stopPropagation();

        if (this.isDrag) return;

        const wp = this.screenToScenePosition(event);

        this.tempRect && this.group.remove(this.tempRect);

        const item: IDrawingMark = {
            x: this.downPoint.x,
            y: this.downPoint.y,
            w: wp.x - this.downPoint.x,
            h: wp.y - this.downPoint.y,
            modelUuid: this.tempModelUuid
        };

        this.tempRect = this.draw(item);
    }

    // 鼠标抬起事件
    onpointerup(event: PointerEvent) {
        event.stopPropagation();
        if (this.isDrag) return;

        const wp = this.screenToScenePosition(event);
        const item: IDrawingMark = {
            x: this.downPoint.x,
            y: this.downPoint.y,
            w: wp.x - this.downPoint.x,
            h: wp.y - this.downPoint.y,
            modelUuid: this.tempModelUuid
        };

        this.drawDone(item)

        // 设置热点名称
        this.signal({
            type: "dispatch",
            name: "drawingMarkDone",
            data: ["add", item]
        })

        this.canvas.style.cursor = "default";

        this.tempModelUuid = undefined;
        this.canvas.removeEventListener("pointermove", cpmFn);
        this.canvas.removeEventListener("pointerup", cpuFn);
    }

    // 取消设置名称去除对应绘制的方法
    clearTemp() {
        this.tempRect && this.group.remove(this.tempRect);

        this.exit();
    }

    // 名称设置完成后调用的绘制结束方法
    drawDone(rect:IDrawingMark) {
        this.tempRect && this.group.remove(this.tempRect);

        this.middleObject.markList.push(rect);
        const rectObject = this.draw(rect);
        this.dragObjects.push(rectObject);

        this.exit();
    }

    exit() {
        this.controls && (this.controls.enabled = true);
        this.dragControls.enabled = true;

        renderLoop();

        this.canvas.removeEventListener("pointerdown", cpdFn);
    }

    // 绘制
    draw(item: IDrawingMark) {
        /* 第二种方式 */
        const g = new THREE.Group();
        g.name = "mark-rect"
        const rectShape = new THREE.Shape();
        rectShape.moveTo(item.x, item.y);
        rectShape.lineTo(item.x + item.w, item.y);
        rectShape.lineTo(item.x + item.w, item.y + item.h);
        rectShape.lineTo(item.x, item.y + item.h);
        rectShape.lineTo(item.x, item.y);
        const geometry = new THREE.ShapeGeometry(rectShape);
        const material = DrawRect.RectShapeMaterial;
        const mesh = new THREE.Mesh(geometry, material);
        g.add(mesh);

        //绘制边框线
        const lineGeom = new THREE.EdgesGeometry(geometry)
        const lineMaterial = DrawRect.LineMaterial;
        const line = new THREE.LineSegments(lineGeom, lineMaterial)
        line.scale.copy(mesh.scale)
        line.rotation.copy(mesh.rotation)
        line.position.copy(mesh.position)
        g.add(line)

        g.userData.rect = item;

        this.group.add(g);

        // helpRender();
        render();
        return g;
    }

    screenToScenePosition(event) {
        const offsetX = event.clientX - this.canvas.offsetLeft;
        const offsetY = event.clientY - this.canvas.offsetTop;
        const screenPosition = new THREE.Vector3(offsetX, offsetY, 0);
        //const worldPosition = new THREE.Vector3();

        screenPosition.x = (screenPosition.x / this.canvas.clientWidth) * 2 - 1;
        screenPosition.y = -(screenPosition.y / this.canvas.clientHeight) * 2 + 1;
        screenPosition.z = 0.5;

        let p = screenPosition.unproject(this.camera);

        return new THREE.Vector2(p.x, p.y);
        // screenPosition.sub(this.camera.position).normalize();
        // const distance = -this.camera.position.z / screenPosition.z;
        // worldPosition.copy(this.camera.position).add(screenPosition.multiplyScalar(distance));
        //
        // return worldPosition;
    }
}