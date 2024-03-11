import * as THREE from 'three';
import { TeapotGeometry } from '@/core/geometries/TeapotGeometry.js';
import { AddObjectCommand } from '@/core/commands/AddObjectCommand';

export class MenubarAdd {
	constructor() {}

	// 调用对应方法
	init(key: string, ...args: any[]) {
		const object3D = this[key]();

		if(args.length>0){
			if(args[0].position){
				object3D.position.copy(args[0].position);
			}
		}

		window.editor.execute(new AddObjectCommand(object3D));
	}

	/*******************************************Object3D********************************************************/

	//组
	group() {
		const group = new THREE.Group();
		group.name = 'Group';

		return group;
	}

	//正方体
	box() {
		const geometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Box';

		return mesh;
	}

	//胶囊
	capsule() {
		const geometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
		const material = new THREE.MeshStandardMaterial();
		const mesh = new THREE.Mesh(geometry, material);
		mesh.name = 'Capsule';

		return mesh;
	}

	//圆
	circle() {
		const geometry = new THREE.CircleGeometry(1, 8, 0, Math.PI * 2);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Circle';

		return mesh;
	}

	//圆柱体
	cylinder() {
		const geometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false, 0, Math.PI * 2);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Cylinder';

		return mesh;
	}

	//十二面体
	dodecahedron() {
		const geometry = new THREE.DodecahedronGeometry(1, 0);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Dodecahedron';

		return mesh;
	}

	//二十面体
	icosahedron() {
		const geometry = new THREE.IcosahedronGeometry(1, 0);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Icosahedron';

		return mesh;
	}

	//双锥
    doubleCone() {
		const geometry = new THREE.LatheGeometry();
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })
		);
		mesh.name = 'Lathe';

		return mesh;
	}

	//八面体
	octahedron() {
		const geometry = new THREE.OctahedronGeometry(1, 0);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Octahedron';

		return mesh;
	}

	//平面
	plane() {
		const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
		const material = new THREE.MeshStandardMaterial();
		const mesh = new THREE.Mesh(geometry, material);
		mesh.name = 'Plane';

		return mesh;
	}

	//环
	ring() {
		const geometry = new THREE.RingGeometry(0.5, 1, 8, 1, 0, Math.PI * 2);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Ring';

		return mesh;
	}

	//球体
	sphere() {
		const geometry = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Sphere';

		return mesh;
	}

	//精灵
	sprite() {
		const sprite = new THREE.Sprite(new THREE.SpriteMaterial());
		sprite.name = 'Sprite';

		return	sprite;
	}

	//四面体
	tetrahedron() {
		const geometry = new THREE.TetrahedronGeometry(1, 0);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Tetrahedron';

		return mesh;
	}

	//圆环体
	torus() {
		const geometry = new THREE.TorusGeometry(1, 0.4, 12, 48, Math.PI * 2);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Torus';

		return mesh;
	}

	//环面扭结体
	torusKnot() {
		const geometry = new THREE.TorusKnotGeometry(1, 0.4, 64, 8, 2, 3);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'TorusKnot';

		return mesh;
	}

	//管
	tube() {
		const path = new THREE.CatmullRomCurve3([
			new THREE.Vector3(2, 2, -2),
			new THREE.Vector3(2, -2, -0.6666666666666667),
			new THREE.Vector3(-2, -2, 0.6666666666666667),
			new THREE.Vector3(-2, 2, 2),
		]);

		const geometry = new THREE.TubeGeometry(path, 64, 1, 8, false);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.name = 'Tube';

		return mesh;
	}

	//茶壶
	teapot() {
		let size = 2;
		let segments = 10;
		let bottom = true;
		let lid = true;
		let body = true;
		let fitLid = false;
		let blinn = true;

		let material = new THREE.MeshStandardMaterial();

		let geometry = new TeapotGeometry(size, segments, bottom, lid, body, fitLid, blinn);
		let mesh = new THREE.Mesh(geometry, material);
		mesh.name = 'Teapot';

		return mesh;
	}

	/*******************************************灯光********************************************************/

	//环境光
	ambientLight() {
		const color = 0xffffff;

		const light = new THREE.AmbientLight(color);
		light.name = 'AmbientLight';

		return light;
	}

	//平行光
	directionalLight() {
		const color = 0xffffff;
		const intensity = 1;

		const light = new THREE.DirectionalLight(color, intensity);
		light.name = 'DirectionalLight';
		light.target.name = 'DirectionalLight Target';

		light.position.set(5, 10, 7.5);

		return light;
	}

	//半球光
	hemisphereLight() {
		const skyColor = 0x00aaff;
		const groundColor = 0xffaa00;
		const intensity = 1;

		const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
		light.name = 'HemisphereLight';

		light.position.set(0, 10, 0);

		return light;
	}

	//点光源
	pointLight() {
		const color = 0xffffff;
		const intensity = 1;
		const distance = 0;

		const light = new THREE.PointLight(color, intensity, distance);
		light.name = 'PointLight';

		return light;
	}

	//聚光灯
	spotlight() {
		const color = 0xffffff;
		const intensity = 1;
		const distance = 0;
		const angle = Math.PI * 0.1;
		const penumbra = 0;

		const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
		light.name = 'SpotLight';
		light.target.name = 'SpotLight Target';

		light.position.set(5, 10, 7.5);

		return light;
	}

	/*******************************************相机********************************************************/

	//正交相机
	orthographicCamera() {
		const aspect = window.editor.camera.aspect;
		const camera = new THREE.OrthographicCamera(-aspect, aspect);
		camera.name = 'OrthographicCamera';

		return camera;
	}

	//透视相机
	perspectiveCamera() {
		const camera = new THREE.PerspectiveCamera();
		camera.name = 'PerspectiveCamera';

		return camera;
	}
}
