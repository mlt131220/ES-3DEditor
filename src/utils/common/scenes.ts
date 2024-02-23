import {Vector3} from "three";

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