import {useDrawingStoreWithOut} from "@/store/modules/drawing";
import {throttle} from "@/utils/common/utils";
import {getSelectedModelPath} from "@/utils/common/scenes";
import {useDispatchSignal} from "@/hooks/useSignal";

const drawingStore = useDrawingStoreWithOut();

/**
 * 画布中绘制矩形
 * @param {HTMLCanvasElement}  canvas 画布对象
 * @param {Array<IDrawingMark>} list 矩形数组
 **/
export class DrawRect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private readonly list: Array<IDrawingMark>;
    // 当前选中的矩形下标
    public selectRectIndex: number = -1;
    // 当前鼠标经过的矩形的下标
    private hoverRectIndex: number = -1;
    private sX: number = 0;
    private sY: number = 0;
    // 鼠标按下时的clientXY
    private downClientX: number = 0;
    private downClientY: number = 0;
    private zoom: number = 100;
    // 鼠标左键是否按下
    private leftMouseDown: boolean = false;
    // 画布是否处于拖动状态
    private isCanvasDrag: boolean = false;
    // 画布拖动后的偏移量
    private canvasOffsetX: number = 0;
    private canvasOffsetY: number = 0;
    // rect是否处于拖动状态
    private isDrag: boolean = false;

    //杂项
    public rectColor: string = "#15FF00";
    public rectSelectColor: string = "#ff0000";

    // 拖动的rect的初始数据
    private dragRect: IDrawingMark = {x: 0, y: 0, w: 0, h: 0,color:this.rectColor};

    constructor(canvas) {
        this.canvas = canvas;
        this.list = drawingStore.getMarkList;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.strokeStyle = this.rectColor;
        this.ctx.lineWidth = 1;

        this.canvas.onmousemove = throttle(this.onmousemove.bind(this), 10);
        this.canvas.onmousedown = this.onmousedown.bind(this);
        this.canvas.onmouseup = this.onmouseup.bind(this);
        this.canvas.onmouseleave = this.onmouseleave.bind(this);
        this.canvas.addEventListener("mousewheel", this.onmousewheel.bind(this));

        const parentElement = document.getElementById("drawing") as HTMLElement;
        parentElement.onmousedown = this.onParentMouseDown.bind(this);
        parentElement.onmousemove = throttle(this.onParentMouseMove.bind(this),16);
        parentElement.onmouseup = this.onParentMouseUp.bind(this);
        parentElement.onmouseleave = this.onParentMouseLeave.bind(this);

        this.init();
    }

    init(){
        // 若list长度不为0, 则显示已标记框
        if (this.list.length !== 0) {
            this.list.forEach((value: IDrawingMark) => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = value.color;
                // 遍历绘制所有标记框
                this.ctx.rect(value.x, value.y, value.w, value.h);
                this.ctx.stroke();
            });
        }
    }

    /**
     * 准备开始画矩形标记框
     * @public
     */
    public addRect() {
        this.canvas.style.cursor = "crosshair";
        // 进入绘制流程
        drawingStore.setIsDrawingRect(true);
    }

    /**
     * 删除rect
     */
    public deleteRect() {
        this.list.splice(this.selectRectIndex, 1);
        this.hoverRectIndex = -1;
        this.selectRectIndex = -1;
        this.reDrawCanvas();
    }

    /**
     * 图纸复位
     */
    public canvasReset(){
        const parentElement = document.querySelector("#drawing .drawing-container") as HTMLElement;
        parentElement.style.left = "0px";
        parentElement.style.top = "0px";
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        this.canvas.style.transform = "scale(1)";

        this.zoom = 100;
    }

    /**
     * 修改当前绘制的颜色
     * @param {string} color 颜色
     */
    public setRectColor(color: string) {
        this.rectColor = color;
        this.list[this.selectRectIndex].color = color;

        this.reDrawCanvas(true);
        setTimeout(()=>{
            this.reDrawCanvas(false);
        },800)
    }

    get selectRectColor(){
        return this.list[this.selectRectIndex].color;
    }

    /**
     * 高亮选中的模型对应的rect
     * @param {string} uuid modelUuid
     */
    public selectRect(uuid: string) {
        // this.list.forEach((item, index) => {
        //     if (item.modelUuid === uuid) {
        //         this.selectRectIndex = index;
        //         this.reDrawCanvas();
        //         return;
        //     }
        // })

        this.selectRectIndex = -1;

        this.list.forEach((item, index) => {
            if (item.modelUuid !== uuid) return;

            this.selectRectIndex = index;
        })

        this.reDrawCanvas();

        drawingStore.setSelectedRectIndex(this.selectRectIndex);
    }

    private onmousemove(em) {
        if (this.isCanvasDrag)return;

        // 如果处于绘制流程中
        if (drawingStore.getIsDrawingRect) {
            this.canvas.style.cursor = "crosshair";

            if (this.leftMouseDown) {
                // 正在绘制矩形
                // 如果是处于修改矩形流程中
                if (this.selectRectIndex !== -1) {
                    this.list.splice(this.selectRectIndex, 1, {
                        x: this.sX,
                        y: this.sY,
                        w: em.offsetX - this.sX,
                        h: em.offsetY - this.sY,
                        color:this.list[this.selectRectIndex].color,
                        modelUuid: this.list[this.selectRectIndex].modelUuid,
                        modelPath: this.list[this.selectRectIndex].modelPath
                    });

                    this.reDrawCanvas();
                } else {
                    this.reDrawCanvas();
                    // 设置边框为虚线
                    this.ctx.beginPath();
                    this.ctx.setLineDash([8, 4]);
                    this.ctx.rect(this.sX, this.sY, em.offsetX - this.sX, em.offsetY - this.sY);
                    this.ctx.stroke();
                }
            }
            return;
        }

        /** rect 正在拖动 **/
        if (this.isDrag) {
            this.list.splice(this.selectRectIndex, 1, {
                x: this.dragRect.x + (em.offsetX - this.sX),
                y: this.dragRect.y + (em.offsetY - this.sY),
                w: this.dragRect.w,
                h: this.dragRect.h,
                color:this.dragRect.color,
                modelUuid: this.dragRect.modelUuid,
                modelPath: this.dragRect.modelPath
            });

            this.reDrawCanvas();
            return;
        }

        this.sX = em.offsetX;
        this.sY = em.offsetY;

        /** 界面上无矩形 **/
        if (this.list.length === 0) return;

        /** 界面上有矩形 **/
        this.list.forEach((item, index) => {
            let path = new Path2D();

            if (this.selectRectIndex === index) {
                path.rect(item.x - 4, item.y - 4, item.w + 8, item.h + 8);
            } else {
                path.rect(item.x, item.y, item.w, item.h);
            }

            if (this.ctx.isPointInPath(path, em.offsetX, em.offsetY)) {
                // 鼠标在矩形内
                this.hoverRectIndex = index;

                this.canvas.style.cursor = "pointer";
            } else {
                // 如果鼠标不在之前所在的矩形内，清除hoverRectIndex
                if (this.hoverRectIndex === index) {
                    this.hoverRectIndex = -1;
                }

                this.canvas.style.cursor = "default";
            }
            this.reDrawCanvas();
        });
    }

    /**
     * 鼠标按下时
     * @param ed
     * @private
     */
    private onmousedown(ed) {
        ed.stopPropagation();

        this.leftMouseDown = true;
        // 记录按下位置（矩形绘制起始位置）
        this.sX = ed.offsetX;
        this.sY = ed.offsetY;

        this.downClientX = ed.clientX;
        this.downClientY = ed.clientY;

        // 如果处于绘制流程中
        if (drawingStore.getIsDrawingRect) return;

        /** 如果鼠标按下时鼠标在矩形内 **/
        if (this.hoverRectIndex !== -1) {
            // 还未选中过模型 或者 此时点击的不是之前选中的模型
            if (this.selectRectIndex === -1 || this.hoverRectIndex !== this.selectRectIndex) {
                // 选中矩形 this.hoverRectIndex
                this.selectRectIndex = this.hoverRectIndex;
            }
            this.handleMouseDown(ed.offsetX, ed.offsetY);
        } else {
            this.selectRectIndex = -1;

            // 如果鼠标按下时鼠标不在矩形内,拖动画布
            this.isCanvasDrag = true;
        }
        drawingStore.setSelectedRectIndex(this.selectRectIndex);
        this.reDrawCanvas();
    }

    private handleMouseDown(offsetX, offsetY) {
        const selectRect = this.list[this.selectRectIndex];
        // 判断鼠标点击的是四个角（缩放）还是其他区域（拖动）
        const x = offsetX - selectRect.x;
        const y = offsetY - selectRect.y;
        if (x < 5 && y < 5) {
            // 左上角
            this.sX = selectRect.x + selectRect.w;
            this.sY = selectRect.y + selectRect.h;

            drawingStore.setIsDrawingRect(true);
        } else if (x > this.list[this.selectRectIndex].w - 5 && y < 5) {
            // 右上角
            this.sX = selectRect.x;
            this.sY = selectRect.y + selectRect.h;

            drawingStore.setIsDrawingRect(true);
        } else if (x < 10 && y > this.list[this.selectRectIndex].h - 5) {
            // 左下角
            this.sX = selectRect.x + selectRect.w;
            this.sY = selectRect.y;

            drawingStore.setIsDrawingRect(true);
        } else if (x > this.list[this.selectRectIndex].w - 5 && y > this.list[this.selectRectIndex].h - 5) {
            // 右下角
            this.sX = selectRect.x;
            this.sY = selectRect.y;

            drawingStore.setIsDrawingRect(true);
        } else {
            // 拖动
            this.canvas.style.cursor = "move";
            this.dragRect = selectRect;
            this.isDrag = true;

            // 三维场景定位模型
            if(selectRect.modelUuid){
                const model = window.editor.objectByUuid(selectRect.modelUuid);
                useDispatchSignal("objectFocused",model);
                useDispatchSignal("objectSelected",model);
            }
        }
    }

    /**
     * 鼠标抬起时
     * @private
     */
    private onmouseup(eu) {
        this.leftMouseDown = false;
        this.isCanvasDrag = false;

        // 如果处于绘制流程中
        if (drawingStore.getIsDrawingRect) {
            // 判断是新建矩形还是修改
            if (this.selectRectIndex === -1) {
                const w = eu.offsetX - this.sX;
                const h = eu.offsetY - this.sY;
                // 矩形w,h都大于5时才添加
                if (Math.abs(w) > 5 && Math.abs(h) > 5) {
                    // 全取左上角点x,y,使得w,h为正数
                    this.list.push({
                        x: w > 0 ? this.sX : this.sX + w,
                        y: h > 0 ? this.sY : this.sY + h,
                        w: Math.abs(w),
                        h: Math.abs(h),
                        color:this.rectColor,
                        modelUuid: window.editor.selected.uuid,
                        modelPath:getSelectedModelPath(),
                    });
                }
            } else {
                this.list.splice(this.selectRectIndex, 1, {
                    // 全取左上角点x,y,使得w,h为正数
                    x: this.list[this.selectRectIndex].w > 0 ? this.sX : this.sX + this.list[this.selectRectIndex].w,
                    y: this.list[this.selectRectIndex].h > 0 ? this.sY : this.sY + this.list[this.selectRectIndex].h,
                    w: Math.abs(this.list[this.selectRectIndex].w),
                    h: Math.abs(this.list[this.selectRectIndex].h),
                    color:this.list[this.selectRectIndex].color,
                    modelUuid: this.list[this.selectRectIndex].modelUuid,
                    modelPath: this.list[this.selectRectIndex].modelPath,
                });
            }

            this.reDrawCanvas();

            //退出绘制流程
            drawingStore.setIsDrawingRect(false);
            this.canvas.style.cursor = "default";
            return;
        }

        // 如果处于拖动流程中
        if (this.isDrag) {
            this.isDrag = false;
            this.canvas.style.cursor = "default";
            return;
        }
    }

    private onmouseleave(){
        this.isDrag = false;
    }

    private onmousewheel(event){
        /**
         *  获取当前页面的缩放比
         *  若未设置zoom缩放比，则为默认100%，即1，原图大小
         */
        /* event.wheelDelta 获取滚轮滚动值并将滚动值叠加给缩放比zoom  wheelDelta统一为±120，其中正数表示为向上滚动，负数表示向下滚动  */
        let z = event.wheelDelta;
        if (Math.abs(event.wheelDelta) > 120) {
            z = event.wheelDelta > 0 ? 120 : -120;
        }

        const lastZoom = this.zoom;
        this.zoom += z / 12;
        /* 最小范围 和 最大范围 的图片缩放尺度 */
        if ( this.zoom >= 50 &&  this.zoom <= 800) {
            this.canvas.style.transform = "scale(" +  this.zoom / 100 + ")";
        }else{
            this.zoom = lastZoom;
        }
        return false;
    }

    /**
     * 重新绘制画布
     */
    reDrawCanvas(showSelectLineColor = false) {
        this.ctx.setLineDash([8, 0]);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.list.forEach((value, index) => {
            if (index === this.selectRectIndex) {
                const r = value.w > 10 ? 4 : 2;
                /* 绘制选中部分 */
                /* 绘制方框 */
                this.ctx.beginPath();
                this.ctx.strokeStyle = showSelectLineColor ? value.color : this.rectSelectColor;
                this.ctx.rect(value.x, value.y, value.w, value.h);
                this.ctx.fillStyle = 'RGBA(102,102,102,0.2)'
                this.ctx.fillRect(value.x, value.y, value.w, value.h);
                this.ctx.stroke();
                /* 绘制四个角的点 */
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.rectSelectColor;
                this.ctx.arc(value.x, value.y, r, 0, Math.PI * 2)
                this.ctx.fillStyle = this.rectSelectColor;
                this.ctx.fill();// 画起点实心圆
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(value.x, value.y + value.h, r, 0, Math.PI * 2);
                this.ctx.fillStyle = this.rectSelectColor;
                this.ctx.fill();// 画起点纵向实心圆
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(value.x + value.w, value.y + value.h, r, 0, Math.PI * 2);
                this.ctx.fillStyle = this.rectSelectColor;
                this.ctx.fill();// 画起点横向实心圆
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(value.x + value.w, value.y, r, 0, Math.PI * 2);
                this.ctx.fillStyle = this.rectSelectColor;
                this.ctx.fill();// 画终点实心圆
                this.ctx.stroke();
            } else if (this.hoverRectIndex === index) {
                /* 绘制鼠标经过部分 */
                this.ctx.beginPath();
                this.ctx.strokeStyle = value.color;
                this.ctx.rect(value.x, value.y, value.w, value.h);
                this.ctx.fillStyle = 'RGBA(102,102,102,0.2)';
                this.ctx.fillRect(value.x, value.y, value.w, value.h);
                this.ctx.stroke();
            } else {
                /* 绘制未选中部分 */
                this.ctx.beginPath();
                this.ctx.strokeStyle = value.color;
                this.ctx.rect(value.x, value.y, value.w, value.h);
                this.ctx.stroke();
            }
        });

        drawingStore.setMarkList(this.list);
    }

    /* 父级相关事件监听 */
    private onParentMouseDown(e){
        this.downClientX = e.clientX;
        this.downClientY = e.clientY;

        this.isCanvasDrag = true;
    }

    private onParentMouseUp(){
        this.isCanvasDrag = false;

        const parentElement = document.querySelector("#drawing .drawing-container") as HTMLElement;
        this.canvasOffsetX = parentElement.offsetLeft;
        this.canvasOffsetY = parentElement.offsetTop;
    }

    private onParentMouseMove(e){
        /** 画布正在拖动 **/
        if (this.isCanvasDrag) {
            const parentElement = document.querySelector("#drawing .drawing-container") as HTMLElement;

            parentElement.style.left = this.canvasOffsetX + e.clientX - this.downClientX + "px";
            parentElement.style.top = this.canvasOffsetY + e.clientY - this.downClientY + "px";
            return;
        }
    }

    private onParentMouseLeave(){
        this.isCanvasDrag = false;
    }
}

