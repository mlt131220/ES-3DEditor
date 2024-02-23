import * as Cesium from "cesium";

/**
 * 笛卡尔坐标转换经纬度坐标
 * @param {*} car3_ps
 * @returns
 */
export function getLngLatByCartesian3(car3_ps) {
    if (!(car3_ps instanceof Cesium.Cartesian3))
        throw new Error("参数非 Cesium.Cartesian3 类型")
    let _cartographic = Cesium.Cartographic.fromCartesian(car3_ps);
    let _lat = Cesium.Math.toDegrees(_cartographic.latitude);
    let _lng = Cesium.Math.toDegrees(_cartographic.longitude);
    let _alt = _cartographic.height;
    return {longitude: _lng, latitude: _lat, elevation: _alt};
}
