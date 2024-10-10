/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/8/29 22:10
 * @description 漫游的人物动画状态机
 */
import * as THREE from "three";

export class RoamingStatus{
    // 键盘按下状态
    keyDownStatus = {
        w:false,
        s:false,
        a:false,
        d:false,
        shift:false,
        space:false
    }

    fadeTime = 0.2;

    person: THREE.Group; // 人物
    mixer: THREE.AnimationMixer; // 动画混合器
    private clipAction: { [s: string]: THREE.AnimationAction } = {}; // 动画 action

    constructor(person:THREE.Group,clips:THREE.AnimationClip[]) {
        this.person = person;
        this.mixer = new THREE.AnimationMixer(this.person);
        clips.forEach(clip => {
            this.clipAction[clip.name] = (this.mixer as THREE.AnimationMixer).clipAction(clip);
        })

        this.mixer.addEventListener('loop', (e) => {
            // @ts-ignore
            switch(e.action._clip.name){
                case "Enter":
                    this.fadeIn("Idle");
                    setTimeout(() => {
                        this.clipAction.Enter.stop();
                    },200)
                    break;
                case "Jumping":
                    this.setStatus("space",false);
                    break;
            }
        });
    }

    init(){
        this.clipAction.Idle.play();
    }

    // 是否正在向前走
    get isWalkingForward(){
        return this.keyDownStatus.w || this.keyDownStatus.a || this.keyDownStatus.d;
    }

    setStatus(key:string,value: boolean){
        this.keyDownStatus[key] = value;

        switch (key){
            case "w":
            case "a":
            case "d":
                // 前进动画处理
                if(!this.keyDownStatus.w && !this.keyDownStatus.a && !this.keyDownStatus.d){
                    this.fadeOut("Walking");

                    if(this.clipAction.Running.isRunning()){
                        this.keyDownStatus.shift = false;
                        this.fadeOut("Running")
                    }
                }else{
                    if(!this.clipAction.Walking.isRunning()){
                        this.fadeIn("Walking");
                    }
                }
                break;
            case "s":
                // 后退处理
                if(value){
                    this.fadeIn("WalkingBackward");
                }else{
                    this.fadeOut("WalkingBackward")
                }
                break;
            case "space":
                // 跳跃处理
                if(value){
                    this.fadeIn("Jumping");

                    if(this.clipAction.Walking.isRunning()){
                        this.fadeOut("Walking")
                    }
                    if(this.clipAction.Running.isRunning()){
                        this.fadeOut("Running")
                    }
                }else{
                    if(this.keyDownStatus.shift){
                        if(!this.clipAction.Running.isRunning()){
                            this.fadeIn("Running")
                        }
                    }else if(this.isWalkingForward){
                        if(!this.clipAction.Walking.isRunning()){
                            this.fadeIn("Walking")
                        }
                    }

                    this.fadeOut("Jumping")
                }
                break;
            case "shift":
                if(value){
                    this.fadeIn("Running");

                    this.fadeOut("Walking")
                }else{
                    if(this.isWalkingForward){
                        if(!this.clipAction.Walking.isRunning()){
                            this.fadeIn("Walking");
                            this.fadeOut("Running");
                        }
                    }
                }
                break;
        }

        if(!Object.values(this.keyDownStatus).includes(true)){
            if(!this.clipAction.Idle.isRunning()){
                this.fadeIn("Idle");
            }
        }else{
            if(this.clipAction.Idle.isRunning()){
                this.fadeOut("Idle");
            }
        }
    }

    fadeIn(name: string) {
        // if(!this.clipAction[name].isScheduled()){
        //     this.clipAction[name].reset();
        //     this.clipAction[name].play();
        // }
        //
        // this.clipAction[name].fadeIn(this.fadeTime);

        this.clipAction[name].play();
    }

    fadeOut(name:string){
        // this.clipAction[name].fadeOut(this.fadeTime)
        // setTimeout(() => {
        //     this.clipAction[name].stop();
        // },this.fadeTime * 100)

        this.clipAction[name].stop();
    }

    stopAllAction(){
        // 停用混合器上所有预定的动作
        this.mixer.stopAllAction();
    }


    update(delta:number){
        this.mixer.update(delta);

        // THREE.AnimationMixer loop事件不一定有用，此处添加一个检测
        if(!this.clipAction.Jumping.isRunning() && this.keyDownStatus.space){
            //console.log("THREE.AnimationMixer loop事件未生效，手动设置")
            this.keyDownStatus.space = false;
        }
    }

    dispose(){
        this.stopAllAction();
    }
}