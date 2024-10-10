import type { Component } from 'vue'
import { defineStore } from 'pinia';
import { store } from '@/store';
import { Home,Rotate,CutOut,RulerAlt,Ruler,Angle,AreaCustom,Pedestrian,Map,Settings,Clean } from '@vicons/carbon';
import {ContractOutline, ExpandOutline} from "@vicons/ionicons5";
import {t} from "@/language";

export interface IPreviewOperation {
    name: string,
    active?: boolean,
    disabled?: boolean,
    loading?: boolean,
    show?: boolean,
    icon: Component,
    children?: { [key: string]: IPreviewOperation }
}

interface IPreviewOperationState {
    menuList: { [key: string]: IPreviewOperation }
}

export const usePreviewOperationStore = defineStore('previewOperation', {
  state: () => <IPreviewOperationState>({
    menuList: {
        toHome : {name: t("preview.Main view"),active:false,disabled:false,show:true,icon:Home},
        autoRotate : {name: t("preview.Auto rotation"),active:false,disabled:false,show:true,icon:Rotate},
        cutting : {name: t("preview.Cutting"),active:false,disabled:false,show:true,icon:CutOut},
        measure :{name: t("preview.Measure"),active:false,disabled:false,show:true,icon:RulerAlt,children: {
                distance: {name: t("preview.Distance"), active: false, show:true,icon: Ruler},
                angle: {name: t("preview.Angle"), active: false, show:true,icon: Angle},
                area: {name: t("preview.Area"), active: false, show:true,icon: AreaCustom},
                clearMeasure: {name: t("preview.Clear measuring result"), active: false,disabled:true, show:true,icon: Clean}
            }
        },
        roaming : {name: t("preview.Roaming"),active:false,disabled:false,loading:true,show:true,icon:Pedestrian},
        miniMap : {name: t("preview.Mini map"),active:false,disabled:false,show:true,icon:Map},
        settings : {name: t("preview.Settings"),active:false,disabled:false,show:true,icon:Settings},
        fullscreen : {name: t("layout.header.Fullscreen"),active:false,disabled:false,show:true,icon:ExpandOutline},
        exitFullscreen : {name: t("layout.header.Exit fullscreen"),active:false,disabled:false,show:false,icon:ContractOutline},
    }
  }),
  getters: {

  },
  actions: {
  },
});

export function usePreviewOperationStoreWithOut() {
    return usePreviewOperationStore(store);
}