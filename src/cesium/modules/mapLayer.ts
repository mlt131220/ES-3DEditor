import * as Cesium from 'cesium';
import {useSceneInfoStoreWithOut} from "@/store/modules/sceneInfo";

/**
 * @Date 2023-03-07
 * @Author 二三
 * @Description: cesium地图底图图层管理
 */
const sceneInfoStore = useSceneInfoStoreWithOut();

export default class MapLayer{
    viewer: Cesium.Viewer | null;

    //底图集合
    layers:{
        [s:string]:{
            satellite?: Cesium.UrlTemplateImageryProvider | Cesium.WebMapTileServiceImageryProvider, //卫星影像图
            mark?: Cesium.UrlTemplateImageryProvider , //标记图
            vector?: Cesium.UrlTemplateImageryProvider  //矢量图
        };
    }

    constructor() {
        this.viewer = null;
        this.layers = {
            Amap:{//高德
                satellite: new Cesium.UrlTemplateImageryProvider({
                    url: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
                    minimumLevel: 3,
                    maximumLevel: 18
                }),
                mark: new Cesium.UrlTemplateImageryProvider({
                    url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
                    minimumLevel: 3,
                    maximumLevel: 18
                }),
                vector: new Cesium.UrlTemplateImageryProvider({
                    url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
                    minimumLevel: 3,
                    maximumLevel: 18
                })
            },
            Tianditu:{//天地图
                satellite: new Cesium.WebMapTileServiceImageryProvider({//球面墨卡托投影
                    url:`http://t{s}.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${sceneInfoStore.cesiumConfig.tiandituTk}`,
                    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                    layer: 'tdtImgLayer',
                    style: 'default',
                    format: 'image/jpeg',
                    tileMatrixSetID: 'GoogleMapsCompatible', //使用谷歌的瓦片切片方式
                }),
                mark: new Cesium.UrlTemplateImageryProvider({
                    url: `http://t0.tianditu.gov.cn/cva_w/wmts?tk=${sceneInfoStore.cesiumConfig.tiandituTk}`,
                    minimumLevel: 3,
                    maximumLevel: 18
                }),
                vector: new Cesium.UrlTemplateImageryProvider({
                    url: `http://t0.tianditu.gov.cn/vec_w/wmts?tk=${sceneInfoStore.cesiumConfig.tiandituTk}`,
                    minimumLevel: 3,
                    maximumLevel: 18
                })
            }
        }
    }

    setViewer(viewer){this.viewer = viewer;}

    /**
     * 获取默认底图
     * @param layer 底图类型，默认卫星影像图 enum: satellite | vector
     */
    getDefaultLayer(layer:'satellite' | 'vector' = "satellite"){
        return this.layers[sceneInfoStore.cesiumConfig.map][layer];
    }

    /**
     * 获取默认底图对应得标记图
     */
    getMarkMapByDefaultLayer(){
        return this.layers[sceneInfoStore.cesiumConfig.map].mark || this.layers.Amap.mark;
    }
}
