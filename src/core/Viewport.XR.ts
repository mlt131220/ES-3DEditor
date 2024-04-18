import * as THREE from 'three';
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/examples/jsm/interactive/InteractiveGroup.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { useAddSignal,useDispatchSignal } from '@/hooks/useSignal';

import type {TransformControls} from "three/examples/jsm/controls/TransformControls";

class XR {
	constructor(controls:TransformControls) {
		const selector = window.editor.selector;

		let controllers:THREE.Group;
		let group:InteractiveGroup;
		let renderer:THREE.WebGLRenderer;

		const camera = new THREE.PerspectiveCamera();

		const onSessionStarted = async (session) => {
			camera.copy(window.editor.camera);

			const sidebar = document.getElementById('sidebar-attributes') as HTMLDivElement;
			sidebar.style.width = '350px';
			sidebar.style.height = '700px';

			if ( controllers === null ) {
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute('position', new THREE.Float32BufferAttribute([ 0, 0, 0, 0, 0, -5], 3));

				const line = new THREE.Line(geometry);

				const raycaster = new THREE.Raycaster();

				function onSelect(event) {
					const controller = event.target;

					controller1.userData.active = false;
					controller2.userData.active = false;

					if (controller === controller1) {
						controller1.userData.active = true;
						controller1.add(line);
					}

					if (controller === controller2) {
						controller2.userData.active = true;
						controller2.add(line);
					}

					raycaster.setFromXRController(controller);

					const intersects = selector.getIntersects(raycaster);

					if (intersects.length > 0) {
						// 忽略菜单点击
						const intersect = intersects[ 0 ];
						if (intersect.object === group.children[0]) return;
					}

					// 射线交叉对象，触发模型选择
					useDispatchSignal("intersectionsDetected",intersects);
				}

				function onControllerEvent(event) {
					const controller = event.target;

					if (controller.userData.active === false) return;

					controls.getRaycaster().setFromXRController(controller);

					switch (event.type) {
						case 'selectstart':
							controls.pointerDown( null );
							break;
						case 'selectend':
							controls.pointerUp( null );
							break;
						case 'move':
							controls.pointerHover( null );
							controls.pointerMove( null );
							break;
					}
				}

				controllers = new THREE.Group();

				const controller1 = renderer.xr.getController(0);
				controller1.addEventListener('select', onSelect);
				controller1.addEventListener('selectstart', onControllerEvent);
				controller1.addEventListener('selectend', onControllerEvent);
				controller1.addEventListener('move', onControllerEvent);
				controller1.userData.active = false;
				controllers.add(controller1);

				const controller2 = renderer.xr.getController(1);
				controller2.addEventListener('select', onSelect);
				controller2.addEventListener('selectstart', onControllerEvent);
				controller2.addEventListener('selectend', onControllerEvent);
				controller2.addEventListener('move', onControllerEvent);
				controller2.userData.active = true;
				controllers.add( controller2 );

				const controllerModelFactory = new XRControllerModelFactory();

				const controllerGrip1 = renderer.xr.getControllerGrip(0);
				controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
				controllers.add(controllerGrip1);

				const controllerGrip2 = renderer.xr.getControllerGrip(1);
				controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
				controllers.add(controllerGrip2);

				// menu
				group = new InteractiveGroup();

				const mesh = new HTMLMesh(sidebar);
				mesh.name = 'picker';
				mesh.position.set(0.5, 1.0, -0.5);
				mesh.rotation.y = -0.5;
				group.add(mesh);

				group.listenToXRControllerEvents(controller1);
				group.listenToXRControllerEvents(controller2);
			}

			window.editor.sceneHelpers.add(group);
			window.editor.sceneHelpers.add(controllers);

			renderer.xr.enabled = true;
			renderer.xr.addEventListener('sessionend', onSessionEnded);

			await renderer.xr.setSession(session);

		};

		const onSessionEnded = async () => {
			window.editor.sceneHelpers.remove( group );
			window.editor.sceneHelpers.remove( controllers );

			const sidebar = document.getElementById('sidebar-attributes') as HTMLDivElement
			sidebar.style.width = '';
			sidebar.style.height = '';

			renderer.xr.removeEventListener('sessionend', onSessionEnded);
			renderer.xr.enabled = false;

			window.editor.camera.copy(camera);

			useDispatchSignal("sceneResize");
			useDispatchSignal("leaveXR");
		};

		// signals
		const sessionInit = { optionalFeatures: ['local-floor'] };
		useAddSignal("enterXR",(mode:XRSessionMode) => {
			if ('xr' in navigator) {
				navigator.xr?.requestSession(mode, sessionInit).then(onSessionStarted);
			}
		});
		useAddSignal("offerXR",(mode:XRSessionMode) => {
			if ('xr' in navigator) {
				// @ts-ignore
				navigator.xr?.offerSession(mode, sessionInit).then(onSessionStarted);

				useAddSignal("leaveXR",() => {
					// @ts-ignore
					navigator.xr?.offerSession(mode, sessionInit).then(onSessionStarted);
				})
			}
		});
		useAddSignal("rendererCreated",(value) => {
			renderer = value;
		})
	}
}

export { XR };
