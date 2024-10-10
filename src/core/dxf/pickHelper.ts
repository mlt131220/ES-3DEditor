import {Raycaster, Mesh, Group, Vector2} from "three";

export class PickHelper {
    private raycaster: Raycaster;
    private pickedObject: Mesh | Group | undefined;

    constructor() {
        this.raycaster = new Raycaster();
    }

    pick(normalizedPosition: Vector2, scene, camera) {
        // 如果有被选中的物体，则恢复颜色
        if (this.pickedObject) {
            this.pickedObject.traverse(child => {
                // @ts-ignore
                if (!child.material) return;

                child.layers.set(0);

                // @ts-ignore
                child.material.color.setHex(child.material.userData.materialColor);
            })

            this.pickedObject = undefined;
        }

        // 透过截锥投射一道光线
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // 获取射线相交的物体列表
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // 选择第一个对象。这是最近的一个
            this.pickedObject = intersectedObjects[0].object as Mesh;

            if (this.pickedObject.parent && this.pickedObject.parent.type !== "Scene") {
                this.pickedObject = this.pickedObject.parent as Group;
            }

            this.pickedObject.traverse(child => {
                // @ts-ignore
                if (!child.material) return;

                // @ts-ignore 文字(单行/多行文本)不添加辉光效果，会模糊
                if (child.geometry.type != "TextGeometry" && !child.text) {
                    child.layers.set(1);
                }

                // @ts-ignore 存储他原来的颜色
                child.material.userData = {
                    // @ts-ignore
                    materialColor: child.material.color.getHex()
                };
                // @ts-ignore 设置其发射颜色为闪烁的黄
                child.material.color.setHex(0xFFFF00);
            })
        }
    }
}