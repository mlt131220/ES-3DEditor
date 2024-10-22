import * as THREE from "three";

/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/10/21 21:16
 * @description 场景相机管理器。 TODO: 后续应把viewport.camera也管理进来
 */
export class ViewportCameraManage{
    private readonly viewport: any;

    private _orthographicCamera: THREE.OrthographicCamera;

    constructor(viewport) {
        this.viewport = viewport;

        this._orthographicCamera = this.registerViewOrthographicCamera();
    }

    /**
     * 注册六视图使用的正交相机
     */
    registerViewOrthographicCamera(){
        const oCamera = new THREE.OrthographicCamera(-100, 100, 100, -100,-10000, 10000);
        oCamera.name = "View OrthographicCamera";
        window.editor.addCamera(oCamera);

        return oCamera;
    }

    computedOrthographicCamera(){
        const boxSize = this.viewport.sceneBox3.getSize(new THREE.Vector3());
        const boxCenter = this.viewport.sceneBox3.getCenter(new THREE.Vector3());

        let aspect = this.viewport.camera.aspect;
        if(!aspect) {
            aspect = this.viewport.container.offsetWidth / this.viewport.container.offsetHeight;
        }

        // 根据场景的宽度或高度设置可视范围
        const frustumSize = Math.max(boxSize.x, boxSize.y) * 1.5;

        this._orthographicCamera.left = frustumSize * aspect / -2 ;
        this._orthographicCamera.right = frustumSize * aspect / 2 ;
        this._orthographicCamera.top = frustumSize / 2 ;
        this._orthographicCamera.bottom = frustumSize / -2 ;
        this._orthographicCamera.near = this.viewport.camera.near || 0.1;
        this._orthographicCamera.far = this.viewport.camera.far || 10 * 1000;
        this._orthographicCamera.updateProjectionMatrix();

        return {boxCenter,boxSize};
    }


    /**
     * 前视图
     * @description 以z轴方向为正前方
     */
    front(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x, boxCenter.y, boxCenter.z + boxSize.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 后视图
     * @description -z方向
     */
    rear(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x, boxCenter.y, boxCenter.z - boxSize.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 左视图
     * @description -x方向
     */
    left(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x  - boxSize.x, boxCenter.y, boxCenter.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 右视图
     * @description x方向
     */
    right(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x + boxSize.x, boxCenter.y, boxCenter.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 顶视图
     * @description y方向
     */
    top(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x, boxCenter.y + boxSize.y, boxCenter.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 底视图
     * @description -y方向
     */
    bottom(){
        return new Promise((resolve, reject) => {
            try {
                const {boxCenter,boxSize} = this.computedOrthographicCamera();

                // 设置相机位置，确保它在 Box3 的前面，z 值向外
                this._orthographicCamera.position.set(boxCenter.x, boxCenter.y - boxSize.y, boxCenter.z);
                // 朝向场景中心
                this._orthographicCamera.lookAt(boxCenter);

                this.viewport.render();

                resolve(this._orthographicCamera);
            }catch (e) {
                reject(e)
            }
        })
    }
}