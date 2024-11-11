import { Raycaster, Mesh, Group, Vector2, Scene, OrthographicCamera } from "three";

export class PickHelper {
    private raycaster: Raycaster;
    private pickedObject: Mesh | Group | undefined;
    private objects: Mesh[];
    private camera: OrthographicCamera;
    private scene: Scene;
    private bloomLayer: number;

    constructor(scene: Scene, camera: OrthographicCamera, bloomLayer: number) {
        this.camera = camera;
        this.scene = scene;

        this.bloomLayer = bloomLayer;

        this.raycaster = new Raycaster();

        this.objects = [];

        this.scene.traverseVisible(child => {
            if (child.children.length == 0) {
                this.objects.push(<Mesh>child);
            }
        });
    }

    pick(normalizedPosition: Vector2,) {
        // 透过截锥投射一道光线
        this.raycaster.setFromCamera(normalizedPosition, this.camera);
        // 获取射线相交的物体列表
        const intersectedObjects = this.raycaster.intersectObjects(this.objects, false);
        if (intersectedObjects.length) {
            // 选择第一个对象。这是最近的一个
            this.select(intersectedObjects[0].object as Mesh);
        }
    }

    select(object: Mesh | Group) {
        if (!object || object.uuid === this.pickedObject?.uuid) return;

        // 如果有被选中的物体，则恢复
        if (this.pickedObject) {
            this.pickedObject.layers.toggle(this.bloomLayer);

            this.pickedObject = undefined;
        }

        this.pickedObject = object;
        this.pickedObject.layers.toggle(this.bloomLayer);
    }
}