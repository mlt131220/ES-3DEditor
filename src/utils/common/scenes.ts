import {Vector2, Vector3, BufferGeometry, Object3D} from "three";

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

// 屏幕坐标转世界坐标
export function screenToWorld(x, y) {
	const vector = new Vector3();
	vector.set(
		(x / window.innerWidth) * 2 - 1,
		-(y / window.innerHeight) * 2 + 1,
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