import {h, reactive, ref} from "vue";
import {FormInst, NForm, NFormItem, NInput, NButton, NSelect, NCheckbox} from "naive-ui"
import {downloadBlob, saveArrayBuffer, saveString} from '@/utils/common/utils';
import {getAnimations} from '@/utils/common/scenes';
import {zipSync, strToU8} from 'three/examples/jsm/libs/fflate.module.js';
import * as THREE from 'three';
import {useDispatchSignal} from "@/hooks/useSignal";
import {CESIUM_DEFAULT_MAP, CESIUM_DEFAULT_MAP_TYPE} from "@/config/cesium";
import {demoEnv} from "@/config/global";
import {EsLoader} from "@/utils/esloader/EsLoader";

export class MenubarFile {
    constructor() {
    }

    // 调用对应方法
    init(key: string) {
        this[key]();
    }

    // 新建ThreeJs场景
    reCreate() {
        window.$dialog.warning({
            title: window.$t('other.warning'),
            content: window.$t("core['Any unsaved data will be lost. Are you sure?']"),
            positiveText: window.$t('other.ok'),
            negativeText: window.$t('other.cancel'),
            onPositiveClick: () => {
                //从Cesium场景切换为选择Three场景
                if (window.editor.config.getKey('project/currentSceneType') === 'cesium') {
                    useDispatchSignal("cesium_destroy");
                }

                //当前场景类型改变为three
                useDispatchSignal("changCurrentSceneType", "three");
                setTimeout(() => {
                    // 重置场景
                    window.editor.reset()
                }, 50)
            },
        });
    }

    // 新建cesium场景
    newCesium() {
        const form = reactive({
            token: window.editor.config.getKey('cesium/token'),
            map: window.editor.config.getKey('cesium/defaultMap'),
            mapType: window.editor.config.getKey('cesium/defaultMapType'),
            markMap: window.editor.config.getKey('cesium/markMap')
        })
        const rules = {
            token: {required: true, message: window.$t("cesium['Please Enter Cesium Token']"), trigger: ['input', 'blur']}
        }
        const formRef = ref<FormInst | null>(null)

        window.$dialog.warning({
            title: window.$t('other.warning'),
            content: window.$t("core['Any unsaved data will be lost. Are you sure?']"),
            positiveText: window.$t('other.ok'),
            negativeText: window.$t('other.cancel'),
            onPositiveClick: () => {
                const dialog = window.$dialog.info({
                    title: 'Cesium 配置项',
                    style: "width:560px",
                    content: () => h(NForm,
                        {
                            model: form,
                            rules: rules,
                            labelPlacement: "left",
                            labelWidth: "auto",
                            size: "small",
                            ref: formRef
                        },
                        [
                            //cesium token
                            h(NFormItem, {label: "Cesium Token", path: "token"}, h(NInput, {
                                    placeholder: window.$t("cesium['Please Enter Cesium Token']"),
                                    value: form.token,
                                    'onInput': (value) => {
                                        form.token = value;
                                    }
                                })
                            ),
                            //默认底图
                            h(NFormItem, {label: window.$t("cesium['Default base map']")}, [h(NSelect, {
                                    value: form.map,
                                    options: CESIUM_DEFAULT_MAP,
                                    'on-update:value': (value) => {
                                        form.map = value;
                                    }
                                })]
                            ),
                            //默认底图类型
                            h(NFormItem, {label: window.$t("cesium['Base map type']")}, [
                                    h(NSelect, {
                                        value: form.mapType,
                                        options: CESIUM_DEFAULT_MAP_TYPE,
                                        'on-update:value': (value) => {
                                            form.mapType = value;
                                        }
                                    }),
                                    // 只有影像图能选择附加标记图
                                    form.mapType === "satellite" && h(NCheckbox, {
                                        checked: form.markMap,
                                        style: "width:130px;margin-left:15%;",
                                        'on-update:checked': (value) => {
                                            form.markMap = value;
                                        }
                                    }, "标记图")
                                ]
                            )
                        ]
                    ),
                    action: () => h("div", {}, [
                        h(NButton, {
                            size: "small", onClick() {
                                dialog.destroy()
                            }
                        }, window.$t('other.cancel')),
                        h(NButton, {
                            type: "success",
                            size: "small",
                            style: "margin-left:10px;",
                            onClick(e) {
                                e.preventDefault()
                                formRef.value?.validate((errors) => {
                                    if (!errors) {
                                        window.editor.config.setKey('cesium/token', form.token);
                                        window.editor.config.setKey('cesium/defaultMap', form.map);
                                        window.editor.config.setKey('cesium/defaultMapType', form.mapType);
                                        window.editor.config.setKey('cesium/markMap', form.markMap);

                                        window.editor.clear();
                                        //已在Cesium场景下时选择新建Cesium场景
                                        if (window.editor.config.getKey('project/currentSceneType') === 'cesium') {
                                            window.CesiumApp.reset();
                                        }
                                        //当前场景类型改变为cesium
                                        useDispatchSignal("changCurrentSceneType", "cesium");

                                        dialog.destroy();
                                    } else {
                                        window.$message?.error(errors.toString());
                                    }
                                })
                            }
                        }, window.$t('other.ok'))
                    ])
                })
            }
        });
    }

    //导入
    import() {
        const form = document.createElement('form');
        form.style.display = 'none';
        document.body.appendChild(form);

        const fileInput = document.createElement('input');
        fileInput.multiple = true;
        fileInput.type = 'file';
        fileInput.addEventListener('change', function () {
            window.editor.loader.loadFiles(fileInput.files, undefined, () => {
                form.reset();
            });
        });
        form.appendChild(fileInput);

        fileInput.click();
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

    /*********************************发布*******************************************/
    //预览
    preview() {
    }

    //发布
    release() {
        if(demoEnv){
            window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
            return;
        }

        const toZip = {};

        let output = window.editor.toJSON();
        output.metadata.type = 'ES-App';
        delete output.history;

        try {
            output = JSON.stringify(output, null, '\t');
            output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        } catch (error: any) {
            window.$message?.error(error.message);
        }

        toZip['app.json'] = strToU8(output);

        const title = window.editor.config.getKey('project/title');
        const manager = new THREE.LoadingManager(function () {
            const zipped = zipSync(toZip, {level: 9});

            const blob = new Blob([zipped.buffer], {type: 'application/zip'});

            downloadBlob(blob, (title !== '' ? title : 'untitled') + '.zip');
        });

        const loader = new THREE.FileLoader(manager);
        loader.load('/release/index.html', function (content: any) {
            content = content.replace('{{ title }}', title);
            const includes = [];
            content = content.replace('{{ includes }}', includes.join('\n\t\t'));
            let editButton = '';
            if (window.editor.config.getKey('project/editable')) {
                editButton = [
                    "<script>",
                    "			let button = document.createElement( 'a' );",
                    "			button.href = '//editor.mhbdng.cn/editor/#file=' + location.href.split( '/' ).slice( 0, - 1 ).join( '/' ) + '/app.json';",
                    "			button.style.cssText = 'position: absolute; bottom: 20px; right: 20px; padding: 10px 16px; color: #fff; border: 1px solid #fff; border-radius: 20px; text-decoration: none;';",
                    "			button.target = '_blank';",
                    "			button.textContent = 'EDIT';",
                    '			document.body.appendChild( button );',
                    "</script>",
                ].join('\n');
            }
            content = content.replace('<edit_button />', editButton);
            toZip['index.html'] = strToU8(content);
        });
        loader.load('/release/js/app.js', function (content) {
            toZip['js/app.js'] = strToU8(content);
        });
        loader.load('/release/lib/three.module.js', function (content) {
            toZip['js/three.module.js'] = strToU8(content);
        });
        loader.load('/release/js/VRButton.js', function (content) {
            toZip['js/VRButton.js'] = strToU8(content);
        });
    }
}
