import {Vector2, Vector3, BufferGeometry, Object3D,InstancedMesh,Mesh,Matrix4} from "three";

export interface IModel extends Object3D{
	metadata: Object;
}

export function getAnimations() {
	const animations: any = [];

	window.editor.scene.traverse(function (object) {
		animations.push(...object.animations);
	});

	return animations;
}

export function getMaterialName(material) {
	if (Array.isArray(material)) {
		const array:any = [];

		for (let i = 0; i < material.length; i++) {
			array.push(material[i].name);
		}

		return array.join(',');
	}

	return material.name;
}

export function getObjectType( object ) {
	if ( object.isScene ) return 'Scene';
	if ( object.isCamera ) return 'Camera';
	if ( object.isLight ) return 'Light';
	if ( object.isMesh ) return 'Mesh';
	if ( object.isLine ) return 'Line';
	if ( object.isPoints ) return 'Points';

	return 'Object3D';
}

/**
 * InstancedMesh 解出所有 mesh
 */
export function getMeshByInstancedMesh(instancedMesh:InstancedMesh){
	const meshes:Mesh[] = [];
	// if (instancedMesh.material === undefined) return meshes;

	const matrixWorld = instancedMesh.matrixWorld;
	const count = instancedMesh.count;

	for (let instanceId = 0; instanceId < count; instanceId++) {
		const _mesh = new Mesh();
		const _instanceLocalMatrix = new Matrix4();
		const _instanceWorldMatrix = new Matrix4();

		_mesh.geometry = instancedMesh.geometry;
		_mesh.material = instancedMesh.material;

		// 计算每个实例的世界矩阵
		instancedMesh.getMatrixAt(instanceId, _instanceLocalMatrix);

		_instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);

		// 网格表示这个单一实例
		_mesh.matrixWorld = _instanceWorldMatrix;

		meshes.push(_mesh);
	}

	return meshes;
}

/**
 * 获取当前选中模型 path
 */
export function getSelectedModelPath() {
	let pathArr:string[] = [];

	function getPath(obj) {
		if (obj.parent) {
			pathArr.unshift(obj.parent.name);
			getPath(obj.parent);
		}
	}

	getPath(window.editor.selected);

	return pathArr.join(' !! ');
}

export function getMousePosition(dom: HTMLElement, x: number, y: number) {
	const rect = dom.getBoundingClientRect();
	return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
}

// 屏幕坐标转世界坐标
export function screenToWorld(x:number, y:number) {
	const vector = new Vector3();
	vector.set(
		(x / window.viewer.container.offsetWidth) * 2 - 1,
		-(y / window.viewer.container.offsetHeight) * 2 + 1,
		0.5
	);
	vector.unproject(window.editor.camera);

	const dir = vector.sub(window.editor.camera.position).normalize();
	const distance = -window.editor.camera.position.z / dir.z;
	return window.editor.camera.position.clone().add(dir.multiplyScalar(distance));
}

export function reBufferGeometryUv(geometry:BufferGeometry) {
	const uv = geometry.attributes.uv;
	if(!uv) return;

	// 获取u和v的范围
	const box = {
		min: new Vector2(Infinity, Infinity),
		max: new Vector2(-Infinity, -Infinity),
	};
	for (let i = 0; i < uv.count; i++) {
		const u = uv.getX(i);
		const v = uv.getY(i);

		box.min.x = Math.min(box.min.x, u);
		box.min.y = Math.min(box.min.y, v);
		box.max.x = Math.max(box.max.x, u);
		box.max.y = Math.max(box.max.y, v);
	}

	// 计算偏移量和范围
	const offset = new Vector2(0 - box.min.x, 0 - box.min.y);
	const range = new Vector2(box.max.x - box.min.x, box.max.y - box.min.y);

	// 遍历顶点，修改uv
	for (let i = 0; i < uv.count; i++) {
		const u = uv.getX(i);
		const v = uv.getY(i);

		// 计算新的u和v
		const newU = (u + offset.x) / range.x;
		const newV = (v + offset.y) / range.y;

		// 写入新的uv
		uv.setXY(i, newU, newV);
	}

	// 通知three.js更新
	uv.needsUpdate = true;
}

/**
 * 判断是否是group,因为导入有可能存在被定义为Object3D类型的group
 */
export function isGroup(object3D){
	return (object3D.isGroup || object3D.children.length > 0)
}

export function setUserData(object:IModel, key:string, value:any) {
	// key按照.分割，设置到object的userData中
	const keys = key.split('.');
	let obj = object.userData;
	for (let i = 0; i < keys.length - 1; i++) {
		const k = keys[i];
		if (!obj[k]) {
			obj[k] = {};
		}
		obj = obj[k];
	}
	obj[keys[keys.length - 1]] = value;
}

export function setMetaData(object:IModel, key:string, value:any) {
	// key按照.分割，设置到object的metaData中
	const keys = key.split('.');
	let metadata = object.metadata;

	if (!metadata) {
		metadata = {};
		object.metadata = metadata;
	}

	for (let i = 0; i < keys.length - 1; i++) {
		const k = keys[i];
		if (!metadata[k]) {
			metadata[k] = {};
		}
		metadata = metadata[k];
	}
	metadata[keys[keys.length - 1]] = value;
}