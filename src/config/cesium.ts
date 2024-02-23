import {t} from '@/language';

// 新建cesium场景时配置的默认底图
export const CESIUM_DEFAULT_MAP = [
    {label:t("cesium.map.Amap"),value:"Amap",coordinateSystem:"GCJ-02"}, //高德
]

// 新建cesium场景时配置的默认底图类型 satellite：影像图，vector：矢量图
export const CESIUM_DEFAULT_MAP_TYPE = [
    {label:t("cesium['Image base map']"),value:"satellite"},
    {label:t("cesium['Vector base map']"),value:"vector"}
]
