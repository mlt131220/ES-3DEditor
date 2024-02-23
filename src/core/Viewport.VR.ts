import * as THREE from 'three';
import { useSignal } from '@/hooks/useSignal';
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/examples/jsm/interactive/InteractiveGroup.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const {add:addSignal,dispatch} = useSignal();

class VR {
	public currentSession;

	constructor() {
		let group:any = null;
		let camera = null;
		let renderer:any = null;

		const intersectables:any = [];

		this.currentSession = null;

		const onSessionStarted = async ( session ) => {
			const sidebar:any = document.getElementById('sidebar');
			sidebar.style.width = '300px';
			sidebar.style.height = '700px';

			if ( group === null ) {
				//@ts-ignore
				group = new InteractiveGroup( renderer );
				window.editor.sceneHelpers.add( group );

				const mesh = new HTMLMesh( sidebar );
				mesh.position.set( 1, 1.5, - 0.5 );
				mesh.rotation.y = - 0.5;
				mesh.scale.setScalar( 2 );
				group.add( mesh );

				intersectables.push( mesh );

				// controllers
				const geometry = new THREE.BufferGeometry();
				geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );

				const controller1 = renderer.xr.getController( 0 );
				controller1.add( new THREE.Line( geometry ) );
				group.add( controller1 );

				const controller2 = renderer.xr.getController( 1 );
				controller2.add( new THREE.Line( geometry ) );
				group.add( controller2 );

				//
				const controllerModelFactory = new XRControllerModelFactory();

				const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
				controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
				group.add( controllerGrip1 );

				const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
				controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
				group.add( controllerGrip2 );

			}

			camera = window.editor.camera.clone();

			group.visible = true;

			this.currentSession = session;
			this.currentSession.addEventListener( 'end', onSessionEnded );

			await renderer.xr.setSession( this.currentSession );

		};

		const onSessionEnded = async () => {

			const sidebar:any = document.getElementById( 'sidebar' );
			sidebar.style.width = '';
			sidebar.style.height = '';

			//

			window.editor.camera.copy( camera );

			group.visible = false;

			this.currentSession.removeEventListener( 'end', onSessionEnded );
			this.currentSession = null;

			await renderer.xr.setSession( null );

			dispatch("exitedVR");

		};

		// signals
		addSignal("toggleVR",() => {
			if ( this.currentSession === null ) {
				const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };
				// @ts-ignore
				navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );
			} else {
				this.currentSession.end();
			}
		});

		addSignal("rendererCreated",(value) => {
			renderer = value;
			renderer.xr.enabled = true;
		});
	}
}

export { VR };
