import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import { AddObjectCommand } from './commands/AddObjectCommand';
import { SetSceneCommand } from './commands/SetSceneCommand.js';
import { unzipSync, strFromU8 } from 'three/examples/jsm/libs/fflate.module.js';
import MaterialCreator = MTLLoader.MaterialCreator;
import {useDispatchSignal} from "@/hooks/useSignal";

class Loader {
	protected texturePath:string;
	protected ifcLoader:IFCLoader | null;

	constructor(){
		this.texturePath = '';
		this.ifcLoader = null;
	}

	loadItemList(items) {
		LoaderUtils.getFilesFromItemList( items, ( files, filesMap )=>{
			this.loadFiles( files, filesMap,()=>{} );
		} );
	}

	loadFiles( files, filesMap,complete ) {
		if ( files.length > 0 ) {
			filesMap = filesMap || LoaderUtils.createFilesMap( files );
			const manager = new THREE.LoadingManager();
			manager.setURLModifier( function ( url ) {
				url = url.replace( /^(\.?\/)/, '' ); // remove './'
				const file = filesMap[ url ];
				if ( file ) {
					console.log( 'Loading', url );
					return URL.createObjectURL( file );
				}
				return url;
			});
			manager.addHandler( /\.tga$/i, new TGALoader() );
			manager.addHandler( /\.mtl$/i, new MTLLoader() );

			/** 2023/02/03 二三：判断是否存在mtl文件，存在则提前解析 **/
				// @ts-ignore
			const mtlIndex = Object.values(files).findIndex((item:File) => item.name?.split( '.' ).pop().toLowerCase() === "mtl");
			let mtlMaterials:MaterialCreator | null = null;
			if(mtlIndex !== -1){
				const mtlLoader = new MTLLoader();
				const reader = new FileReader();
				reader.addEventListener( 'load',  ( event ) => {
					const contents = event.target?.result as string;
					const materials = mtlLoader.parse( contents,"" );
					materials.preload();
					mtlMaterials = materials;
					for ( let i = 0; i < files.length; i ++ ) {
						this.loadFile( files[ i ], manager,mtlMaterials );
					}
					complete();
				}, false );
				reader.readAsText( files[ mtlIndex ] );
			}else{
				for ( let i = 0; i < files.length; i ++ ) {
					this.loadFile( files[ i ], manager,null );
				}
				complete();
			}
		}
	}

	loadFile( file, manager,mtlMaterials ) {
		const filename = file.name;
		const extension = filename.split( '.' ).pop().toLowerCase();

		console.log("loadFile",extension)

		const reader = new FileReader();
		reader.addEventListener( 'progress', function ( event ) {
			const size = '(' + Math.floor( event.total / 1000 ).format() + ' KB)';
			const progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';
			console.log( 'Loading', filename, size, progress );
		} );

		switch (extension) {
			case '3dm':
				reader.addEventListener( 'load', async function (event) {
					const contents = event.target?.result;

					const { Rhino3dmLoader } = await import('three/examples/jsm/loaders/3DMLoader.js');

					const loader = new Rhino3dmLoader();
					loader.setLibraryPath( '../examples/jsm/libs/rhino3dm/' );
					loader.parse(contents as ArrayBufferLike, function ( object ) {
						window.editor.execute( new AddObjectCommand( object ) );
					});
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case '3ds':
				reader.addEventListener( 'load', async function ( event ) {
					const { TDSLoader } = await import( 'three/examples/jsm/loaders/TDSLoader.js' );

					const loader = new TDSLoader();
					//@ts-ignore
					const object = loader.parse( event.target.result );

					window.editor.execute( new AddObjectCommand( object ) );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case '3mf':
				reader.addEventListener( 'load', async function ( event ) {
					const { ThreeMFLoader } = await import( 'three/examples/jsm/loaders/3MFLoader.js' );
					const loader = new ThreeMFLoader();
					const object = loader.parse(event.target?.result as ArrayBuffer);

					window.editor.execute( new AddObjectCommand( object ) );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case 'amf':
				reader.addEventListener( 'load', async function ( event ) {
					const { AMFLoader } = await import( 'three/examples/jsm/loaders/AMFLoader.js' );

					const loader = new AMFLoader();
					const amfobject = loader.parse( event.target?.result as ArrayBuffer );

					window.editor.execute( new AddObjectCommand( amfobject ) );
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'dae':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as string;

					const { ColladaLoader } = await import( 'three/examples/jsm/loaders/ColladaLoader.js' );

					const loader = new ColladaLoader( manager );
					//@ts-ignore
					const collada = loader.parse( contents );

					collada.scene.name = filename;

					window.editor.execute( new AddObjectCommand( collada.scene ) );
				}, false );
				reader.readAsText( file );

				break;
			case 'drc':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result;

					const { DRACOLoader } = await import( 'three/examples/jsm/loaders/DRACOLoader.js' );
					const loader = new DRACOLoader();
					loader.setDecoderPath( '/upyun/libs/draco/' );
					//@ts-ignore
					loader.decodeDracoFile( contents, function ( geometry ) {
						let object;
						if ( geometry.index !== null ) {
							const material = new THREE.MeshStandardMaterial();

							object = new THREE.Mesh( geometry, material );
							object.name = filename;
						} else {
							const material = new THREE.PointsMaterial( { size: 0.01 } );
							material.vertexColors = geometry.hasAttribute( 'color' );

							object = new THREE.Points( geometry, material );
							object.name = filename;
						}

						loader.dispose();
						window.editor.execute( new AddObjectCommand( object ) );
					} );
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'fbx':
				reader.addEventListener('load', async function(event) {
					const contents = event.target?.result;

					const { FBXLoader } = await import( 'three/examples/jsm/loaders/FBXLoader.js' );

					const loader = new FBXLoader( manager );
					//@ts-ignore
					const object = loader.parse( contents as ArrayBuffer );

					window.editor.execute(new AddObjectCommand(object));
				}, false );
				reader.readAsArrayBuffer(file);

				break;
			case 'glb':
				reader.addEventListener( 'load', async ( event )=>  {
					const contents = event.target?.result as ArrayBuffer;

					const loader = await this.createGLTFLoader();

					console.log(contents)

					loader.parse( contents, '', function (result) {
						const scene = result.scene;
						scene.name = filename;

						scene.animations.push(...result.animations);
						window.editor.execute(new AddObjectCommand(scene));

						loader.dracoLoader?.dispose();
						// @ts-ignore
						loader.ktx2Loader.dispose();
					});
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'gltf':
				reader.addEventListener( 'load', async ( event ) => {
					const contents = event.target?.result as ArrayBuffer;
					const loader = await this.createGLTFLoader(manager);

					loader.parse(contents, '', function ( result ) {
						const scene = result.scene;
						scene.name = filename;

						scene.animations.push( ...result.animations );
						window.editor.execute(new AddObjectCommand( scene ));

						loader.dracoLoader?.dispose();
						// @ts-ignore
						loader.ktx2Loader.dispose();
					});
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'js':
			case 'json':
				reader.addEventListener( 'load', ( event ) => {
					const contents:string = event.target?.result as string;

					// 2.0
					if (contents.indexOf( 'postMessage' ) !== - 1 ) {
						const blob = new Blob( [ contents ], { type: 'text/javascript' } );
						const url = URL.createObjectURL( blob );

						const worker = new Worker( url );

						worker.onmessage = ( event ) => {
							event.data.metadata = { version: 2 };
							this.handleJSON( event.data );
						};

						worker.postMessage( Date.now() );
						return;
					}

					// >= 3.0

					let data;
					try {
						data = JSON.parse(contents);
					} catch ( error ) {
						window.$message?.error(error as string);
						return;
					}
					this.handleJSON( data );
				}, false );
				reader.readAsText( file );

				break;
			case 'ifc':
				reader.addEventListener( 'load', async ( event ) => {
					if(!this.ifcLoader){
						this.ifcLoader = new IFCLoader();
					}

					await this.ifcLoader.ifcManager.useWebWorkers(true, "/upyun/libs/web-ifc/IFCWorker.js");
					await this.ifcLoader.ifcManager.setWasmPath('/');

					// const { IFCSPACE } = await import('web-ifc');
					// await this.ifcLoader.ifcManager.parser.setupOptionalCategories( {
					// 	[ IFCSPACE ]: false,
					// });

					await this.ifcLoader.ifcManager.applyWebIfcConfig({
						// 使用更快的（不那么精确的）布尔逻辑
						USE_FAST_BOOLS: true
					});

					const model = await this.ifcLoader.parse(event.target?.result as ArrayBuffer);
					model.name = filename;
					model.userData.isIFC = true;
					window.editor.execute( new AddObjectCommand( model ) );
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			// case 'ifc':
			// 	reader.addEventListener( 'load', async function ( event ) {
			// 		const { IFCLoader } = await import( 'three/examples/jsm/loaders/IFCLoader.js' );
			//
			// 		const loader = new IFCLoader();
			// 		loader.ifcManager.setWasmPath( 'three/examples/jsm/loaders/ifc/' );
			//
			// 		// @ts-ignore
			// 		const model = await loader.parse( event.target.result );
			// 		model.mesh.name = filename;
			//
			// 		window.editor.execute( new AddObjectCommand(model.mesh));
			// 	}, false );
			// 	reader.readAsArrayBuffer( file );
			// 	break;
			case 'kmz':
				reader.addEventListener( 'load', async function ( event ) {
					const { KMZLoader } = await import( 'three/examples/jsm/loaders/KMZLoader.js' );

					const loader = new KMZLoader();
					const collada = loader.parse(event.target?.result as ArrayBuffer);
					collada.scene.name = filename;
					window.editor.execute( new AddObjectCommand( collada.scene ) );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case 'ldr':
			case 'mpd':
				reader.addEventListener( 'load', async function ( event ) {
					const { LDrawLoader } = await import( 'three/examples/jsm/loaders/LDrawLoader.js' );

					const loader = new LDrawLoader();
					loader.setPath( 'three/examples/models/ldraw/officialLibrary/' );
					// @ts-ignore
					loader.parse( event.target?.result as string, undefined, function ( group ) {
						group.name = filename;
						// Convert from LDraw coordinates: rotate 180 degrees around OX
						group.rotation.x = Math.PI;

						window.editor.execute( new AddObjectCommand( group ) );
					} );
				}, false );
				reader.readAsText( file );
				break;
			case 'md2':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;

					const { MD2Loader } = await import( 'three/examples/jsm/loaders/MD2Loader.js' );

					const geometry = new MD2Loader().parse( contents );
					const material = new THREE.MeshStandardMaterial();

					const mesh = new THREE.Mesh( geometry, material );
					//@ts-ignore
					mesh.mixer = new THREE.AnimationMixer( mesh );
					mesh.name = filename;
					//@ts-ignore
					mesh.animations.push( ...geometry.animations );
					window.editor.execute( new AddObjectCommand( mesh ) );
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'obj':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as string;

					const { OBJLoader } = await import( 'three/examples/jsm/loaders/OBJLoader.js' );
					const objLoader = new OBJLoader();

					/** 2023/02/03 二三：判断是否存在已解析的mtl文件 **/
					if(mtlMaterials !== null){
						objLoader.setMaterials(mtlMaterials);
					}

					const object = objLoader.parse( contents );
					object.name = filename;

					window.editor.execute( new AddObjectCommand( object ) );
				}, false );
				reader.readAsText( file );

				break;
			case 'mtl':
				//mtl文件已经提前预加载
				break;
			case 'pcd':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;

					const { PCDLoader } = await import( 'three/examples/jsm/loaders/PCDLoader.js' );

					const points = new PCDLoader().parse( contents );
					points.name = filename;

					window.editor.execute(new AddObjectCommand( points ));
				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'ply':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;
					const { PLYLoader } = await import( 'three/examples/jsm/loaders/PLYLoader.js' );

					const geometry = new PLYLoader().parse( contents );
					let object;

					if ( geometry.index !== null ) {
						const material = new THREE.MeshStandardMaterial();

						object = new THREE.Mesh( geometry, material );
						object.name = filename;
					} else {
						const material = new THREE.PointsMaterial( { size: 0.01 } );
						material.vertexColors = geometry.hasAttribute( 'color' );

						object = new THREE.Points( geometry, material );
						object.name = filename;
					}

					window.editor.execute( new AddObjectCommand( object ) );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case 'stl':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;

					const { STLLoader } = await import( 'three/examples/jsm/loaders/STLLoader.js' );

					const geometry = new STLLoader().parse( contents );
					const material = new THREE.MeshStandardMaterial();

					const mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					window.editor.execute( new AddObjectCommand( mesh ) );
				}, false);

				if ( reader.readAsBinaryString !== undefined ) {
					reader.readAsBinaryString( file );
				} else {
					reader.readAsArrayBuffer( file );
				}

				break;
			case 'svg':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as string;
					const { SVGLoader } = await import( 'three/examples/jsm/loaders/SVGLoader.js' );

					const loader = new SVGLoader();
					const paths = loader.parse( contents ).paths;

					const group = new THREE.Group();
					group.scale.multiplyScalar( 0.1 );
					group.scale.y *= - 1;

					for ( let i = 0; i < paths.length; i ++ ) {
						const path = paths[ i ];

						const material = new THREE.MeshBasicMaterial( {
							color: path.color,
							depthWrite: false
						});

						const shapes = SVGLoader.createShapes( path );

						for ( let j = 0; j < shapes.length; j ++ ) {
							const shape = shapes[ j ];

							const geometry = new THREE.ShapeGeometry( shape );
							const mesh = new THREE.Mesh( geometry, material );

							group.add( mesh );
						}
					}

					window.editor.execute( new AddObjectCommand( group ) );
				}, false );
				reader.readAsText( file );

				break;
			case 'usdz':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;

					const { USDZLoader } = await import( 'three/examples/jsm/loaders/USDZLoader.js' );

					const group = new USDZLoader().parse( contents );
					group.name = filename;

					window.editor.execute( new AddObjectCommand( group ) );

				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'vox':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;
					const { VOXLoader, VOXMesh } = await import( 'three/examples/jsm/loaders/VOXLoader.js' );

					const chunks = new VOXLoader().parse(contents);

					const group = new THREE.Group();
					group.name = filename;

					for (let i = 0; i < chunks.length; i++) {
						const chunk:any = chunks[ i ];

						const mesh = new VOXMesh(chunk);
						group.add( mesh );
					}

					window.editor.execute( new AddObjectCommand( group ) );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			case 'vtk':
			case 'vtp':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as ArrayBuffer;

					const { VTKLoader } = await import( 'three/examples/jsm/loaders/VTKLoader.js' );
					//@ts-ignore
					const geometry = new VTKLoader().parse( contents );
					const material = new THREE.MeshStandardMaterial();

					const mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					window.editor.execute( new AddObjectCommand( mesh ) );

				}, false );
				reader.readAsArrayBuffer( file );

				break;
			case 'wrl':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as string;
					const { VRMLLoader } = await import( 'three/examples/jsm/loaders/VRMLLoader.js' );
					//@ts-ignore
					const result = new VRMLLoader().parse( contents );
					window.editor.execute( new SetSceneCommand( window.editor, result ) );
				}, false );
				reader.readAsText( file );

				break;
			case 'xyz':
				reader.addEventListener( 'load', async function ( event ) {
					const contents = event.target?.result as string;

					const { XYZLoader } = await import( 'three/examples/jsm/loaders/XYZLoader.js' );

					//@ts-ignore
					const geometry = new XYZLoader().parse( contents );

					const material = new THREE.PointsMaterial();
					//@ts-ignore
					material.vertexColors = geometry.hasAttribute( 'color' );

					const points = new THREE.Points( geometry as THREE.BufferGeometry, material );
					points.name = filename;

					window.editor.execute( new AddObjectCommand( points ) );
				}, false );
				reader.readAsText( file );

				break;
			case 'zip':
				reader.addEventListener( 'load', ( event ) => {
					this.handleZIP( event.target?.result );
				}, false );
				reader.readAsArrayBuffer( file );
				break;
			default:
				window.$message?.error(`${window.$t("prompt['Unsupported file format']")} (${extension}).`);
				break;
		}
	}

	handleJSON( data ) {
		if ( data.metadata === undefined ) { // 2.0
			data.metadata = { type: 'Geometry' };
		}

		if ( data.metadata.type === undefined ) { // 3.0
			data.metadata.type = 'Geometry';
		}

		if ( data.metadata.formatVersion !== undefined ) {
			data.metadata.version = data.metadata.formatVersion;
		}

		switch ( data.metadata.type.toLowerCase() ) {
			case 'buffergeometry':
			{
				const loader = new THREE.BufferGeometryLoader();
				const result = loader.parse( data );

				const mesh = new THREE.Mesh( result );

				window.editor.execute( new AddObjectCommand( mesh ) );

				break;
			}
			case 'geometry':
				window.$message?.error(window.$t("prompt['Loader: \"Geometry\" is no longer supported.']"));
				break;
			case 'object':
			{
				const loader = new THREE.ObjectLoader();
				loader.setResourcePath( this.texturePath );

				loader.parse( data, function ( result:any ) {
					if ( result.isScene ) {
						window.editor.execute( new SetSceneCommand( window.editor, result ) );
					} else {
						window.editor.execute( new AddObjectCommand( result ) );
					}
				});
				break;
			}
			case 'app':
				window.editor.fromJSON( data );
				break;
		}
	}

	async handleZIP( contents ) {
		const zip = unzipSync( new Uint8Array( contents ) );

		// Poly
		if ( zip[ 'model.obj' ] && zip[ 'materials.mtl' ] ) {
			const { MTLLoader } = await import( 'three/examples/jsm/loaders/MTLLoader.js' );
			const { OBJLoader } = await import( 'three/examples/jsm/loaders/OBJLoader.js' );

			//@ts-ignore
			const materials = new MTLLoader().parse( strFromU8( zip[ 'materials.mtl' ] ) );
			const object = new OBJLoader().setMaterials( materials ).parse( strFromU8( zip[ 'model.obj' ] ) );
			window.editor.execute( new AddObjectCommand( object ) );
		}

		//
		for ( const path in zip ) {
			const file = zip[ path ];

			const manager = new THREE.LoadingManager();
			manager.setURLModifier( function ( url ) {
				const file = zip[ url ];

				if ( file ) {
					console.log( 'Loading', url );

					const blob = new Blob( [ file.buffer ], { type: 'application/octet-stream' } );
					return URL.createObjectURL( blob );
				}

				return url;
			});

			const extension = path.split( '.' ).pop()?.toLowerCase();
			switch ( extension ) {
				case 'fbx':
				{
					const { FBXLoader } = await import( 'three/examples/jsm/loaders/FBXLoader.js' );
					const loader = new FBXLoader( manager );
					//@ts-ignore
					const object = loader.parse( file.buffer );

					window.editor.execute( new AddObjectCommand( object ) );

					break;
				}
				case 'glb':
				{
					const loader = await this.createGLTFLoader();

					loader.parse(file.buffer, '', function ( result ) {
						const scene = result.scene;

						scene.animations.push( ...result.animations );
						window.editor.execute( new AddObjectCommand( scene ) );

						loader.dracoLoader?.dispose();
						// @ts-ignore
						loader.ktx2Loader.dispose();
					});
					break;
				}
				case 'gltf':
				{
					const loader = await this.createGLTFLoader( manager );

					loader.parse( strFromU8( file ), '', function ( result ) {
						const scene = result.scene;
						scene.animations.push( ...result.animations );
						window.editor.execute( new AddObjectCommand( scene ) );

						loader.dracoLoader?.dispose();
						// @ts-ignore
						loader.ktx2Loader.dispose();
					});
					break;
				}
			}
		}
	}

	async createGLTFLoader(manager:any = null) {
		const { GLTFLoader } = await import( 'three/examples/jsm/loaders/GLTFLoader.js' );
		const { DRACOLoader } = await import( 'three/examples/jsm/loaders/DRACOLoader.js' );
		const { KTX2Loader } = await import( 'three/examples/jsm/loaders/KTX2Loader.js' );
		const { MeshoptDecoder } = await import( 'three/examples/jsm/libs/meshopt_decoder.module.js' );

		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath( '/upyun/libs/draco/gltf/' );

		const ktx2Loader = new KTX2Loader();
		ktx2Loader.setTranscoderPath( 'three/examples/jsm/libs/basis/' );

		useDispatchSignal("rendererDetectKTX2Support",ktx2Loader);

		const loader = new GLTFLoader(manager);
		loader.setDRACOLoader(dracoLoader);
		loader.setKTX2Loader(ktx2Loader);
		loader.setMeshoptDecoder(MeshoptDecoder);

		return loader;
	}

	loadUrlTexture(extension: string, url: string, onload: (tex: THREE.Texture) => void) {
		switch (extension) {
			case 'hdr': {
				const loader = new RGBELoader();
				loader.setDataType(THREE.HalfFloatType);
				return loader.load(url, (hdrTexture) => {
					onload && onload(hdrTexture);
				});
			}
			case 'tga': {
				const loader = new TGALoader();
				return loader.load(url, (tagTex) => {
					onload && onload(tagTex);
				});
			}
			case "exr": {
				const loader = new EXRLoader();
				return loader.load(url, (tagTex) => {
					onload && onload(tagTex);
				});
			}
			default: {
				return new THREE.TextureLoader().load(url, (tex) => {
					onload && onload(tex);
				});
			}
		}
	}
}

const LoaderUtils = {
	createFilesMap: function (files: FileList | File[]) {
		const map = {};

		for ( let i = 0; i < files.length; i ++ ) {
			const file = files[ i ];
			map[ file.name ] = file;
		}

		return map;
	},
	getFilesFromItemList: function ( items: DataTransferItem[], onDone: (files: File[], filesMap) => void ) {
		// TOFIX: setURLModifier() breaks when the file being loaded is not in root
		let itemsCount = 0;
		let itemsTotal = 0;

		const files: File[] = [];
		const filesMap = {};

		function onEntryHandled() {

			itemsCount ++;

			if ( itemsCount === itemsTotal ) {

				onDone( files, filesMap );

			}

		}

		function handleEntry( entry ) {

			if ( entry.isDirectory ) {

				const reader = entry.createReader();
				reader.readEntries( function ( entries ) {

					for ( let i = 0; i < entries.length; i ++ ) {

						handleEntry( entries[ i ] );

					}

					onEntryHandled();

				} );

			} else if ( entry.isFile ) {

				entry.file( function ( file ) {

					files.push( file );

					filesMap[ entry.fullPath.slice( 1 ) ] = file;
					onEntryHandled();

				} );

			}

			itemsTotal ++;

		}

		for ( let i = 0; i < items.length; i ++ ) {

			const item = items[ i ];

			if ( item.kind === 'file' ) {

				handleEntry( item.webkitGetAsEntry() );

			}

		}

	}

};

export { Loader };
