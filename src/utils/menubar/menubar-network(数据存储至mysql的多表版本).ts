import {h, reactive, ref, toRaw, unref} from "vue";
import {useDispatchSignal} from "@/hooks/useSignal";
import * as THREE from "three";
import {SceneJsonGeometry, SceneJsonImage, SceneJsonModel, Service, TraverseWorkerData} from "../../../types/network";
import TraverseWorker from '../worker/sceneTraverseWorker.js?worker';
import RequestWorker from '../worker/requestWorker.js?worker';
import {NotificationReactive, NDataTable, NTag, NButton, NPagination} from 'naive-ui'
import {fetchDeleteScenes, fetchGetAllScenes, fetchGetGeometry, fetchGetImage, fetchGetModel} from "@/http/api/scenes";
import {unzip, zip} from "@/utils/common/pako";
import {_base64ToArrayBuffer} from "@/utils/common/base64";
import {demoEnv} from "@/utils/common/constant";

const sceneTableLoading = ref(false);
let notification: NotificationReactive;
//scene下遍历出来的所有层级的模型
let sceneTraverseModels: Array<SceneJsonModel> = [];
//worker线程ajax保存模型的进度
let workerModel = 0;
//scene下遍历出来的所有的模型贴图
let sceneTraverseModelsImages: Array<SceneJsonImage> = [];
//worker线程ajax保存贴图的进度
let workerImage = 0;
//scene下所有的几何数据
let sceneTraverseModelsGeometries: Array<SceneJsonGeometry> = [];
let workerGeometries = 0;

//网络请求的worker线程
let requestWorker = new RequestWorker();
requestWorker.onmessage = function (event) {
    workerOnMessage(event.data);
}
//接收worker线程返回的信息
const workerOnMessage = (data) => {
    switch (data.type) {
        case "scene":
            if (data.operation === "error") {
                notification.content = `场景信息保存错误：${data.message}`;
                setTimeout(() => {
                    notification.destroy();
                }, 1500)
                return;
            }
            //接着开始存image贴图
            if (sceneTraverseModelsImages.length !== 0) {
                console.log(sceneTraverseModelsImages)
                requestWorker.postMessage({
                    type: "images",
                    data: sceneTraverseModelsImages,
                    url: "/editor3d/scenesImages/add",
                });
                notification.content = `正在保存贴图  ${workerImage + 1}/${sceneTraverseModelsImages.length}`;
            } else {
                //开始保存几何数据
                workerImage = 0;
                notification.content = `正在保存模型几何数据  ${workerGeometries + 1}/${sceneTraverseModelsGeometries.length}`;
                requestWorker.postMessage({
                    type: "geometry",
                    data: sceneTraverseModelsGeometries,
                    url: "/editor3d/scenesGeometry/add",
                });
            }
            break;
        case "images":
            if (data.operation === "error") {
                notification.content = `贴图信息保存错误：${data.message}。UUID:${sceneTraverseModelsImages[workerImage].uuid}`;
                workerImage = 0;
                setTimeout(() => {
                    notification.destroy();
                }, 1500)
                return;
            }
            workerImage++;
            notification.content = `正在保存贴图  ${workerImage + 1}/${sceneTraverseModelsImages.length}`;
            if (workerImage === sceneTraverseModelsImages.length) {
                //开始保存几何数据
                workerImage = 0;
                notification.content = `正在保存模型几何数据  ${workerGeometries + 1}/${sceneTraverseModelsGeometries.length}`;
                requestWorker.postMessage({
                    type: "geometry",
                    data: sceneTraverseModelsGeometries,
                    url: "/editor3d/scenesGeometry/add",
                });
            }
            break;
        case "geometry":
            if (data.operation === "error") {
                notification.content = `模型几何数据保存错误：${data.message}。UUID：${sceneTraverseModels[workerGeometries].uuid}。`;
                workerGeometries = 0;
                setTimeout(() => {
                    notification.destroy();
                }, 1500)
                return;
            }
            workerGeometries++;
            notification.content = `正在保存模型几何数据  ${workerGeometries + 1}/${sceneTraverseModelsGeometries.length}`;
            if (workerGeometries === sceneTraverseModelsGeometries.length) {
                //开始保存模型
                workerGeometries = 0;
                notification.content = `正在保存模型  ${workerModel + 1}/${sceneTraverseModels.length}`;
                requestWorker.postMessage({
                    type: "models",
                    data: sceneTraverseModels,
                    url: "/editor3d/scenesModels/add",
                });
            }
            break;
        case "models":
            if (data.operation === "error") {
                notification.content = `模型信息保存错误：${data.message}。
					UUID：${sceneTraverseModels[workerModel].uuid}。`;
                workerModel = 0;
                setTimeout(() => {
                    notification.destroy();
                }, 1500)
                return;
            }
            workerModel++;
            notification.content = `正在保存模型  ${workerModel + 1}/${sceneTraverseModels.length}`;
            if (workerModel == sceneTraverseModels.length) {
                workerModel = 0;

                notification.content = `工程已保存`;
                setTimeout(() => {
                    notification.destroy();
                }, 500)
            }
            break;
    }
}

//遍历场景JSON化的worker线程
let traverseWorker = new TraverseWorker();
traverseWorker.onmessage = function (event) {
    let data: TraverseWorkerData = event.data;

    console.log("traverseWorker - onmessage - data:", data)

    if (data.status === "error") {
        window.$message?.error(data.message)
        return;
    }

    let sceneObject;
    //为避免数据量过大超过V8引擎对于字符串2^32的限制，分为多次传输（100个模型传输一次）
    if (data.status === "models") {
        //启用zip压缩，output:Array<string>
        sceneTraverseModels.push(...data.models.map(m => {
            return {
                uuid: m.uuid,
                sceneId: m.sceneId,
                model: zip(m.model)
            }
        }));
        return;
    } else if (data.status === "images") {
        sceneTraverseModelsImages = data.images;
        return;
    } else if (data.status === "geometries") {
        //启用zip压缩，output:Array<string>
        sceneTraverseModelsGeometries = data.geometries.map(gm => {
            return {
                uuid: gm.uuid,
                sceneId: gm.sceneId,
                geometry: zip(gm.geometry)
            }
        });
        return;
    } else if (data.status === "scene") {
        sceneObject = JSON.stringify(data.sceneJson);
    }

    let sceneDto = {
        sceneId: window.editor.config.getKey('project/sceneID'),
        sceneName: window.editor.config.getKey('project/title'),
        sceneIntroduction: window.editor.config.getKey('project/introduction'),
        sceneVersion: parseFloat(window.editor.config.getKey('project/version')),
        isCesium: window.editor.config.getKey('project/currentSceneType') === "cesium" ? 1 : 0,
        sceneObject
    };

    console.group()
    console.log("worker线程遍历后的场景模型JSON:", sceneTraverseModels);
    console.log("worker线程遍历后的贴图JSON:", sceneTraverseModelsImages);
    console.log("worker线程遍历后的几何数据JSON:", sceneTraverseModelsGeometries);
    console.log("sceneJSON:", sceneDto);
    console.groupEnd()

    requestWorker.postMessage({
        type: "scene",
        data: sceneDto,
        url: "/editor3d/scenes/add",
    });

    //遍历完场景数据则隐藏遮罩，显示等待框
    useDispatchSignal("switchViewportLoading", false);
    notification = window.$notification.info({
        title: `${window.$t("scene['In storage']")}...`,
        content: `${window.$t("scene['Scene information is being saved']")},${window.$t("other.Loading")}...`,
        closable: false,
    })

    //终止worker
    traverseWorker.terminate();
}

export class MenubarNetwork {
    constructor() {

    }

    // 调用对应方法
    init(key: string) {
        this[key]();
    }

    //作为新工程保存至服务器
    saveNewProjectToServer() {
        if (demoEnv) {
            window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
            return;
        }

        window.$dialog.warning({
            title: window.$t('other.warning'),
            content: window.$t("prompt['Are you sure to save the scene as a new project?']"),
            positiveText: window.$t('other.ok'),
            negativeText: window.$t('other.cancel'),
            onPositiveClick: () => {
                useDispatchSignal("changeViewportLoadingText", window.$t("scene['Generate scene data']"));
                useDispatchSignal("switchViewportLoading", true);

                let sceneJson = window.editor.scene.toJSON();
                //将camera放进sceneJSON
                sceneJson.camera = window.editor.camera.toJSON();

                //worker线程遍历场景
                traverseWorker.postMessage({
                    sceneJson: sceneJson,
                    sceneId: window.editor.config.getKey('project/sceneID')
                })
            }
        });
    }

    //从服务器获取工程
    async getProjectForServer() {
        const data = ref([]);
        let paginationReactive = reactive({
            page: 1,
            pageSize: 10,
            pageCount: 1,
            "on-update:page": (page: number) => {
                paginationReactive.page = page;
                fetchData();
            }
        })
        sceneTableLoading.value = true;

        const fetchData = async () => {
            const res: Service.SuccessResult = await fetchGetAllScenes({
                offset: (paginationReactive.page - 1) * paginationReactive.pageSize,
                limit: paginationReactive.pageSize
            }) as Service.SuccessResult;

            data.value = res.data.items;
            paginationReactive.pageCount = res.data.pages;
            sceneTableLoading.value = false;
        }

        await fetchData();

        let dialog;
        dialog = window.$dialog.info({
            title: window.$t("scene['All Projects']"),
            content: () => h(
                "div",
                {style:"margin-top:20px;"},
                [
                    h(NDataTable, {
                        columns: [
                            {
                                title: 'SceneId',
                                key: 'sceneId'
                            },
                            {
                                title: window.$t("scene['Scene Name']"),
                                key: 'sceneName'
                            },
                            {
                                title: window.$t("scene['Scene Introduction']"),
                                key: 'sceneIntroduction'
                            },
                            {
                                title: window.$t("other.Version"),
                                key: 'sceneVersion',
                                render(row) {
                                    return h(
                                        NTag,
                                        {
                                            type: 'info',
                                            bordered: false
                                        },
                                        {
                                            default: () => row.sceneVersion
                                        }
                                    )
                                }
                            },
                            {
                                title: window.$t('other.Action'),
                                key: 'actions',
                                render(row) {
                                    return h(
                                        "div",
                                        {
                                            style: {
                                                display: "flex",
                                                "justify-content": "space-evenly"
                                            }
                                        },
                                        [
                                            h(
                                                NButton,
                                                {
                                                    size: 'small',
                                                    onClick: () => getScene(toRaw(row))
                                                },
                                                {default: () => window.$t('other.ok')}
                                            ),
                                            h(
                                                NButton,
                                                {
                                                    size: 'small',
                                                    type: "error",
                                                    onClick: () => deleteScene(row.sceneId)
                                                },
                                                {default: () => window.$t('other.delete')}
                                            )
                                        ]
                                    )
                                }
                            }
                        ],
                        size: "small",
                        data: unref(data) as any[],
                        loading: sceneTableLoading.value
                    }),
                    h("div", {
                        style: "display:flex;justify-content: end;margin-top:15px;"
                    }, [
                        h(NPagination, paginationReactive)
                    ])
                ]),
            autoFocus: false,
            style: {
                width: "50vw"
            }
        })

        //拉取场景
        const getScene = (sceneInfo) => {
            let sceneJson = JSON.parse(sceneInfo.sceneObject);
            let notice;
            let getImagesLength = 0;
            let getModelsLength = 0;
            let getGeometryLength = 0;

            dialog.destroy();
            notice = window.$notification.info({
                title: window.$t("scene['Get the scene data']") + "...",
                content: window.$t("other.Loading") + "...",
                closable: false,
            })

            //判断是否存在贴图
            sceneJson.images?.length > 0 ? getImages() : getSceneGeometry();

            //获取scene下的贴图
            function getImages() {
                notice.content = `${window.$t("scene['Getting texture']")} ${getImagesLength + 1}/${sceneJson.images.length}`;
                //遍历获取贴图images
                for (let i = 0; i < sceneJson.images.length; i++) {
                    fetchGetImage({sceneId:sceneInfo.sceneId, uuid:sceneJson.images[i]}).then((res: Service.SuccessResult) => {
                        if(res.data.urlType !== "base64"){
                            res.data.url = JSON.parse(res.data.url);
                            res.data.url.data = _base64ToArrayBuffer(res.data.url.data);
                        }
                        sceneJson.images[i] = {
                            "uuid": res.data.uuid,
                            "url":res.data.url
                        }

                        getImagesLength++;
                        notice.content = `${window.$t("scene['Getting texture']")} ${getImagesLength + 1}/${sceneJson.images.length}`;
                        if (getImagesLength === sceneJson.images.length) {
                            notice.content = `${window.$t("scene['Getting geometries']")} ${getGeometryLength + 1}/${sceneJson.geometries.length}`;
                            getSceneGeometry();
                        }
                    })
                }
            }

            //获取scene下的几何体数据
            function getSceneGeometry() {
                console.log(sceneJson)
                for (let i = 0; i < sceneJson.geometries.length; i++) {
                    fetchGetGeometry({sceneId:sceneInfo.sceneId, uuid:sceneJson.geometries[i]}).then((res: Service.SuccessResult) => {
                        //解压数据
                        sceneJson.geometries[i] = unzip(res.data.geometry)

                        getGeometryLength++;
                        notice.content = `${window.$t("scene['Getting geometries']")} ${getGeometryLength + 1}/${sceneJson.geometries.length}`;
                        if (getGeometryLength === sceneJson.geometries.length) {
                            notice.content = `${window.$t("scene['Getting models']")} ${getModelsLength + 1}/${sceneJson.modelTotal}`;
                            //遍历获取模型
                            traverseSceneModel(sceneJson.object);
                        }
                    })
                }
            }

            //遍历获取scene下的模型
            function traverseSceneModel(object) {
                for (let m = 0; m < object.children.length; m++) {
                    fetchGetModel({sceneId:sceneInfo.sceneId, uuid:object.children[m].uuid}).then((res: Service.SuccessResult) => {
                        if (res.data === null) {
                            console.error(object.children[m].uuid + window.$t("other['Query failed']"));
                            window.$message?.error(object.children[m].uuid + window.$t("other['Query failed']"));
                            return;
                        }

                        //解压数据
                        let model: THREE.Object3D = unzip(res.data.model);
                        //console.log("解压model:", model)
                        object.children[m] = model;

                        //判断是否存在子级
                        if (model.children) traverseSceneModel(model);

                        getModelsLength++;
                        notice.content = `${window.$t("scene['Getting models']")} ${getModelsLength + 1}/${sceneJson.modelTotal}`;

                        if (getModelsLength === sceneJson.modelTotal) {
                            notice.content = window.$t("scene['Parsing to editor']");
                            delete sceneJson.modelTotal; //删除自己添加的场景模型数量属性
                            /*加载到场景中*/
                            fromJSON(sceneJson);
                        }
                    })
                }
            }

            //解析sceneJson
            async function fromJSON(sceneJson) {
                //先清空场景
                window.editor.clear();

                //重新设置场景信息
                window.editor.config.setKey('project/title', sceneInfo.sceneName);
                window.editor.config.setKey('project/sceneID', sceneInfo.sceneId);
                window.editor.config.setKey('project/introduction', sceneInfo.sceneIntroduction);
                window.editor.config.setKey('project/version', sceneInfo.sceneVersion);

                const loader = new THREE.ObjectLoader();
                const camera = await loader.parseAsync(sceneJson.camera);

                delete sceneJson.camera;

                window.editor.camera.copy(camera);
                useDispatchSignal("cameraReseted")

                notice.destroy();
                window.$message?.success(window.$t("scene['Loading completed!']"));

                window.editor.setScene(await loader.parseAsync(sceneJson));
            }
        }

        //删除场景
        const deleteScene = (sceneId) => {
            window.$dialog.warning({
                title: window.$t('other.warning'),
                content: window.$t("prompt['Are you sure to delete the scene?']"),
                positiveText: window.$t('other.ok'),
                negativeText: window.$t('other.cancel'),
                onPositiveClick: () => {
                    sceneTableLoading.value = true;
                    fetchDeleteScenes({sceneId}).then(() => {
                        sceneTableLoading.value = false;
                        data.value.forEach((item: any, index) => {
                            if (item.sceneId === sceneId) data.value.splice(index, 1);
                        })
                    });
                },
            });
        }
    }

    //更新工程至服务器
    updateProjectToServer() {
        if (demoEnv) {
            window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
            return;
        }
    }
}
