import { defineStore } from 'pinia';
import { store } from '@/store';

/**
 * 图纸相关信息
 */
export const useDrawingStore = defineStore({
    id: 'drawing',
    state: () => ({
        // 是否已上传图纸
        isUploaded: false,
        // 图片base64 / cad文件路径
        imgSrc: "",
        // 是否cad
        isCad:false,
        // cad图层信息
        layers: {},
        // 是否正在绘制矩形标记
        isDrawingRect: false,
        // 选中的矩形索引
        selectedRectIndex: -1,
        // 标记列表
        markList: <IDrawingMark[]>[],
        // 标记图纸时的图纸属性信息
        imgInfo:<IDrawingImgInfo>{
            width:0,
            height:0
        }
    }),
    getters:{
        getIsUploaded:state=> state.isUploaded,
        getImgSrc:state=> state.imgSrc,
        getIsDrawingRect:state=> state.isDrawingRect,
        getSelectedRectIndex:state=> state.selectedRectIndex,
        getMarkList:state=> state.markList,
        getImgInfo:state=> state.imgInfo,
    },
    actions: {
        setIsUploaded(isUploaded:boolean){
            this.isUploaded = isUploaded;
        },
        setImgSrc(imgSrc:string){
            this.isCad = imgSrc.split(".").pop() === "dxf";
            this.imgSrc = imgSrc;
        },
        setLayers(layers:ICad.IDxfLayers){
            this.layers = layers;
        },
        setLayerVisible(layerName:string, visible:boolean){
            this.layers[layerName].visible = visible;
        },
        setLayerAllVisible(visible:boolean){
            for(let key in this.layers){
                this.layers[key].visible = visible;
            }
        },
        setIsDrawingRect(isDrawingRect:boolean){
            this.isDrawingRect = isDrawingRect;
        },
        setSelectedRectIndex(selectedRectIndex:number){
            this.selectedRectIndex = selectedRectIndex;
        },
        setMarkList(markList:IDrawingMark[]){
            this.markList = markList;
        },
        setImgInfo(imgInfo:IDrawingImgInfo){
            this.imgInfo = imgInfo;
        }
    }
});

// setup 之外使用
export function useDrawingStoreWithOut() {
    return useDrawingStore(store);
}