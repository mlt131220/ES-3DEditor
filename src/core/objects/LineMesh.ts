/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/5/21 22:08
 * @description 带线框子模型的Mesh对象
 */
import {Mesh, Material, BufferGeometry, MeshBasicMaterial, LineSegments, LineBasicMaterial, EdgesGeometry} from 'three';
// import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
// import * as SceneUtils from 'three/examples/jsm/utils/SceneUtils.js';
import {useDispatchSignal} from "@/hooks/useSignal";


export function materialProxy(lineMesh: LineMesh) {
    return new Proxy(lineMesh, {
        set(target: LineMesh, p: string | symbol, newValue: any): boolean {
            if(p === 'material'){
                (<LineBasicMaterial>(<LineSegments>target.children[0]).material).dispose();
                target.children = [];

                // 更新场景树
                useDispatchSignal("sceneGraphChanged");
            }

            target[p] = newValue;

            return true;
        }
    })
}

export class LineMesh extends Mesh {
    constructor(geometry = new BufferGeometry(), material: Material = new MeshBasicMaterial(), color = 0x00ffff) {
        super(geometry, material);

        // @ts-ignore
        this.type = 'LineMesh';

        const edges = new EdgesGeometry(geometry);
        const edgesMaterial = new LineBasicMaterial({
            color: color,
        })
        const line = new LineSegments(edges, edgesMaterial);

        // let geometryArray = [geometry,edges];
        // let materialArray = [material,edgesMaterial];
        // const mergedGeometries = BufferGeometryUtils.mergeGeometries(geometryArray, false);
        // const lineMesh = SceneUtils.createMultiMaterialObject(mergedGeometries, materialArray);
        //
        // this.parent?.add(lineMesh);
        // this.removeFromParent();

        this.add(line)
    }

    proxyMesh = materialProxy(this);
}

