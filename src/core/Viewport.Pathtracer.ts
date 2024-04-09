import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import {
	PathTracingSceneGenerator,
	PathTracingRenderer,
	PhysicalPathTracingMaterial,
	ProceduralEquirectTexture,
} from 'three-gpu-pathtracer';

function buildColorTexture(color) {
	const texture = new ProceduralEquirectTexture( 4, 4 );
	texture.generationCallback = (_polar, _uv, _coord, target) => {
		target.copy(color);
	};

	texture.update();

	return texture;
}

class ViewportPathtracer{
	private readonly renderer: THREE.WebGLRenderer;

	generator:PathTracingSceneGenerator = null;
	pathtracer:PathTracingRenderer = null;
	quad:FullScreenQuad | null = null;
	hdr = null;

	constructor(renderer:THREE.WebGLRenderer) {
		this.renderer = renderer;
	}

	init(scene, camera) {
		if (this.pathtracer === null) {
			this.generator = new PathTracingSceneGenerator();

			this.pathtracer = new PathTracingRenderer(this.renderer);
			this.pathtracer.setSize( this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight );
			this.pathtracer.alpha = true;
			this.pathtracer.camera = camera;
			this.pathtracer.material = new PhysicalPathTracingMaterial();
			this.pathtracer.tiles.set( 3, 4 );

			this.quad = new FullScreenQuad(new THREE.MeshBasicMaterial( {
				map: this.pathtracer.target.texture,
				blending: THREE.CustomBlending
			}));
		}

		this.pathtracer.reset();

		const { bvh, textures, materials, lights } = this.generator.generate(scene);

		const ptGeometry = bvh.geometry;
		const ptMaterial = this.pathtracer.material;

		ptMaterial.bvh.updateFrom( bvh );
		ptMaterial.attributesArray.updateFrom(
			ptGeometry.attributes.normal,
			ptGeometry.attributes.tangent,
			ptGeometry.attributes.uv,
			ptGeometry.attributes.color,
		);
		ptMaterial.materialIndexAttribute.updateFrom( ptGeometry.attributes.materialIndex );
		ptMaterial.textures.setTextures(this.renderer, 2048, 2048, textures );
		ptMaterial.materials.updateFrom( materials, textures );
		ptMaterial.lights.updateFrom( lights );
		ptMaterial.filterGlossyFactor = 0.5;

		this.setBackground( scene.background, scene.backgroundBlurriness );
		this.setEnvironment( scene.environment );
	}

	setSize(width:number, height:number) {
		if (this.pathtracer === null) return;

		this.pathtracer.setSize( width, height );
		this.pathtracer.reset();
	}

	setBackground(background, blurriness) {
		if (this.pathtracer === null) return;

		const ptMaterial = this.pathtracer.material;

		if (background) {
			if (background.isTexture) {
				ptMaterial.backgroundMap = background;
				ptMaterial.backgroundBlur = blurriness;
			} else if (background.isColor) {
				ptMaterial.backgroundMap = buildColorTexture( background );
				ptMaterial.backgroundBlur = 0;
			}
		} else {
			ptMaterial.backgroundMap = buildColorTexture( new THREE.Color( 0 ) );
			ptMaterial.backgroundBlur = 0;
		}

		this.pathtracer.reset();
	}

	setEnvironment(environment) {
		if (this.pathtracer === null) return;

		const ptMaterial = this.pathtracer.material;

		if ( environment && environment.isDataTexture ) {
			// Avoid calling envMapInfo() with the same hdr
			if ( environment !== this.hdr ) {
				ptMaterial.envMapInfo.updateFrom( environment );
				this.hdr = environment;
			}
		} else {
			ptMaterial.envMapInfo.updateFrom( buildColorTexture( new THREE.Color( 0 ) ) );
		}

		this.pathtracer.reset();
	}

	update() {
		if (this.pathtracer === null ) return;

		this.pathtracer.update();

		if (this.pathtracer.samples >= 1 ) {
			this.renderer.autoClear = false;
			this.quad?.render(this.renderer);
			this.renderer.autoClear = true;
		}
	}

	reset() {
		if (this.pathtracer === null) return;

		this.pathtracer.reset();
	}
}

export { ViewportPathtracer };
