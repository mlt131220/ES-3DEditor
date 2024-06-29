import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';

class ViewportPathTracer{
	private readonly renderer: THREE.WebGLRenderer;
	pathTracer:WebGLPathTracer | null = null;

	constructor(renderer:THREE.WebGLRenderer) {
		this.renderer = renderer;
	}

	init(scene:THREE.Scene, camera:THREE.Camera) {
		if (this.pathTracer === null ) {
			this.pathTracer = new WebGLPathTracer(this.renderer);
			this.pathTracer.filterGlossyFactor = 0.5;
		}

		this.pathTracer.setScene(scene, camera);
	}

	setSize() {
		if (this.pathTracer === null) return;

		// 路径跟踪器大小会根据画布自动更新
		this.pathTracer.updateCamera();
	}

	setBackground() {
		if (this.pathTracer === null) return;

		// 根据初始化的场景字段更新环境设置
		this.pathTracer.updateEnvironment();
	}

	setEnvironment() {
		if (this.pathTracer === null) return;

		this.pathTracer.updateEnvironment();
	}

	updateMaterials() {
		if (this.pathTracer === null) return;

		this.pathTracer.updateMaterials();
	}

	update() {
		if (this.pathTracer === null) return;

		this.pathTracer.renderSample();
	}

	reset() {
		if (this.pathTracer === null) return;

		this.pathTracer.updateCamera();
	}

	getSamples() {
		if (this.pathTracer === null) return;

		return this.pathTracer.samples;
	}
}

export { ViewportPathTracer };
