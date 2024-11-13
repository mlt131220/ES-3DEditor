/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/10/26 18:27
 * @description 后处理
 */
import * as THREE from "three";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {Pass} from "three/examples/jsm/postprocessing/Pass";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import {GammaCorrectionShader} from "three/examples/jsm/shaders/GammaCorrectionShader";
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass.js';
// import {OutputPass} from "three/examples/jsm/postprocessing/OutputPass.js";

import {Viewport} from "@/core/Viewport";
import {useAddSignal} from "@/hooks/useSignal";

let _passConfigChangeFn:any = null;
export class ViewportEffect{
    private viewport:Viewport;

    composer: EffectComposer | undefined;
    outlinePass: OutlinePass | undefined;

    // 其他可动态配置的通道
    static PassMap = new Map<string,Pass>();

    constructor(viewport:Viewport) {
        this.viewport = viewport;

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
        this.composer = composer as EffectComposer;
        this.outlinePass = outlinePass;

        // 加入默认打开的通道
        const effectConfig = window.editor.config.getKey('effect');
        if(effectConfig){
            Object.keys(effectConfig).forEach(key => {
                if(key === "enabled" || key === "Outline") return;

                // 判断是否存在 enabled 属性
                if(effectConfig[key].hasOwnProperty('enabled') && effectConfig[key].enabled === true){
                    if(!this[key] || !(this[key] instanceof Pass)) return;

                    this.composer?.addPass(this[key]);
                }
            })
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

        const outlineConfig = window.editor.config.getEffectItem('Outline');
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
     * FXAA 抗锯齿通道
     */
    get FXAA(){
        if(ViewportEffect.PassMap.has("FXAA")) {
            return ViewportEffect.PassMap.get("FXAA");
        }

        if(!this.viewport.renderer) return null;

        const options = window.editor.config.getEffectItem("FXAA");

        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.clear = true;
        const pixelRatio = this.viewport.renderer.getPixelRatio();
        fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / (this.viewport.container.offsetWidth * pixelRatio);
        fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / (this.viewport.container.offsetHeight * pixelRatio);
        fxaaPass.enabled = options.enabled || false;

        ViewportEffect.PassMap.set("FXAA",fxaaPass);

        return fxaaPass;
    }

    /**
     * UnrealBloom 仿UE辉光
     */
    get UnrealBloom(){
        if(ViewportEffect.PassMap.has("UnrealBloom")) {
            return ViewportEffect.PassMap.get("UnrealBloom");
        }

        const options = window.editor.config.getEffectItem("UnrealBloom");

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(this.viewport.container.offsetWidth, this.viewport.container.offsetWidth), 1, 0, 0);
        bloomPass.threshold = options.threshold || 0;
        bloomPass.strength = options.strength === undefined ? 1 : options.strength;
        bloomPass.radius = options.radius || 0;

        ViewportEffect.PassMap.set("UnrealBloom",bloomPass);

        return bloomPass;
    }

    /**
     * Bokeh 变焦,背景虚化（焦外成像）
     */
    get Bokeh(){
        if(ViewportEffect.PassMap.has("Bokeh")) {
            return ViewportEffect.PassMap.get("Bokeh");
        }

        const options = window.editor.config.getEffectItem("Bokeh");

        const bokehPass = new BokehPass(this.viewport.scene, window.editor.viewportCamera, {
            focus: options.focus,
            aperture: options.aperture,
            maxblur: options.maxblur
        });

        ViewportEffect.PassMap.set("Bokeh",bokehPass);

        return bokehPass;
    }

    /**
     * Pixelate 像素风
     * TODO: 暂未启用，渲染错误
     */
    get Pixelate(){
        if(ViewportEffect.PassMap.has("Pixelate")) {
            return ViewportEffect.PassMap.get("Pixelate");
        }

        const options = window.editor.config.getEffectItem("Pixelate");

        const pixelatedPass = new RenderPixelatedPass(options.pixelSize || 6, this.viewport.scene, window.editor.viewportCamera,{
            normalEdgeStrength: options.normalEdgeStrength,
            depthEdgeStrength: options.depthEdgeStrength
        });

        ViewportEffect.PassMap.set("Pixelate",pixelatedPass);

        return pixelatedPass;
    }

    /**
     * Halftone 半色调
     */
    get Halftone(){
        if(ViewportEffect.PassMap.has("Halftone")) {
            return ViewportEffect.PassMap.get("Halftone");
        }

        const options = window.editor.config.getEffectItem("Halftone");

        const halftonePass = new HalftonePass(this.viewport.container.offsetWidth, this.viewport.container.offsetWidth, options);

        ViewportEffect.PassMap.set("Halftone",halftonePass);

        return halftonePass;
    }

    /**
     * 通道配置变更
     * @param name 通道名
     * @param config 新配置
     */
    handlePassConfigChange(name:string,config){
        // 参数配置在uniforms的Pass
        const uniformsConfigPass:string[] = ["Bokeh","Halftone"];

        if(name === "Outline"){
            for (const key in config) {
                (<OutlinePass>this.outlinePass)[key] = this.getPassConfigValue(key,config[key]);
            }
        } else {
            if(!config.enabled) {
                if(ViewportEffect.PassMap.has(name)){
                    this.composer?.removePass(ViewportEffect.PassMap.get(name) as Pass)
                    ViewportEffect.PassMap.delete(name);
                }

                this.viewport.render();
                return;
            }

            if(!ViewportEffect.PassMap.has(name)){
                if(!this[name] || !(this[name] instanceof Pass)) return;

                // get this[name]时创建的Pass会自动加入到ViewportEffect.PassMap
                this.composer?.addPass(this[name]);

                this.viewport.render();
            }

            if(uniformsConfigPass.includes(name)){
                for (const key in config) {
                    if(this[name].uniforms[key] === undefined) continue;

                    this[name].uniforms[key].value = this.getPassConfigValue(key,config[key]);
                }
            }else{
                for (const key in config) {
                    this[name][key] = this.getPassConfigValue(key,config[key]);
                }
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

        if(["rotateR","rotateG","rotateB"].includes(key)){
            return value * (Math.PI / 180);
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