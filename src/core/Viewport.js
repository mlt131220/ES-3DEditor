import * as THREE from 'three';
import {useDispatchSignal, useAddSignal} from '@/hooks/useSignal';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ViewHelper as ViewHelperBase } from 'three/examples/jsm/helpers/ViewHelper.js';
import { VR } from './Viewport.VR';
import { EditorControls } from './EditorControls';

import { SetPositionCommand } from './commands/SetPositionCommand';
import { SetRotationCommand } from './commands/SetRotationCommand';
import { SetScaleCommand } from './commands/SetScaleCommand';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function Viewport(container) {
	let renderer = null;
	let pmremGenerator = null;

	let controls = null;

	const camera = window.editor.camera;
	const scene = window.editor.scene;
	const sceneHelpers = window.editor.sceneHelpers;
	let showSceneHelpers = true;

	// helpers
	const grid = new THREE.Group();
	const grid1 = new THREE.GridHelper( 1000, 1000, 0x888888 );
	grid1.material.color.setHex( 0x888888 );
	grid1.material.vertexColors = false;
	grid.add( grid1 );
	const grid2 = new THREE.GridHelper( 1000, 2, 0x222222 );
	grid2.material.color.setHex( 0x222222 );
	grid2.material.depthFunc = THREE.AlwaysDepth;
	grid2.material.vertexColors = false;
	grid.add( grid2 );

	const viewHelper = new ViewHelperBase( camera, container );
	const vr = new VR();

	//选中时的包围框
	const box = new THREE.Box3();
	const selectionBox = new THREE.Box3Helper( box );
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	let objectPositionOnDown = null;
	let objectRotationOnDown = null;
	let objectScaleOnDown = null;
	const transformControls = new TransformControls( camera, container );
	transformControls.addEventListener( 'change', function () {

		const object = transformControls.object;

		if ( object !== undefined ) {

			box.setFromObject( object, true );

			const helper = window.editor.helpers[ object.id ];

			if ( helper !== undefined && helper.isSkeletonHelper !== true ) {

				helper.update();

			}

			useDispatchSignal( "refreshSidebarObject3D",object );

		}

		render();

	} );
	transformControls.addEventListener( 'mouseDown', function () {

		const object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;

	} );
	transformControls.addEventListener( 'mouseUp', function () {

		const object = transformControls.object;

		if ( object !== undefined ) {

			switch ( transformControls.getMode() ) {

				case 'translate':

					if ( ! objectPositionOnDown.equals( object.position ) ) {

						window.editor.execute( new SetPositionCommand( object, object.position, objectPositionOnDown ) );

					}

					break;

				case 'rotate':

					if ( ! objectRotationOnDown.equals( object.rotation ) ) {

						window.editor.execute( new SetRotationCommand(object, object.rotation, objectRotationOnDown ) );

					}

					break;

				case 'scale':

					if ( ! objectScaleOnDown.equals( object.scale ) ) {

						window.editor.execute( new SetScaleCommand(object, object.scale, objectScaleOnDown ) );

					}

					break;

			}

		}

		controls.enabled = true;

	} );
	sceneHelpers.add( transformControls );

	// 拾取对象
	const raycaster = new THREE.Raycaster();
	//Raycaster 将只从它遇到的第一个对象中获取信息
	raycaster.firstHitOnly = true;
	const mouse = new THREE.Vector2();

	// 事件
	function updateAspectRatio() {
		camera.aspect = container.offsetWidth / container.offsetHeight;
		camera.updateProjectionMatrix();
	}

	function getIntersects( point ) {
		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
		raycaster.setFromCamera( mouse, camera );

		const objects = [];
		scene.traverseVisible( function ( child ) {
			objects.push( child );
		} );

		sceneHelpers.traverseVisible( function ( child ) {
			if ( child.name === 'picker' ) objects.push( child );
		} );

		return raycaster.intersectObjects( objects, false );
	}

	const onDownPosition = new THREE.Vector2();
	const onUpPosition = new THREE.Vector2();
	const onDoubleClickPosition = new THREE.Vector2();

	function getMousePosition( dom, x, y ) {
		const rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
	}

	function handleClick() {
		if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
			const intersects = getIntersects( onUpPosition );
			useDispatchSignal( "intersectionsDetected",intersects );
			render();
		}
	}

	function onMouseDown( event ) {
		// event.preventDefault();
		const array = getMousePosition( container, event.clientX, event.clientY );
		onDownPosition.fromArray( array );
		document.addEventListener( 'mouseup', onMouseUp );
	}

	function onMouseUp( event ) {
		const array = getMousePosition( container, event.clientX, event.clientY );
		onUpPosition.fromArray( array );
		handleClick();
		document.removeEventListener( 'mouseup', onMouseUp );
	}

	function onTouchStart( event ) {
		const touch = event.changedTouches[ 0 ];
		const array = getMousePosition( container, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );
		document.addEventListener( 'touchend', onTouchEnd );
	}

	function onTouchEnd( event ) {
		const touch = event.changedTouches[ 0 ];
		const array = getMousePosition( container, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );
		handleClick();
		document.removeEventListener( 'touchend', onTouchEnd );
	}

	function onDoubleClick( event ) {
		const array = getMousePosition( container, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );
		const intersects = getIntersects( onDoubleClickPosition );
		if ( intersects.length > 0 ) {
			const intersect = intersects[ 0 ];
			useDispatchSignal( "objectFocused",intersect.object );
		}
	}

	container.addEventListener( 'mousedown', onMouseDown );
	container.addEventListener( 'touchstart', onTouchStart );
	container.addEventListener( 'dblclick', onDoubleClick );

	//需要在主逻辑之后添加controls
	//否则controls.Enabled不起作用
	controls = new EditorControls(camera, container);
	controls.addEventListener( 'change', function () {
		useDispatchSignal( "cameraChanged",camera );
		useDispatchSignal( "refreshSidebarObject3D",camera );
	} );
	viewHelper.controls = controls;

	// signals
	useAddSignal("editorCleared",function () {
		controls.center.set( 0, 0, 0 );
		render();
	});

	useAddSignal("transformModeChanged",function ( mode ) {
		transformControls.setMode( mode );
	});

	useAddSignal("snapChanged",function ( dist ) {
		transformControls.setTranslationSnap( dist );
	});

	useAddSignal("spaceChanged",function ( space ) {
		transformControls.setSpace( space );
	});

	useAddSignal("rendererUpdated",function () {
		scene.traverse( function ( child ) {
			if ( child.material !== undefined ) {
				child.material.needsUpdate = true;
			}
		});
		render();
	});

	useAddSignal("rendererCreated",function ( newRenderer ) {
		if (renderer !== null) {
			renderer.setAnimationLoop( null );
			renderer.dispose();
			pmremGenerator.dispose();
			container.removeChild( renderer.domElement );
		}
		renderer = newRenderer;
		renderer.setAnimationLoop(animate);
		renderer.setClearColor(0x272727,1);
		if ( window.matchMedia ) {
			const mediaQuery = window.matchMedia( '(prefers-color-scheme: dark)' );
			mediaQuery.addEventListener('change', function ( event ) {
				renderer.setClearColor( event.matches ? 0x333333 : 0xaaaaaa );
				updateGridColors( grid1, grid2, event.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );
				render();
			});
			renderer.setClearColor( mediaQuery.matches ? 0x333333 : 0xaaaaaa );
			updateGridColors( grid1, grid2, mediaQuery.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );
		}

		renderer.setPixelRatio(Math.max(Math.ceil(window.devicePixelRatio), 1));
		renderer.setSize(container.offsetWidth, container.offsetHeight);

		// 创建一个PMREMGenerator，从立方体映射环境纹理生成预过滤的 Mipmap 辐射环境贴图
		pmremGenerator = new THREE.PMREMGenerator(renderer);
		pmremGenerator.compileEquirectangularShader();

		container.appendChild(renderer.domElement);

		useDispatchSignal("loadDefaultEnvAndBack");
		render();
	});

	// 加载默认的环境和背景
	useAddSignal("loadDefaultEnvAndBack", (definition = 2) => {
		window.editor.resource.loadURLTexture(`/upyun/assets/texture/hdr/kloofendal_48d_partly_cloudy_puresky_${definition}k.hdr`, (tex) => {
			tex.mapping = THREE.EquirectangularReflectionMapping;
			scene.environment = tex;
			scene.background = tex;

			useDispatchSignal("sceneGraphChanged")
		})
	})

	useAddSignal("sceneGraphChanged",function () {
		render();
	});

	useAddSignal("cameraChanged",function () {
		render();
	});

	useAddSignal("objectSelected",function ( object ) {
		selectionBox.visible = false;
		transformControls.detach();
		if ( object !== null && object !== scene && object !== camera ) {
			box.setFromObject( object, true );
			if ( box.isEmpty() === false ) {
				selectionBox.visible = true;
			}
			transformControls.attach( object );
		}
		render();
	});

	useAddSignal("objectFocused",function ( object ) {
		controls.focus( object );
	});

	useAddSignal("geometryChanged",function ( object ) {
		if ( object !== undefined ) {
			box.setFromObject( object, true );
		}
		render();
	});

	useAddSignal("objectChanged",function ( object ) {
		if ( window.editor.selected === object ) {
			box.setFromObject( object, true );
		}
		if ( object.isPerspectiveCamera ) {
			object.updateProjectionMatrix();
		}
		const helper = window.editor.helpers[ object.id ];
		if ( helper !== undefined && helper.isSkeletonHelper !== true ) {
			helper.update();
		}
		render();
	});

	useAddSignal("objectRemoved",function (object) {
		controls.enabled = true;
		if ( object === transformControls.object ) {
			transformControls.detach();
		}
	});

	useAddSignal("materialChanged",function () {
		render();
	});

	// background
	useAddSignal("sceneBackgroundChanged",function ( backgroundType, backgroundColor, backgroundTexture, backgroundEquirectangularTexture, backgroundBlurriness ) {
		switch ( backgroundType ) {
			case 'None':
				scene.background = null;
				break;
			case 'Color':
				scene.background = new THREE.Color(backgroundColor);
				break;
			case 'Texture':
				if ( backgroundTexture ) {
					scene.background = backgroundTexture;
				}
				break;
			case 'Equirectangular':
				if ( backgroundEquirectangularTexture ) {
					backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.background = backgroundEquirectangularTexture;
					scene.backgroundBlurriness = backgroundBlurriness;
				}
				break;
		}
		render();
	});

	// environment
	useAddSignal("sceneEnvironmentChanged",function ( environmentType, environmentEquirectangularTexture ) {
		switch ( environmentType ) {
			case 'None':
				scene.environment = null;
				break;
			case 'Equirectangular':
				scene.environment = null;
				if ( environmentEquirectangularTexture ) {
					environmentEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.environment = environmentEquirectangularTexture;
				}
				break;
			case 'ModelViewer':
				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
				break;
		}
		render();
	});

	// fog
	useAddSignal("sceneFogChanged",function ( fogType, fogColor, fogNear, fogFar, fogDensity ) {
		switch ( fogType ) {
			case 'None':
				scene.fog = null;
				break;
			case 'Fog':
				scene.fog = new THREE.Fog( fogColor, fogNear, fogFar );
				break;
			case 'FogExp2':
				scene.fog = new THREE.FogExp2( fogColor, fogDensity );
				break;
		}
		render();
	});

	useAddSignal("sceneFogSettingsChanged",function ( fogType, fogColor, fogNear, fogFar, fogDensity ) {
		switch ( fogType ) {
			case 'Fog':
				scene.fog.color.setHex( fogColor );
				scene.fog.near = fogNear;
				scene.fog.far = fogFar;
				break;
			case 'FogExp2':
				scene.fog.color.setHex( fogColor );
				scene.fog.density = fogDensity;
				break;
		}
		render();
	});

	useAddSignal("viewportCameraChanged",function () {
		const viewportCamera = window.editor.viewportCamera;
		if ( viewportCamera.isPerspectiveCamera ) {
			viewportCamera.aspect = window.editor.camera.aspect;
			viewportCamera.projectionMatrix.copy( window.editor.camera.projectionMatrix );
		} else if ( viewportCamera.isOrthographicCamera ) {
			// TODO
		}

		// 设置用户Camera时禁用EditorControls
		controls.enabled = ( viewportCamera === window.editor.camera );
		render();
	});

	useAddSignal("exitedVR",render );

	useAddSignal("sceneResize",function () {
		updateAspectRatio();
		renderer.setSize( container.offsetWidth, container.offsetHeight );
		render();
	});

	useAddSignal("showGridChanged",function( showGrid ) {
		grid.visible = showGrid;
		render();
	});

	useAddSignal("showHelpersChanged",function ( showHelpers ) {
		showSceneHelpers = showHelpers;
		transformControls.enabled = showHelpers;
		render();
	});

	useAddSignal("cameraReseted",updateAspectRatio);

	// animations
	let prevActionsInUse = 0;
	// 仅用于animations
	const clock = new THREE.Clock();

	function animate() {
		const mixer = window.editor.mixer;
		const delta = clock.getDelta();

		let needsUpdate = false;
		// Animations
		const actions = mixer.stats.actions;
		if ( actions.inUse > 0 || prevActionsInUse > 0 ) {
			prevActionsInUse = actions.inUse;
			mixer.update( delta );
			needsUpdate = true;
		}

		// View Helper
		if ( viewHelper.animating === true ) {
			viewHelper.update( delta );
			needsUpdate = true;
		}

		if ( vr.currentSession !== null ) {
			needsUpdate = true;
		}

		if ( needsUpdate === true ) render();
	}

	let startTime = 0;
	let endTime = 0;

	function render() {
		startTime = performance.now();

		scene.add( grid );
		renderer.setViewport( 0, 0, container.offsetWidth, container.offsetHeight );
		renderer.render( scene, window.editor.viewportCamera );
		scene.remove( grid );

		if (camera === window.editor.viewportCamera) {
			renderer.autoClear = false;
			if ( showSceneHelpers === true ) renderer.render( sceneHelpers, camera );
			if ( vr.currentSession === null ) viewHelper.render( renderer );
			renderer.autoClear = true;
		}

		endTime = performance.now();
		useDispatchSignal("sceneRendered",endTime - startTime);
	}
}

function updateGridColors( grid1, grid2, colors ) {
	grid1.material.color.setHex( colors[ 0 ] );
	grid2.material.color.setHex( colors[ 1 ] );
}

export { Viewport };
