import {Vector2, Vector3} from "three";
import bSpline from './bspline';
import {Text} from "./troika-three-text.esm.js";

// Three.js 扩展函数
const THREEx: {
    Math: {
        angle2: (p1: { x: number, y: number }, p2: { x: number, y: number }) => number,
        polar: (point: { x: number, y: number }, distance: number, angle: number) => { x: number, y: number },
    }
} = {
    Math: {
        /**
         * 返回向量(p1,p2)的弧度角。换句话说，想象把向量的底放在坐标(0,0)处，然后求向量(1,0)到(p1,p2)的夹角。
         * @param  {{x:number,y:number}} p1 起始点坐标
         * @param  {{x:number,y:number}} p2 结束点坐标
         * @return {Number} the angle
         */
        angle2: (p1: { x: number; y: number; }, p2: { x: number; y: number; }): number => {
            const v1 = new Vector2(p1.x, p1.y);
            const v2 = new Vector2(p2.x, p2.y);
            v2.sub(v1); // sets v2 to be our chord
            v2.normalize();
            if (v2.y < 0) return -Math.acos(v2.x);
            return Math.acos(v2.x);
        },
        polar: (point, distance, angle) => {
            return {
                x: point.x + distance * Math.cos(angle),
                y: point.y + distance * Math.sin(angle)
            };
        }
    }
}

/**
 * 使用凸起值计算两点之间曲线的点。通常用于折线
 * @param startPoint - 曲线的起点
 * @param endPoint - 曲线的终点
 * @param bulge - 凸起值：表示要弯曲多少的值
 * @param {number} segments - 曲线的分段数
 */
export function getBulgeCurvePoints(startPoint: { x: number; y: number; }, endPoint: {
    x: number | undefined;
    y: number | undefined;
}, bulge: number, segments?: number | undefined) {
    let vertex: { x: number, y: number }, i: number,
        center: { x: number, y: number }, p0: Vector2, p1: Vector2, angle: number,
        radius: number, startAngle: number,
        thetaAngle: number;

    p0 = startPoint ? new Vector2(startPoint.x, startPoint.y) : new Vector2(0, 0);
    p1 = endPoint ? new Vector2(endPoint.x, endPoint.y) : new Vector2(1, 0);
    bulge = bulge || 1;

    const obj = {
        startPoint: p0,
        endPoint: p1,
        bulge: bulge,
        segments: segments || 100
    };

    angle = 4 * Math.atan(bulge);
    radius = p0.distanceTo(p1) / 2 / Math.sin(angle / 2);
    center = THREEx.Math.polar(startPoint, radius, THREEx.Math.angle2(p0, p1) + (Math.PI / 2 - angle / 2));

    // 默认情况下，每10度需要一个段
    obj.segments = segments = segments || Math.max(Math.abs(Math.ceil(angle / (Math.PI / 18))), 6);
    startAngle = THREEx.Math.angle2(center, p0);
    thetaAngle = angle / segments;

    const vertices: Array<Vector3> = [];

    vertices.push(new Vector3(p0.x, p0.y, 0));

    for (i = 1; i <= segments - 1; i++) {
        vertex = THREEx.Math.polar(center, Math.abs(radius), startAngle + thetaAngle * i);
        vertices.push(new Vector3(vertex.x, vertex.y, 0));
    }

    return vertices;
}

/**
 * 插值一条b样条。该算法检查结向量以创建分段进行插值。参数化值被重新归一化为[0,1]，因为这是库所期望的(并且在b样条库中被反归一化)
 * @param controlPoints the control points
 * @param degree the b-spline degree
 * @param knots the knot vector
 * @returns the polyline
 */
export function getBSplinePolyline(controlPoints, degree, knots, interpolationsPerSplineSegment, weights) {
    const polyline: Vector2[] = []
    const controlPointsForLib = controlPoints.map(function (p) {
        return [p.x, p.y]
    })

    const segmentTs = [knots[degree]]
    const domain = [knots[degree], knots[knots.length - 1 - degree]]

    for (let k = degree + 1; k < knots.length - degree; ++k) {
        if (segmentTs[segmentTs.length - 1] !== knots[k]) {
            segmentTs.push(knots[k])
        }
    }

    interpolationsPerSplineSegment = interpolationsPerSplineSegment || 25
    for (let i = 1; i < segmentTs.length; ++i) {
        const uMin = segmentTs[i - 1]
        const uMax = segmentTs[i]
        for (let k = 0; k <= interpolationsPerSplineSegment; ++k) {
            const u = k / interpolationsPerSplineSegment * (uMax - uMin) + uMin
            // Clamp t to 0, 1 to handle numerical precision issues
            let t = (u - domain[0]) / (domain[1] - domain[0])
            t = Math.max(t, 0)
            t = Math.min(t, 1)
            const p = bSpline(t, degree, controlPointsForLib, knots, weights)
            polyline.push(new Vector2(p[0], p[1]));
        }
    }
    return polyline
}

export function addTriangleFacingCamera(verts, p0, p1, p2) {
    // 计算这些点面对的方向(顺时针还是逆时针)
    const vector1 = new Vector3();
    const vector2 = new Vector3();
    vector1.subVectors(p1, p0);
    vector2.subVectors(p2, p0);
    vector1.cross(vector2);

    const v0 = new Vector3(p0.x, p0.y, p0.z);
    const v1 = new Vector3(p1.x, p1.y, p1.z);
    const v2 = new Vector3(p2.x, p2.y, p2.z);

    // 如果z < 0，那么我们必须以相反的顺序来画
    if (vector1.z < 0) {
        verts.push(v2, v1, v0);
    } else {
        verts.push(v0, v1, v2);
    }
}

export function mtextContentAndFormattingToTextAndStyle(textAndControlChars, entity, color) {
    let activeStyle = {
        horizontalAlignment: 'left',
        textHeight: entity.height
    }

    const text: string[] = [];
    for (let item of textAndControlChars) {
        if (typeof item === 'string') {
            if (item.startsWith('pxq') && item.endsWith(';')) {
                if (item.indexOf('c') !== -1)
                    activeStyle.horizontalAlignment = 'center';
                else if (item.indexOf('l') !== -1)
                    activeStyle.horizontalAlignment = 'left';
                else if (item.indexOf('r') !== -1)
                    activeStyle.horizontalAlignment = 'right';
                else if (item.indexOf('j') !== -1)
                    activeStyle.horizontalAlignment = 'justify';
            } else {
                text.push(item);
            }
        } else if (Array.isArray(item)) {
            const nestedFormat = mtextContentAndFormattingToTextAndStyle(item, entity, color);
            text.push(nestedFormat.text);
        } else if (typeof item === 'object') {
            if (item['S'] && item['S'].length === 3) {
                text.push(item['S'][0] + '/' + item['S'][2]);
            } else {
                // not yet supported.
            }
        }
    }
    return {
        text: text.join(),
        style: activeStyle
    }
}

export function createTextForScene(text, style, entity, color) {
    if (!text) return null;

    let textEnt:any = new Text();
    textEnt.text = text.replaceAll('\\P', '\n').replaceAll('\\X', '\n');

    // 此处不能使用this.font - (json)，因为此处需要自身加载字体文件
    // textEnt.font = this.font;
    textEnt.font = "/upyun/assets/font/Alimama_DongFangDaKai_Regular.ttf";
    textEnt.fontSize = style.textHeight;
    textEnt.maxWidth = entity.width;
    textEnt.position.x = entity.position.x;
    textEnt.position.y = entity.position.y;
    textEnt.position.z = entity.position.z;
    textEnt.textAlign = style.horizontalAlignment;
    textEnt.color = color;
    if (entity.rotation) {
        textEnt.rotation.z = entity.rotation * Math.PI / 180;
    }
    if (entity.directionVector) {
        const dv = entity.directionVector;
        textEnt.rotation.z = new Vector3(1, 0, 0).angleTo(new Vector3(dv.x, dv.y, dv.z));
    }
    switch (entity.attachmentPoint) {
        case 1:
            // Top Left
            textEnt.anchorX = 'left';
            textEnt.anchorY = 'top';
            break;
        case 2:
            // Top Center
            textEnt.anchorX = 'center';
            textEnt.anchorY = 'top';
            break;
        case 3:
            // Top Right
            textEnt.anchorX = 'right';
            textEnt.anchorY = 'top';
            break;

        case 4:
            // Middle Left
            textEnt.anchorX = 'left';
            textEnt.anchorY = 'middle';
            break;
        case 5:
            // Middle Center
            textEnt.anchorX = 'center';
            textEnt.anchorY = 'middle';
            break;
        case 6:
            // Middle Right
            textEnt.anchorX = 'right';
            textEnt.anchorY = 'middle';
            break;

        case 7:
            // Bottom Left
            textEnt.anchorX = 'left';
            textEnt.anchorY = 'bottom';
            break;
        case 8:
            // Bottom Center
            textEnt.anchorX = 'center';
            textEnt.anchorY = 'bottom';
            break;
        case 9:
            // Bottom Right
            textEnt.anchorX = 'right';
            textEnt.anchorY = 'bottom';
            break;

        default:
            return undefined;
    }

    textEnt.sync(() => {
        if (textEnt.textAlign !== 'left') {
            textEnt.geometry.computeBoundingBox();
            const textWidth = textEnt.geometry.boundingBox.max.x - textEnt.geometry.boundingBox.min.x;
            if (textEnt.textAlign === 'center') textEnt.position.x += (entity.width - textWidth) / 2;
            if (textEnt.textAlign === 'right') textEnt.position.x += (entity.width - textWidth);
        }
    });

    return textEnt;
}

export function findExtents(scene) {
    let minX;
    let maxX;
    let minY;
    let maxY;
    for (const child of scene.children) {
        if (child.position) {
            minX = Math.min(child.position.x, minX);
            minY = Math.min(child.position.y, minY);
            maxX = Math.max(child.position.x, maxX);
            maxY = Math.max(child.position.y, maxY);
        }
    }

    return {min: {x: minX, y: minY}, max: {x: maxX, y: maxY}};
}