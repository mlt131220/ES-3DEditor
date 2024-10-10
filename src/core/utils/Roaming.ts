/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/08/28
 * @description 漫游类，使用BVH检测碰撞,人物模型必须包含动画：Enter,Idle, Walking, WalkingBackward,Jumping
 */
import * as THREE from 'three';
import {BufferAttribute, BufferGeometry} from "three";
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GenerateMeshBVHWorker} from '@/workers/bvh/GenerateMeshBVHWorker.js';
import {useDispatchSignal} from "@/hooks/useSignal";
import {getMeshByInstancedMesh} from "@/utils/common/scenes";
import {RoamingStatus} from "@/core/utils/RoamingStatus";

let keyDownFn, keyUpFn;

export default class Roaming {
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private orbitControl: any;

    group: THREE.Group;
    private collider: THREE.Mesh | undefined; // 碰撞器
    private player: THREE.Mesh | undefined; // 碰撞胶囊体
    person: THREE.Group | undefined; // 人物

    private playerIsOnGround = true;
    private playerVelocity = new THREE.Vector3();
    private gravity = -25; // 重力
    private playerSpeed = 3; // 人物移动速度
    playerInitPos = new THREE.Vector3(0, 0, 0); // 人物初始位置
    private firstPerson = true; // 是否第一人称

    // 按键监听
    private fwdPressed = false;
    private bkdPressed = false;
    private lftPressed = false;
    private rgtPressed = false;

    private upVector = new THREE.Vector3(0, 1, 0);
    private tempVector = new THREE.Vector3();
    private tempVector2 = new THREE.Vector3();
    private tempBox = new THREE.Box3();
    private tempMat = new THREE.Matrix4();
    private tempSegment = new THREE.Line3();

    public isRoaming = false; // 是否在漫游
    mergeWorker: Worker;
    private generateMeshBVHWorker: GenerateMeshBVHWorker;
    private personStatus: RoamingStatus | null = null;

    constructor(viewport,controls) {
        this.scene = viewport.scene;
        this.camera =viewport.camera;
        this.orbitControl = controls;

        keyDownFn = this.keyDown.bind(this);
        window.addEventListener('keydown', keyDownFn);

        keyUpFn = this.keyUp.bind(this);
        window.addEventListener('keyup', keyUpFn);

        this.group = new THREE.Group();
        this.group.name = "es-3d-roaming-group";
        this.group.visible = false;

        this.mergeWorker = new Worker(new URL('../../workers/mergeGeometries.worker.ts', import.meta.url), {type: 'module'});
        this.generateMeshBVHWorker = new GenerateMeshBVHWorker();

        this.addPlayer().then(data => {
            // player:胶囊 person:人物  clips:动画
            const {player, person, clips} = data;
            this.player = player;
            this.person = person;
            this.group.add(this.player);
            this.group.add(this.person);

            // 漫游人物动画状态机
            this.personStatus = new RoamingStatus(this.person,clips);
        });
    }

    keyDown(e: KeyboardEvent) {
        if (!this.isRoaming || e.repeat) return;

        switch (e.code) {
            case 'KeyW':
                this.fwdPressed = true;
                this.personStatus?.setStatus("w",true);
                break;
            case 'KeyS':
                this.bkdPressed = true;
                this.personStatus?.setStatus("s",true);
                break;
            case 'KeyD':
                this.rgtPressed = true;
                this.personStatus?.setStatus("d",true);
                break;
            case 'KeyA':
                this.lftPressed = true;
                this.personStatus?.setStatus("a",true);
                break;
            case 'Space':
                if(this.personStatus?.keyDownStatus.space) return;

                if (this.playerIsOnGround) {
                    // 跳跃动画有30FPS准备动作
                    setTimeout(() => {
                        this.playerVelocity.y = 10.0;
                        this.playerIsOnGround = false;
                    }, 800)
                }
                this.personStatus?.setStatus("space",true);
                break;
            case "ShiftLeft":
            case "ShiftRight":
                if(this.personStatus?.isWalkingForward){
                    this.playerSpeed = 6;
                    this.personStatus?.setStatus("shift",true);
                }
                break;
            case 'KeyV': // 切换第一/第三人称视角
                this.firstPerson = !this.firstPerson;

                if (this.firstPerson) { //人称切换
                    // 第一人称
                    this.orbitControl.maxPolarAngle = Math.PI / 2;
                    this.orbitControl.minDistance = 2.5;
                    this.orbitControl.maxDistance = 2.5;
                } else {
                    this.orbitControl.maxPolarAngle = Math.PI / 2;
                    this.orbitControl.minDistance = 8;
                    this.orbitControl.maxDistance = 8;
                }

                this.orbitControl.update();
                break;
        }
    }

    keyUp(e: KeyboardEvent) {
        if (!this.isRoaming || e.repeat) return;

        switch (e.code) {
            case 'KeyW':
                this.personStatus?.setStatus("w",false);
                this.fwdPressed = false;
                break;
            case 'KeyS':
                this.personStatus?.setStatus("s",false);
                this.bkdPressed = false;
                break;
            case 'KeyD':
                this.personStatus?.setStatus("d",false);
                this.rgtPressed = false;
                break;
            case 'KeyA':
                this.personStatus?.setStatus("a",false);
                this.lftPressed = false;
                break;
            case "ShiftLeft":
            case "ShiftRight":
                this.playerSpeed = 3;
                this.personStatus?.setStatus("shift",false);
                break;
        }
    }

    // 添加漫游所需人物模型
    addPlayer(): Promise<{ player: THREE.Mesh, person: THREE.Group, clips: THREE.AnimationClip[] }> {
        return new Promise(async (resolve) => {
            // 几何圆柱体 用于碰撞检测
            const cylinder = new THREE.Mesh(
                new RoundedBoxGeometry(0.5, 1.7, 0.5, 10, 0.5),
                new THREE.MeshStandardMaterial()
            )
            cylinder.geometry.translate(0, -0.5, 0);
            // @ts-ignore
            cylinder.capsuleInfo = {
                radius: 0.4,
                segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))
            }
            cylinder.name = 'es-3d-roaming-cylinder';
            cylinder.visible = false;

            // 加载人物模型glb
            const loader = await window.editor.loader.createGLTFLoader();

            const done = (blob) => {
                // 加载人物模型Blob
                loader.loadAsync(URL.createObjectURL(blob)).then(result => {
                    const person = result.scene as THREE.Group;
                    person.name = "es-3d-roaming-player";

                    resolve({player: cylinder, person: person, clips: result.animations});
                });
            }

            // 从本地DB读取人物模型
            window.editor.storage.getModel("player").then((file:Blob | null) => {
                if (!file) {
                    // 加载默认人物模型
                    fetch("/static/model/person/Jackie.glb").then(res => res.blob()).then(blob => {
                        window.editor.storage.setModel("player",blob)
                        done(blob);
                    })
                } else {
                    done(file);
                }
            })
        })
    }

    // 生成碰撞器环境
    generateColliderEnvironment() {
        let mergedGeometry, environment: THREE.Group;

        const generateBVH = () => {
            return new Promise(resolve => {
                this.generateMeshBVHWorker.generate(mergedGeometry).then(bvh => {
                    // @ts-ignore
                    mergedGeometry.boundsTree = bvh;

                    this.collider = new THREE.Mesh(mergedGeometry);
                    // @ts-ignore
                    this.collider.material.wireframe = false;
                    this.collider.name = "es-3d-roaming-collider";
                    this.collider.visible = false;

                    this.group.add(this.collider);

                    resolve("");

                    this.generateMeshBVHWorker.dispose();
                });

                environment.visible = false;
                this.group.add(environment);
                this.scene.add(this.group);
            })
        }

        environment = new THREE.Group();
        environment.name = "es-3d-roaming-collider-environment";

        const generateMergedGeometry = () => {
            return new Promise(resolve => {
                const cloneGeom = (me) => {
                    // 检查对应属性是否存在
                    if(!me.geometry.attributes || !me.geometry.attributes.position || me.geometry.attributes.position.isInterleavedBufferAttribute) return;

                    const geom = me.geometry.clone();
                    geom.applyMatrix4(me.matrixWorld);
                    // for (const key in geom.attributes) {
                    //     // if (!['position','normal'].includes(key)) {
                    //     // 合并仅保留position和index即可
                    //     if (key !== "position") {
                    //         geom.deleteAttribute(key);
                    //         break;
                    //     }else{
                    //         // 取消position索引
                    //         geom.setAttribute("position",geom.toNonIndexed().attributes.position)
                    //     }
                    //
                    //     /* --- mergeAttributes() 不支持 isInterleavedBufferAttribute --- */
                    //     if(geom.attributes[key].isInterleavedBufferAttribute){
                    //         geom.deleteAttribute(key);
                    //     }
                    // }

                    // 合并仅保留position即可
                    geom.attributes = {
                        position: geom.toNonIndexed().attributes.position, // 取消position索引
                    }

                    // 手动纠正有些模型没有顶点索引的问题
                    if(geom.index) geom.index = null;

                    this.mergeWorker.postMessage({
                        type:"push",
                        geometry: geom
                    })
                }

                this.scene.traverse(c => {
                    // requestIdleCallback(()=>{
                        // @ts-ignore 只合并网格
                        if (c.geometry) {
                            // @ts-ignore
                            if (!c.isInstancedMesh) {
                                cloneGeom(c);
                            } else {
                                const meshes = getMeshByInstancedMesh(c as THREE.InstancedMesh);
                                meshes.forEach((m: THREE.Mesh) => {
                                    cloneGeom(m);
                                });
                            }
                        }
                    // })
                })

                // requestIdleCallback(()=>{
                    this.mergeWorker.postMessage({
                        type: "merge"
                    })
                // })

                this.mergeWorker.onmessage = (event) => {
                    if(!event.data.geometry) return;

                    mergedGeometry = event.data.geometry;
                    mergedGeometry.__proto__ = BufferGeometry.prototype;
                    mergedGeometry.index && (mergedGeometry.index.__proto__ = BufferAttribute.prototype);
                    mergedGeometry.attributes.position.__proto__ = BufferAttribute.prototype;
                    mergedGeometry.attributes.normal && (mergedGeometry.attributes.normal.__proto__ = BufferAttribute.prototype);

                    // 删除uv属性
                    if(mergedGeometry.attributes.uv){
                        mergedGeometry.deleteAttribute("uv");
                    }

                    const newMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial());
                    newMesh.visible = false;

                    environment.add(newMesh);

                    generateBVH().then(() => {
                        resolve("");
                    });

                    // 关闭 worker
                    this.mergeWorker.terminate();
                }
            })
        }

        return generateMergedGeometry();
    }

    // 重置人物位置
    resetPlayer() {
        const player = this.player as THREE.Mesh;

        this.playerVelocity.set(0, 0, 0);
        player.position.copy(this.playerInitPos);

        // 播放模型进入动画
        this.personStatus?.init();

        this.camera.position.sub(this.orbitControl.target);
        this.orbitControl.target.copy(player.position);
        this.camera.position.add(player.position);
        this.orbitControl.update();
    }

    // 进入漫游
    startRoaming() {
        if (this.isRoaming) return;

        this.isRoaming = true;

        this.group.visible = true;

        this.resetPlayer();
    }

    // 退出漫游
    exitRoaming(lastRoadCameraPos: THREE.Vector3) {
        this.group.visible = false;

        this.camera.position.copy(lastRoadCameraPos);

        this.orbitControl.maxPolarAngle = Math.PI;
        this.orbitControl.minDistance = 0;
        this.orbitControl.maxDistance = Infinity;

        this.orbitControl.update();
        this.isRoaming = false;

        // 停用混合器上所有预定的动作
        this.personStatus?.stopAllAction();

        useDispatchSignal("sceneGraphChanged");
    }

    render(delta: number) {
        if(!delta) return;

        const player = this.player as THREE.Object3D;

        if (this.playerIsOnGround) {
            this.playerVelocity.y = delta * this.gravity;
        } else {
            this.playerVelocity.y += delta * this.gravity;
        }

        // 人物竖直方向移动（跳跃）
        player.position.addScaledVector(this.playerVelocity, delta);

        /* 人物移动 */
        const angle = this.orbitControl.getAzimuthalAngle();
        if (this.fwdPressed) {
            this.tempVector.set(0, 0, -1).applyAxisAngle(this.upVector, angle);
            player.position.addScaledVector(this.tempVector, this.playerSpeed * delta);
        }

        if (this.bkdPressed) {
            this.tempVector.set(0, 0, 1).applyAxisAngle(this.upVector, angle);
            player.position.addScaledVector(this.tempVector, this.playerSpeed * delta);
        }

        if (this.lftPressed) {
            this.tempVector.set(-1, 0, 0).applyAxisAngle(this.upVector, angle);
            player.position.addScaledVector(this.tempVector, this.playerSpeed * delta);
        }

        if (this.rgtPressed) {
            this.tempVector.set(1, 0, 0).applyAxisAngle(this.upVector, angle);
            player.position.addScaledVector(this.tempVector, this.playerSpeed * delta);
        }

        player.updateMatrixWorld();

        // @ts-ignore 根据碰撞调整位置
        const capsuleInfo = player.capsuleInfo;
        this.tempBox.makeEmpty();
        this.tempMat.copy((this.collider as THREE.Mesh).matrixWorld).invert();
        this.tempSegment.copy(capsuleInfo.segment);

        // 获得胶囊在碰撞器的局部空间中的位置
        this.tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(this.tempMat);
        this.tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(this.tempMat);

        // 获取胶囊的轴对齐边界框
        this.tempBox.expandByPoint(this.tempSegment.start);
        this.tempBox.expandByPoint(this.tempSegment.end);
        this.tempBox.min.addScalar(-capsuleInfo.radius);
        this.tempBox.max.addScalar(capsuleInfo.radius);

        // @ts-ignore
        this.collider.geometry.boundsTree.shapecast({
            intersectsBounds: box => box.intersectsBox(this.tempBox),
            intersectsTriangle: tri => {
                // 检查三角形是否与胶囊相交，如果相交则调整胶囊位置。
                const triPoint = this.tempVector;
                const capsulePoint = this.tempVector2;

                const distance = tri.closestPointToSegment(this.tempSegment, triPoint, capsulePoint);
                if (distance < capsuleInfo.radius) {
                    const depth = capsuleInfo.radius - distance;
                    const direction = capsulePoint.sub(triPoint).normalize();

                    this.tempSegment.start.addScaledVector(direction, depth);
                    this.tempSegment.end.addScaledVector(direction, depth);
                }
            }
        });

        // 在检查三角形碰撞并移动后，获得胶囊碰撞器在世界空间中的调整位置。假设capsule.info.segment.start是玩家模型的原点。
        const newPosition = this.tempVector;
        newPosition.copy(this.tempSegment.start).applyMatrix4((this.collider as THREE.Mesh).matrixWorld);

        // 检查碰撞器移动了多少
        const deltaVector = this.tempVector2;
        deltaVector.subVectors(newPosition, player.position);

        // 如果玩家主要是垂直调整，我们就会认为它是在地面上
        this.playerIsOnGround = deltaVector.y > Math.abs(delta * this.playerVelocity.y * 0.25);

        const offset = Math.max(0.0, deltaVector.length() - 1e-5);
        deltaVector.normalize().multiplyScalar(offset);

        // 调整玩家模型的位置;
        player.position.add(deltaVector);
        if (!this.playerIsOnGround) {
            deltaVector.normalize();
            this.playerVelocity.addScaledVector(deltaVector, -deltaVector.dot(this.playerVelocity));
        } else {
            this.playerVelocity.set(0, 0, 0);
        }

        // 调整相机
        const v = new THREE.Vector3(player.position.x, player.position.y + 0.8, player.position.z);
        this.camera.position.sub(this.orbitControl.target);
        this.orbitControl.target.copy(v);
        this.camera.position.add(v);

        if (this.person) {
            const p = player.position.clone();
            this.person.position.set(p.x, p.y - 1.4, p.z);
        }

        //如果玩家跌得太低，将他们的位置重置到起点
        if (window.viewer.sceneBox3 && (window.viewer.sceneBox3.min.y - player.position.y > 15)) {
            this.resetPlayer();
        }

        this.personStatus?.update(delta);
    }

    dispose() {
        window.removeEventListener('keydown', keyDownFn);
        window.removeEventListener('keyup', keyUpFn);

        this.scene.remove(this.group);

        this.personStatus?.dispose();
    }
}