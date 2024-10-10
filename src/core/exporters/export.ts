import {saveArrayBuffer, saveString} from '@/utils/common/utils';
import {getAnimations} from '@/utils/common/scenes';
import {useDispatchSignal} from "@/hooks/useSignal";
import {EsLoader} from "@/utils/esloader/EsLoader";

export class Export {
    constructor() {
    }

    // 调用对应方法
    init(key: string) {
        this[key]();
    }

    //导入zip
    importZip(){
        const esLoader = new EsLoader();

        const form = document.createElement('form');
        form.style.display = 'none';
        document.body.appendChild(form);

        const fileInput = document.createElement('input');
        fileInput.multiple = false;
        fileInput.type = 'file';
        fileInput.accept = '.zip';
        fileInput.addEventListener('change', function () {
            if(fileInput.files && fileInput.files.length > 0){
                esLoader.unpack(fileInput.files[0]).then((sceneJson) => {
                    window.editor.fromJSON(sceneJson).then(() => {
                        useDispatchSignal("sceneLoadComplete");

                        form.reset();
                    })
                });
            }
        });
        form.appendChild(fileInput);

        fileInput.click();
    }

    /*********************************导出*******************************************/

    //导出几何体
    exportGeometry() {
        const object = window.editor.selected;
        if (object === null) {
            window.$message?.error(window.$t("prompt['No object selected.']"));
            return;
        }

        const geometry = object.geometry;
        if (geometry === undefined) {
            window.$message?.error(
                window.$t("prompt['The selected object doesn't have geometry.']")
            );
            return;
        }

        let output = geometry.toJSON();
        try {
            output = JSON.stringify(output, null, '\t');
            output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        } catch (e) {
            output = JSON.stringify(output);
        }

        saveString(output, 'geometry.json');
    }

    //导出物体
    exportObject() {
        const object = window.editor.selected;
        if (object === null) {
            window.$message?.error(window.$t("prompt['No object selected.']"));
            return;
        }

        let output = object.toJSON();
        try {
            output = JSON.stringify(output, null, '\t');
            output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        } catch (e) {
            output = JSON.stringify(output);
        }

        saveString(output, 'model.json');
    }

    //导出场景
    exportScene() {
        let output = window.editor.scene.toJSON();
        try {
            output = JSON.stringify(output, null, '\t');
            output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        } catch (e) {
            output = JSON.stringify(output);
        }

        saveString(output, 'scene.json');
    }

    //导出dae
    async exportDae() {
        const {ColladaExporter} = await import('@/core/exporters/ColladaExporter.js');

        const exporter = new ColladaExporter();

        exporter.parse(
            window.editor.scene,
            function (result) {
                saveString(result.data, 'scene.dae');
            },
            {author: '二三', version: '1.0'}
        );
    }

    // 导出glb
    async exportGlb() {
        const scene = window.editor.scene;
        const animations = getAnimations();

        const {GLTFExporter} = await import('three/examples/jsm/exporters/GLTFExporter.js');

        const exporter = new GLTFExporter();

        exporter.parse(
            scene,
            function (result) {
                saveArrayBuffer(result, 'scene.glb');
            },
            () => {
            },
            {binary: true, animations: animations}
        );
    }

    //导出gltf
    async exportGltf() {
        const scene = window.editor.scene;
        const animations = getAnimations();

        const {GLTFExporter} = await import('three/examples/jsm/exporters/GLTFExporter.js');
        const exporter = new GLTFExporter();
        console.log(GLTFExporter,exporter)

        exporter.parse(
            scene,
            function (result) {
                saveString(JSON.stringify(result, null, 2), 'scene.gltf');
            },
            () => {},
            {animations: animations}
        );
    }

    //导出obj
    async exportObj() {
        const object = window.editor.selected;

        if (object === null) {
            window.$message?.error(window.$t("prompt['No object selected.']"));
            return;
        }

        const {OBJExporter} = await import('three/examples/jsm/exporters/OBJExporter.js');

        const exporter = new OBJExporter();

        saveString(exporter.parse(object), 'model.obj');
    }

    //导出ply
    async exportPly() {
        const {PLYExporter} = await import('three/examples/jsm/exporters/PLYExporter.js');

        const exporter = new PLYExporter();

        exporter.parse(
            window.editor.scene,
            function (result) {
                saveArrayBuffer(result, 'model.ply');
            },
            {}
        );
    }

    // 导出ply二进制
    async exportPlyBinary() {
        const {PLYExporter} = await import('three/examples/jsm/exporters/PLYExporter.js');

        const exporter = new PLYExporter();

        exporter.parse(
            window.editor.scene,
            function (result) {
                saveArrayBuffer(result, 'model-binary.ply');
            },
            {binary: true}
        );
    }

    //导出STL
    async exportStl() {
        const {STLExporter} = await import('three/examples/jsm/exporters/STLExporter.js');

        const exporter = new STLExporter();

        saveString(exporter.parse(window.editor.scene), 'model.stl');
    }

    //导出STL(二进制)
    async exportStlBinary() {
        const {STLExporter} = await import('three/examples/jsm/exporters/STLExporter.js');

        const exporter = new STLExporter();

        saveArrayBuffer(exporter.parse(window.editor.scene, {binary: true}), 'model-binary.stl');
    }

    //导出USDZ
    async exportUSDZ() {
        const {USDZExporter} = await import('three/examples/jsm/exporters/USDZExporter.js');

        const exporter = new USDZExporter();
        //@ts-ignore
        saveArrayBuffer(await exporter.parse(window.editor.scene, {binary: true}), 'model.usdz');
    }
}
