/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @description 场景存储为zip包
 */
import {h, reactive, ref, toRaw, unref} from "vue";
import {useDispatchSignal} from "@/hooks/useSignal";
import {Service} from "../../../types/network";
import {NotificationReactive, NDataTable, NTag, NButton, NPagination, NIcon} from 'naive-ui';
import {CheckmarkCircleSharp,CloseCircleSharp} from "@vicons/ionicons5";
import {zip} from "@/utils/common/pako";
import {EsLoader} from "@/utils/esloader/EsLoader";
import {
    fetchGetAllScenes,
    fetchSaveScene,
    fetchDeleteScenes
} from "@/http/api/scenesZip";
import {fetchUpload} from "@/http/api/sys";
import {useDrawingStoreWithOut} from "@/store/modules/drawing";
import {filterSize} from "@/utils/common/file";
import {useSceneInfoStoreWithOut} from "@/store/modules/sceneInfo";
import {demoEnv} from "@/utils/common/constant";

const drawingStore = useDrawingStoreWithOut();
const sceneInfoStore = useSceneInfoStoreWithOut();

let notification: NotificationReactive;

export class MenubarNetwork {
    constructor() {
    }

    // 调用对应方法
    init(key: string) {
        this[key]();
    }

    // 保存为新工程
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
                useDispatchSignal("changeViewportLoadingText", window.$t("scene['Generate scene data, please wait']"));
                useDispatchSignal("switchViewportLoading", true);

                setTimeout(() => {
                    // 数据分解保存
                    let editorJson = window.editor.toJSON();
                    // 保存项目信息
                    editorJson.sceneInfo = {
                        sceneType: sceneInfoStore.getType,
                        sceneName: sceneInfoStore.getName,
                        sceneIntroduction: sceneInfoStore.getIntroduction,
                        sceneVersion: sceneInfoStore.getVersion,
                        isCesium: sceneInfoStore.getIsCesium ? 1 : 0,
                        hasDrawing: drawingStore.getIsUploaded ? 1 : 0,
                    }
                    // 图纸信息
                    if (drawingStore.getIsUploaded) {
                        editorJson.drawingInfo = {
                            imgSrc: drawingStore.getImgSrc,
                            markList: zip(drawingStore.getMarkList),
                            imgInfo: JSON.stringify(drawingStore.getImgInfo)
                        };
                    }

                    useDispatchSignal("changeViewportLoadingText", window.$t("scene['Scene is being compressed...']"));

                    const esLoader = new EsLoader();
                    esLoader.pack(editorJson, (zip) => {
                        //遍历完场景数据则隐藏遮罩，显示等待框
                        useDispatchSignal("switchViewportLoading", false);

                        notification = window.$notification.info({
                            title: `${window.$t("scene['In storage']")}...`,
                            content: `${window.$t("scene['Scene information is being saved']")},${window.$t("other.Loading")}...`,
                            closable: false,
                        })

                        // 调用接口上传保存场景
                        const zipFile = new File([zip], `${editorJson.sceneInfo.sceneName}-${editorJson.sceneInfo.sceneVersion}.zip`, {type: "application/zip"});

                        fetchUpload({
                            file: zipFile,
                            biz: "editor3d/scene",
                        }).then(r => {
                            if (r.data !== null) {
                                const params = Object.assign({
                                    zip: r.data,
                                    zipSize: filterSize(zipFile.size)
                                }, editorJson.sceneInfo)
                                fetchSaveScene(params).then((res: Service.SuccessResult<ISceneInfo>) => {
                                    notification.content = `工程已保存`;
                                    // TODO 检查保存的id是否正确
                                    console.log("TODO 检查保存的id是否正确", res)
                                    sceneInfoStore.setId(res.data.id);
                                    setTimeout(() => {
                                        notification.destroy();
                                    }, 500)
                                })
                            } else {
                                window.$message?.error(window.$t("scene['Failed to save project!']"));
                            }
                        })
                    });
                }, 16)
            }
        });
    }

    //从服务器获取工程
    async getProjectForServer() {
        const data = ref([]);
        const sceneTableLoading = ref(false);
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

            data.value = res.data.items || [];
            paginationReactive.pageCount = res.data.pages;
            sceneTableLoading.value = false;
        }

        await fetchData();

        let dialog;
        dialog = window.$dialog.info({
            title: window.$t("scene['All Projects']"),
            content: () => h(
                "div",
                {style: "margin-top:20px;"},
                [
                    h(NDataTable, {
                        columns: [
                            {
                                title: window.$t("scene['Scene type']"),
                                key: 'isCesium',
                                render(row) {
                                    return h(
                                        NTag,
                                        {
                                            type: row.isCesium ? 'warning' : 'success',
                                            bordered: false
                                        },
                                        {
                                            default: () => row.isCesium ? "Cesium" : "Three"
                                        }
                                    )
                                }
                            },
                            {
                                title: window.$t("scene['Scene name']"),
                                key: 'sceneName'
                            },
                            {
                                title: window.$t("scene['Scene introduction']"),
                                key: 'sceneIntroduction'
                            },
                            {
                                title: window.$t("scene['Scene classification']"),
                                align:"center",
                                key: 'sceneType'
                            },
                            {
                                title: window.$t("scene['Include drawings']"),
                                key: 'hasDrawing',
                                align:"center",
                                render(row) {
                                    return h(
                                        NIcon,
                                        {
                                            size: 22,
                                            color: row.hasDrawing ? '#67C23A' : '#F56C6C'
                                        },
                                        [row.hasDrawing ? h(CheckmarkCircleSharp) : h(CloseCircleSharp)]
                                    )
                                }
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
                                title: window.$t("scene['Scene data volume']"),
                                key: 'zipSize',
                            },
                            {
                                title: window.$t('other.Action'),
                                key: 'actions',
                                width: 140,
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
                                                    onClick: () => deleteScene(row.id)
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
                width: "48vw"
            }
        })

        //拉取场景
        const getScene = (sceneInfo) => {
            let notice;

            dialog.destroy();
            notice = window.$notification.info({
                title: window.$t("scene['Get the scene data']") + "...",
                content: window.$t("other.Loading") + "...",
                closable: false,
            })

            fetch(sceneInfo.zip).then(r => r.blob()).then(r => {
                if(r.size !== 0){
                    // 解压zip包
                    const esLoader = new EsLoader();
                    esLoader.unpack(r as Blob).then((editorJson) => {
                        notice.content = window.$t("scene['Parsing to editor']");
                        /*加载到场景中*/
                        window.editor.fromJSON(editorJson).then(() => {
                            sceneInfoStore.setSceneInfo(sceneInfo);
                            notice.destroy();
                        });
                    });
                }
            })
            return;
        }

        //删除场景
        const deleteScene = (id) => {
            window.$dialog.warning({
                title: window.$t('other.warning'),
                content: window.$t("prompt['Are you sure to delete the scene?']"),
                positiveText: window.$t('other.ok'),
                negativeText: window.$t('other.cancel'),
                onPositiveClick: () => {
                    sceneTableLoading.value = true;
                    fetchDeleteScenes(id).then(() => {
                        sceneTableLoading.value = false;
                        data.value.forEach((item: any, index) => {
                            if (item.id === id) data.value.splice(index, 1);
                        })
                    });
                },
            });
        }
    }

    //更新工程至服务器
    async updateProjectToServer() {
        if (demoEnv) {
            window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
            return;
        }

        // 检查对应sceneId的工程是否存在
        if (!window.editor.config.getKey('project/sceneID')) {
            window.$message?.error(window.$t("prompt['Please save the project first!']"));
            return;
        }
    }
}
