import * as THREE from 'three';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import {VRButton} from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let sceneResizeFn,onKeyDownFn,onKeyUpFn,onPointerDownFn,onPointerUpFn,onPointerMoveFn,animateFn;
const loader = new THREE.ObjectLoader();
let events = {
	init: [],
	start: [],
	stop: [],
	keydown: [],
	keyup: [],
	pointerdown: [],
	pointerup: [],
	pointermove: [],
	update: []
};
let time:number, startTime:number, prevTime: number;

export class Player{
	private readonly renderer: THREE.WebGLRenderer;
	private camera: THREE.PerspectiveCamera | undefined = undefined;
	private scene: THREE.Scene | undefined = undefined;
	controls:OrbitControls | undefined = undefined;
	dom:HTMLDivElement;
	private width: number;
	private height: number;
	private readonly vrButton: HTMLElement;

	constructor() {
		this.renderer = this.initRender();

		this.dom = document.getElementById("player") as HTMLDivElement;
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

	start(){
		this.load(window.editor.toJSON());
		this.setSize(this.dom.clientWidth, this.dom.clientHeight);
		this.play();

		useAddSignal("sceneResize",sceneResizeFn);
	}

	stop(){
		if (this.renderer.xr.enabled) this.vrButton.remove();

		this.dom.removeEventListener( 'keydown', onKeyDownFn );
		this.dom.removeEventListener( 'keyup', onKeyUpFn );
		this.dom.removeEventListener( 'pointerdown', onPointerDownFn );
		this.dom.removeEventListener( 'pointerup', onPointerUpFn );
		this.dom.removeEventListener( 'pointermove', onPointerMoveFn );

		this.dispatch( events.stop, arguments );

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
		// this.controls.target.set(0, 0, 0);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.03;

		events = {
			init: [],
			start: [],
			stop: [],
			keydown: [],
			keyup: [],
			pointerdown: [],
			pointerup: [],
			pointermove: [],
			update: []
		};

		let scriptWrapParams = 'player,renderer,scene,camera';
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
				const functions = (new Function(scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';').bind(object))(this, this.renderer, this.scene, this.camera);

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

		startTime = prevTime = performance.now();

		this.dom.addEventListener('keydown', onKeyDownFn);
		this.dom.addEventListener('keyup', onKeyUpFn);
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
		this.dispatch(events.keydown, event);
	}
	onKeyUp(event:Event) {
		this.dispatch(events.keyup, event);
	}
	onPointerDown(event:Event) {
		this.dispatch(events.pointerdown, event);
	}
	onPointerUp(event:Event) {
		this.dispatch( events.pointerup, event );
	}
	onPointerMove(event:Event) {
		this.dispatch( events.pointermove, event );
	}

	animate() {
		time = performance.now();

		try {
			this.dispatch( events.update, { time: time - startTime, delta: time - prevTime } );
		} catch (e: any) {
			console.error((e.message || e), (e.stack || ''));
		}

		this.controls?.update();

		this.renderer.render(this.scene as THREE.Scene, this.camera as THREE.Camera);

		prevTime = time;
	}

	render(time:number) {
		this.dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );
		this.renderer.render(this.scene as THREE.Scene, this.camera as THREE.Camera);
	}

	dispose(){
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
	}
}
