/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/10/26 18:27
 * @description 后处理
 */
import * as THREE from "three";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {SSAARenderPass} from "three/examples/jsm/postprocessing/SSAARenderPass";
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import {GammaCorrectionShader} from "three/examples/jsm/shaders/GammaCorrectionShader";
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import {Viewport} from "@/core/Viewport";
import {useAddSignal} from "@/hooks/useSignal";

let _passConfigChangeFn:any = null;
export class ViewportEffect{
    private viewport:Viewport;

    composer: EffectComposer | undefined;
    outlinePass: OutlinePass | undefined;
    // 其他可动态配置的通道
    pass:{
        fxaa:ShaderPass | null
    }

    constructor(viewport:Viewport) {
        this.viewport = viewport;

        this.pass = {
            fxaa: null
        }

        _passConfigChangeFn = this.handlePassConfigChange.bind(this);
        useAddSignal("effectPassConfigChange",_passConfigChangeFn)
    }

    get enabled(){
        // if(!this.composer && window.editor.config.getEffectItem('enabled')){
        //     this.createComposer();
        // }

        return window.editor.config.getEffectItem('enabled');
    }

    createComposer(){
        const {composer, outlinePass} = this.initComposer();
        this.composer = composer;
        this.outlinePass = outlinePass;

        this.pass = {
            fxaa: this.createFXAAPass(),
        }
    }

    protected initComposer(){
        if(!this.viewport.renderer) return {};

        const pixelRatio = this.viewport.renderer.getPixelRatio();

        // 创建后处理对象EffectComposer，WebGL渲染器作为参数
        let composer = new EffectComposer(this.viewport.renderer);
        composer.setPixelRatio(pixelRatio);
        composer.setSize(this.viewport.container.offsetWidth, this.viewport.container.offsetHeight);

        // let ssaaRenderPass = new SSAARenderPass(this.viewport.scene, this.viewport.camera);
        // ssaaRenderPass.unbiased = false;
        // ssaaRenderPass.sampleLevel = 2;
        // ssaaRenderPass.clearColor = new THREE.Color("#272727");
        // ssaaRenderPass.clearAlpha = 0;
        // composer.addPass(ssaaRenderPass);

        const renderPass = new RenderPass(this.viewport.scene, this.viewport.camera);
        renderPass.clearColor = new THREE.Color("#272727");
        renderPass.clearAlpha = 0;
        renderPass.clearDepth = true;
        composer.addPass(renderPass);

        const outlineConfig = window.editor.config.getEffectItem('outline');
        const outlinePass = new OutlinePass(new THREE.Vector2(this.viewport.container.offsetWidth, this.viewport.container.offsetHeight), this.viewport.scene, this.viewport.camera)
        outlinePass.visibleEdgeColor = new THREE.Color(outlineConfig.visibleEdgeColor || "#ffee00");
        outlinePass.hiddenEdgeColor = new THREE.Color(outlineConfig.hiddenEdgeColor || "#ff6a00");
        outlinePass.edgeStrength = outlineConfig.edgeStrength || Number(3.0);
        outlinePass.edgeGlow = outlineConfig.edgeGlow || Number(0.2);
        outlinePass.edgeThickness = outlineConfig.edgeThickness || Number(1.0);
        outlinePass.pulsePeriod = outlineConfig.pulsePeriod || Number(0.0);
        outlinePass.usePatternTexture = outlineConfig.usePatternTexture || false;
        outlinePass.selectedObjects = [];
        composer.addPass(outlinePass);

        // 创建伽马校正通道. 解决gltf模型后处理时，颜色偏差的问题
        const gammaPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(gammaPass);

        // const outputPass = new OutputPass();
        // composer.addPass(outputPass);

        return {composer, outlinePass};
    }

    /**
     * 创建FXAA抗锯齿通道
     */
    createFXAAPass(){
        if(!this.composer || !this.viewport.renderer) return null;

        if(this.pass.fxaa) {
            this.pass.fxaa = null;
        }

        const options = window.editor.config.getEffectItem('fxaa');

        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.clear = true;
        const pixelRatio = this.viewport.renderer.getPixelRatio();
        fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / (this.viewport.container.offsetWidth * pixelRatio);
        fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / (this.viewport.container.offsetHeight * pixelRatio);

        fxaaPass.enabled = options.enabled || false;

        this.composer.addPass(fxaaPass);

        return fxaaPass;
    }

    /**
     * 通道配置变更
     * @param name 通道名
     * @param config 新配置
     */
    handlePassConfigChange(name:string,config){
        if(name === "outline"){
            for (const key in config) {
                (<OutlinePass>this.outlinePass)[key] = this.getPassConfigValue(key,config[key]);
            }
        }else{
            for (const key in config) {
                this.pass[name][key] = this.getPassConfigValue(key,config[key]);
            }
        }

        this.viewport.render();
    }

    /**
     * 处理通道值
     */
    getPassConfigValue(key:string,value:any){
        if(["visibleEdgeColor","hiddenEdgeColor"].includes(key)){
            return new THREE.Color(value);
        }

        return value;
    }

    render(deltaTime:number){
        if(!this.enabled || !this.composer) return;

        this.composer.render(deltaTime);
    }

    dispose(){
        _passConfigChangeFn = null;
    }
}