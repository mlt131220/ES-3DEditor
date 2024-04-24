import * as THREE from 'three';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import {VRButton} from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Helper from "@/core/script/Helper";

let sceneResizeFn,onKeyDownFn,onKeyUpFn,onPointerDownFn,onPointerUpFn,onPointerMoveFn,animateFn;
const loader = new THREE.ObjectLoader();
let events = {
	init: [],
	start: [],
	stop: [],
	beforeUpdate: [],
	update: [],
	afterUpdate: [],
	beforeDestroy:[],
	destroy: [],
	onKeydown: [],
	onKeyup: [],
	onPointerdown: [],
	onPointerup: [],
	onPointermove: [],
};

export class Player{
	private readonly renderer: THREE.WebGLRenderer;
	private camera: THREE.PerspectiveCamera | undefined;
	private scene: THREE.Scene | undefined;
	controls:OrbitControls | undefined;
	clock:THREE.Clock = new THREE.Clock();
	dom:HTMLDivElement;
	private width: number;
	private height: number;
	private readonly vrButton: HTMLElement;

	// animations
	prevActionsInUse = 0;

	constructor() {
		this.renderer = this.initRender();

		this.dom = document.getElementById("player") as HTMLDivElement;
		// 设置 tabindex 使得 div 可以被 focus 到，才能响应键盘事件
		//this.dom.tabIndex = -1;
		this.dom.appendChild(this.renderer.domElement);

		this.vrButton = VRButton.createButton(this.renderer);

		this.width = 500;
		this.height = 500;

		window.addEventListener('resize', () => {
			this.setSize(this.dom.clientWidth, this.dom.clientHeight);
		});

		sceneResizeFn = this.sceneResize.bind(this);

		onKeyDownFn = this.onKeyDown.bind(this);
		onKeyUpFn = this.onKeyUp.bind(this);
		onPointerDownFn = this.onPointerDown.bind(this);
		onPointerUpFn = this.onPointerUp.bind(this);
		onPointerMoveFn = this.onPointerMove.bind(this);

		animateFn = this.animate.bind(this);
	}

	initRender(){
		const renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );

		return renderer;
	}

	setScene(value:THREE.Scene){
		this.scene = value;
	};

	setCamera(value:THREE.PerspectiveCamera) {
		this.camera = value;
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	};

	setSize(width:number, height:number) {
		this.width = width;
		this.height = height;

		if (this.camera) {
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}

		this.renderer.setSize( width, height );
	};

	setupPreview(){
		this.setSize(this.dom.clientWidth, this.dom.clientHeight);

		this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
		this.camera.position.set(4.6, 0, 10);
		this.camera.lookAt(new THREE.Vector3());
		this.scene = new THREE.Scene();

		this.loadDefaultEnvAndBackground();

		this.controls = new OrbitControls(this.camera as THREE.PerspectiveCamera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.03;

		this.renderer.setAnimationLoop(animateFn);
	}

	/**
	 * 加载环境和背景
	 * @param definition 分辨率
	 */
	loadDefaultEnvAndBackground(definition = 1) {
		window.editor.resource.loadURLTexture(`/upyun/assets/texture/hdr/kloofendal_48d_partly_cloudy_puresky_${definition}k.hdr`, (texture) => {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			if(this.scene){
				this.scene.environment = texture;
				this.scene.background = texture;
			}
		})
	}

	start(json){
		if(json === undefined) {
			window.$message?.error(window.$t("prompt['Parse failed']"));
			return;
		}
		this.load(json);
		this.setSize(this.dom.clientWidth, this.dom.clientHeight);
		this.play();

		useAddSignal("sceneResize",sceneResizeFn);
	}

	stop(){
		if (this.renderer.xr.enabled) this.vrButton.remove();

		window.removeEventListener( 'keydown', onKeyDownFn );
		window.removeEventListener( 'keyup', onKeyUpFn );
		this.dom.removeEventListener( 'pointerdown', onPointerDownFn );
		this.dom.removeEventListener( 'pointerup', onPointerUpFn );
		this.dom.removeEventListener( 'pointermove', onPointerMoveFn );

		this.dispatch(events.stop, arguments);

		this.renderer.setAnimationLoop(null);

		useRemoveSignal("sceneResize",sceneResizeFn);

		this.camera = undefined;
		this.scene = undefined;
		this.controls = undefined;
	}

	load(json) {
		const project = json.project;

		if ( project.vr !== undefined ) this.renderer.xr.enabled = project.vr;
		if ( project.shadows !== undefined ) this.renderer.shadowMap.enabled = project.shadows;
		if ( project.shadowType !== undefined ) this.renderer.shadowMap.type = project.shadowType;
		if ( project.toneMapping !== undefined ) this.renderer.toneMapping = project.toneMapping;
		if ( project.toneMappingExposure !== undefined ) this.renderer.toneMappingExposure = project.toneMappingExposure;

		this.setScene(loader.parse(json.scene) as THREE.Scene);
		this.setCamera(loader.parse(json.camera) as THREE.PerspectiveCamera);

		// 加入控制器
		this.controls = new OrbitControls(this.camera as THREE.PerspectiveCamera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.03;

		// 注册 Helper
		const helper = new Helper(this.scene as THREE.Scene);

		events = {
			init: [],
			start: [],
			stop: [],
			beforeUpdate: [],
			update: [],
			afterUpdate: [],
			beforeDestroy:[],
			destroy: [],
			onKeydown: [],
			onKeyup: [],
			onPointerdown: [],
			onPointerup: [],
			onPointermove: [],
		};

		let scriptWrapParams = 'helper,renderer,scene,camera,controls,clock';
		const scriptWrapResultObj = {};

		for (const eventKey in events) {
			scriptWrapParams += ',' + eventKey;
			scriptWrapResultObj[eventKey] = eventKey;
		}

		const scriptWrapResult = JSON.stringify(scriptWrapResultObj).replace(/"/g, '');

		for (const uuid in json.scripts) {
			const object = this.scene?.getObjectByProperty('uuid', uuid);

			if (object === undefined) {
				console.warn('Player: Script without object.', uuid);
				continue;
			}

			const scripts = json.scripts[uuid];

			for (let i = 0; i < scripts.length; i++) {
				const script = scripts[i];
				const functions = (new Function(scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';').bind(object))(helper,this.renderer, this.scene, this.camera,this.controls,this.clock);

				for (const name in functions) {
					if (functions[name] === undefined) continue;

					if (events[name] === undefined) {
						console.warn( 'Player: Event type not supported (', name, ')' );
						continue;
					}

					events[name].push(functions[name].bind(object));
				}
			}
		}

		this.dispatch(events.init, arguments);
	}

	dispatch(array: any[], event:any) {
		for (let i = 0, l = array.length; i < l; i ++) {
			array[i](event);
		}
	}

	play() {
		if (this.renderer.xr.enabled) this.dom.append(this.vrButton);

		window.addEventListener('keydown', onKeyDownFn);
		window.addEventListener('keyup', onKeyUpFn);
		this.dom.addEventListener('pointerdown', onPointerDownFn);
		this.dom.addEventListener('pointerup', onPointerUpFn);
		this.dom.addEventListener('pointermove', onPointerMoveFn);

		this.dispatch(events.start, arguments);

		this.renderer.setAnimationLoop(animateFn);
	}

	setPixelRatio(pixelRatio:number) {
		this.renderer.setPixelRatio(pixelRatio);
	};

	sceneResize(){
		this.setSize(this.dom.clientWidth, this.dom.clientHeight);
	}

	// 事件
	onKeyDown(event:Event){
		this.dispatch(events.onKeydown, event);
	}
	onKeyUp(event:Event) {
		this.dispatch(events.onKeyup, event);
	}
	onPointerDown(event:MouseEvent) {
		this.dispatch(events.onPointerdown, event);
	}
	onPointerUp(event:MouseEvent) {
		this.dispatch( events.onPointerup, event );
	}
	onPointerMove(event:MouseEvent) {
		this.dispatch( events.onPointermove, event );
	}

	animate() {
		this.dispatch( events.beforeUpdate,arguments );

		const delta = this.clock.getDelta();

		const mixer = Helper.mixer;
		if(mixer){
			// @ts-ignore Animations
			const actions = mixer.stats.actions;
			if (actions.inUse > 0 || this.prevActionsInUse > 0) {
				this.prevActionsInUse = actions.inUse;

				mixer.update(delta);
			}
		}

		try {
			this.dispatch( events.update, { time: this.clock.elapsedTime, delta: delta } );
		} catch (e: any) {
			console.error((e.message || e), (e.stack || ''));
		}

		this.controls?.update();

		this.renderer.render(this.scene as THREE.Scene, this.camera as THREE.Camera);

		this.dispatch( events.afterUpdate,arguments );
	}

	render(time:number) {
		this.dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );
		this.renderer.render(this.scene as THREE.Scene, this.camera as THREE.Camera);
	}

	dispose(){
		this.dispatch(events.beforeDestroy,arguments);

		this.renderer.dispose();

		this.camera = undefined;
		this.scene = undefined;
		this.controls = undefined;

		sceneResizeFn = undefined;

		onKeyDownFn = undefined;
		onKeyUpFn = undefined;
		onPointerDownFn = undefined;
		onPointerUpFn = undefined;
		onPointerMoveFn = undefined;

		animateFn = undefined;

		this.dispatch(events.destroy,arguments);
	}
}
