import * as THREE from 'three';
import { useSignal} from '@/hooks/useSignal';
import { Config } from './Config';
import { Session } from './Session';
import { Loader } from './Loader';
import { Resource } from './Resource';
import { History as _History } from './History';
import { Storage as _Storage } from './Storage';
import { Selector } from './Viewport.Selector';
import {useDrawingStoreWithOut} from "@/store/modules/drawing";
import {useSceneInfoStoreWithOut} from "@/store/modules/sceneInfo";

import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree,} from "three-mesh-bvh";
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const { add:addSignal,dispatch, setActive } = useSignal();

const drawingStore = useDrawingStoreWithOut();
const sceneInfoStore = useSceneInfoStoreWithOut();

const _DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 0.01, 100 * 1000);
_DEFAULT_CAMERA.position.set(0, 5, 10);
_DEFAULT_CAMERA.lookAt(new THREE.Vector3());

class Editor {
	public config: Config;
	public session: Session;
	public storage;
	public selector: Selector;
	public history: _History;
	public loader;
	public resource: Resource;
	public camera: THREE.Camera;
	public scene: THREE.Scene;
	public sceneHelpers: THREE.Scene;
	public object;
	public geometries;
	public materials;
	public textures;
	public scripts;
	protected materialsRefCounter: Map<object, any>;
	public mixer;
	public selected;
	public helpers;
	public cameras: { [uuid: string]: THREE.Camera };
	protected viewportCamera: THREE.Camera;

	constructor() {
		_DEFAULT_CAMERA.name = window.$t("core.editor['Default Camera']");

		//localStorage
		this.config = new Config();
		//sessionStorage
		this.session = new Session();
		//indexDB
		this.storage = _Storage();

		this.selector = new Selector(this);

		this.history = new _History();

		this.loader = new Loader();

		// 资源管理
		this.resource = new Resource();

		this.camera = _DEFAULT_CAMERA.clone();

		this.scene = new THREE.Scene();
		this.scene.name = window.$t("core.editor['Default Scene']");
		this.sceneHelpers = new THREE.Scene();

		// this.object = {}; // TODO 20240107 unused?
		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		//跟踪一个3D对象使用材料的频率
		this.materialsRefCounter = new Map();

		this.mixer = new THREE.AnimationMixer(this.scene);

		this.selected = null;
		this.helpers = {};

		this.cameras = {};
		this.viewportCamera = this.camera;

		this.addCamera(this.camera);

		addSignal("changeLocaleLanguage",()=>{
			this.scene.name = window.$t("core.editor['Default Scene']");
			_DEFAULT_CAMERA.name = window.$t("core.editor['Default Camera']");
			this.camera.name = window.$t("core.editor['Default Camera']");
		})
		addSignal("objectFocusByUuid",this.focusByUuid.bind(this))
	}

	setScene(scene) {
		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;
		this.scene.background = scene.background;
		this.scene.environment = scene.environment;
		this.scene.fog = scene.fog;
		this.scene.userData = JSON.parse(JSON.stringify(scene.userData));

		// 避免对象渲染
		setActive('sceneGraphChanged', false);

		while (scene.children.length > 0) {
			this.addObject(scene.children[0]);
		}

		setActive('sceneGraphChanged', true);
		dispatch('sceneGraphChanged');
	}

	//添加三维对象
	addObject(object, parent?, index?) {
		const scope = this;
		object.traverse(function (child) {
			if (child.geometry !== undefined) scope.addGeometry(child.geometry);
			if (child.material !== undefined) scope.addMaterial(child.material);
			scope.addCamera(child);
			scope.addHelper(child);
		});

		if (parent === undefined) {
			this.scene.add(object);
		} else {
			parent.children.splice(index, 0, object);
			object.parent = parent;
		}

		dispatch('objectAdded', object);
		dispatch('sceneGraphChanged');
	}

	moveObject(object, parent, before) {
		if (parent === undefined) {
			parent = this.scene;
		}

		parent.add(object);

		// 对子数组进行排序
		if (before !== undefined) {
			const index = parent.children.indexOf(before);
			parent.children.splice(index, 0, object);
			parent.children.pop();
		}

		dispatch('sceneGraphChanged');
	}

	//重命名三维对象
	nameObject(object, name) {
		object.name = name;
		dispatch('sceneGraphChanged');
	}

	removeObject(object) {
		if (object.parent === null) return; // avoid deleting the camera or scene

		const scope = this;
		object.traverse(function (child) {
			scope.removeCamera(child);
			scope.removeHelper(child);
			if (child.material !== undefined) scope.removeMaterial(child.material);
		});
		object.parent.remove(object);

		dispatch('objectRemoved', object);
		dispatch('sceneGraphChanged');
	}

	addGeometry(geometry) {
		this.geometries[geometry.uuid] = geometry;
	}

	setGeometryName(geometry, name) {
		geometry.name = name;
		dispatch('sceneGraphChanged');
	}

	addMaterial(material) {
		if (Array.isArray(material)) {
			for (let i = 0, l = material.length; i < l; i++) {
				this.addMaterialToRefCounter(material[i]);
			}
		} else {
			this.addMaterialToRefCounter(material);
		}

		dispatch('materialAdded');
	}

	addMaterialToRefCounter(material) {
		let materialsRefCounter = this.materialsRefCounter;
		let count = materialsRefCounter.get(material);

		if (count === undefined) {
			materialsRefCounter.set(material, 1);
			this.materials[material.uuid] = material;
		} else {
			count++;
			materialsRefCounter.set(material, count);
		}
	}

	removeMaterial(material) {
		if (Array.isArray(material)) {
			for (let i = 0, l = material.length; i < l; i++) {
				this.removeMaterialFromRefCounter(material[i]);
			}
		} else {
			this.removeMaterialFromRefCounter(material);
		}

		dispatch('materialRemoved');
	}

	removeMaterialFromRefCounter(material) {
		let materialsRefCounter = this.materialsRefCounter;
		let count = materialsRefCounter.get(material);
		count--;

		if (count === 0) {
			materialsRefCounter.delete(material);
			delete this.materials[material.uuid];
		} else {
			materialsRefCounter.set(material, count);
		}
	}

	getMaterialById(id) {
		let material;
		let materials: Array<THREE.Material> = Object.values(this.materials);

		for (let i = 0; i < materials.length; i++) {
			if (materials[i].id === id) {
				material = materials[i];
				break;
			}
		}

		return material;
	}

	setMaterialName(material, name) {
		material.name = name;
		dispatch('sceneGraphChanged');
	}

	addTexture(texture) {
		this.textures[texture.uuid] = texture;
	}

	addCamera(camera) {
		if (camera.isCamera) {
			this.cameras[camera.uuid] = camera;
			dispatch('cameraAdded', camera);
		}
	}

	removeCamera(camera) {
		if (this.cameras[camera.uuid] !== undefined) {
			delete this.cameras[camera.uuid];
			dispatch('cameraRemoved', camera);
		}
	}

	addHelper(object, helper?) {
		let geometry = new THREE.SphereGeometry(2, 4, 2);
		let material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

		if (helper === undefined) {
			if (object.isCamera) {
				helper = new THREE.CameraHelper(object);
			} else if (object.isPointLight) {
				helper = new THREE.PointLightHelper(object, 1);
			} else if (object.isDirectionalLight) {
				helper = new THREE.DirectionalLightHelper(object, 1);
			} else if (object.isSpotLight) {
				helper = new THREE.SpotLightHelper(object);
			} else if (object.isHemisphereLight) {
				helper = new THREE.HemisphereLightHelper(object, 1);
			} else if (object.isSkinnedMesh) {
				helper = new THREE.SkeletonHelper(object.skeleton.bones[0]);
			} else if (object.isBone === true && object.parent?.isBone !== true) {
				helper = new THREE.SkeletonHelper(object);
			} else {
				// no helper for this object type
				return;
			}

			const picker = new THREE.Mesh(geometry, material);
			picker.name = 'picker';
			picker.userData.object = object;
			helper.add(picker);
		}

		this.sceneHelpers.add(helper);
		this.helpers[object.id] = helper;

		dispatch('helperAdded', helper);
	}

	removeHelper(object) {
		if (this.helpers[object.id] !== undefined) {
			var helper = this.helpers[object.id];
			helper.parent.remove(helper);
			delete this.helpers[object.id];
			dispatch('helperRemoved', helper);
		}
	}

	addScript(object, script) {
		if (this.scripts[object.uuid] === undefined) {
			this.scripts[object.uuid] = [];
		}
		this.scripts[object.uuid].push(script);
		dispatch('scriptAdded', script);
	}

	removeScript(object, script) {
		if (this.scripts[object.uuid] === undefined) return;

		let index = this.scripts[object.uuid].indexOf(script);
		if (index !== -1) {
			this.scripts[object.uuid].splice(index, 1);
		}
		dispatch('scriptRemoved', script);
	}

	getObjectMaterial(object, slot) {
		let material = object.material;

		if (Array.isArray(material) && slot !== undefined) {
			material = material[slot];
		}
		return material;
	}

	setObjectMaterial(object, slot, newMaterial) {
		if (Array.isArray(object.material) && slot !== undefined) {
			object.material[slot] = newMaterial;
		} else {
			object.material = newMaterial;
		}
	}

	setViewportCamera(uuid) {
		this.viewportCamera = this.cameras[uuid];
		dispatch('viewportCameraChanged');
	}

	select(object) {
		this.selector.select(object);
	}

	selectById(id) {
		if (id === this.camera.id) {
			this.select(this.camera);
			return;
		}
		this.select(this.scene.getObjectById(id));
	}

	selectByUuid(uuid) {
		const scope = this;
		this.scene.traverse(function (child) {
			if (child.uuid === uuid) {
				scope.select(child);
			}
		});
	}

	deselect() {
		this.selector.deselect();
	}

	focus(object) {
		if (object !== undefined) {
			dispatch('objectFocused', object);
		}
	}

	focusById(id) {
		this.focus(this.scene.getObjectById(id));
	}

	focusByUuid(uuid) {
		if (uuid === undefined) {
			this.deselect();
			return;
		}
		this.focus(this.objectByUuid(uuid));
	}

	clear() {
		this.history.clear();
		this.storage.clear();
		this.camera.copy(_DEFAULT_CAMERA);
		dispatch('cameraReseted');
		this.scene.name = window.$t("core.editor['Default Scene']");
		this.scene.position.set(0,0,0);
		this.scene.rotation.set(0,0,0);
		this.scene.userData = {};
		this.scene.background = null;
		this.scene.environment = null;
		this.scene.fog = null;

		let objects = this.scene.children;
		while (objects.length > 0) {
			this.removeObject(objects[0]);
		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		this.materialsRefCounter.clear();
		this.mixer.stopAllAction();

		this.deselect();

		dispatch('editorCleared');
	}

	/**
	 * 重置场景
	 */
	reset() {
		// 清空场景
		this.clear();

		// 清除图纸pinia状态
		drawingStore.$reset();

		// 加载默认的环境和背景
		dispatch('loadDefaultEnvAndBackground');
	}

	async fromJSON(json) {
		//先清空场景
		this.clear();

		// 清除图纸状态
		drawingStore.$reset();

		if (json.drawingInfo) {
			drawingStore.setImgSrc(json.drawingInfo.imgSrc);
			drawingStore.setMarkList(json.drawingInfo.markList);
			drawingStore.setImgInfo(json.drawingInfo.imgInfo);
			drawingStore.setIsUploaded(true);

			json.drawingInfo = undefined;
			delete json.drawingInfo;
		}

		//重新设置场景信息
		if(json.sceneInfo){
			sceneInfoStore.setId(json.sceneInfo.id);
			sceneInfoStore.setName(json.sceneInfo.sceneName);
			sceneInfoStore.setVersion(json.sceneInfo.sceneVersion);
			sceneInfoStore.setIntroduction(json.sceneInfo.sceneIntroduction);
			sceneInfoStore.setIsCesium(Boolean(json.sceneInfo.isCesium));
		}else{
			sceneInfoStore.setId(0);
			sceneInfoStore.setName("");
			sceneInfoStore.setVersion(1);
			sceneInfoStore.setIntroduction("");
			sceneInfoStore.setIsCesium(false);
		}

		let loader = new THREE.ObjectLoader();
		let camera = await loader.parseAsync(json.camera);

		this.camera.copy(camera as THREE.Camera);
		dispatch('cameraReseted');

		this.history.fromJSON(json.history);
		this.scripts = json.scripts;

		this.setScene(await loader.parseAsync(json.scene));

		window.$message?.success(window.$t("scene['Loading completed!']"));
	}

	toJSON() {
		// 脚本清理
		let scene = this.scene;
		let scripts = this.scripts;

		for (let key in scripts) {
			let script = scripts[key];
			if (script.length === 0 || scene.getObjectByProperty('uuid', key) === undefined) {
				delete scripts[key];
			}
		}

		return {
			metadata: {},
			project: {
				shadows: this.config.getKey('project/renderer/shadows'),
				shadowType: this.config.getKey('project/renderer/shadowType'),
				vr: this.config.getKey('project/vr'),
				physicallyCorrectLights: this.config.getKey(
					'project/renderer/physicallyCorrectLights'
				),
				toneMapping: this.config.getKey('project/renderer/toneMapping'),
				toneMappingExposure: this.config.getKey('project/renderer/toneMappingExposure'),
			},
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			scripts: this.scripts,
			history: this.history.toJSON(),
		};
	}

	// 通过uuid获取对象
	objectByUuid(uuid) {
		return this.scene.getObjectByProperty('uuid', uuid);
	}

	execute(cmd, optionalName) {
		this.history.execute(cmd, optionalName);
	}

	undo() {
		this.history.undo();
	}

	redo() {
		this.history.redo();
	}
}
export { Editor };
