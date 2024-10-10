import * as THREE from "three";
import {LineMesh} from "@/core/objects/LineMesh";

export const BlueGradientMaterial = (material) => new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x0f9bff) },
        bottomColor: { value: new THREE.Color(0xabdcff) },
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform vec3 topColor;
    uniform vec3 bottomColor;

    void main() {
        float percent = (vUv.y + 0.5) / 2.0; // 计算当前像素点在立方体高度上的百分比
        vec3 color = mix(bottomColor, topColor, percent); // 根据百分比进行颜色插值
        ${material.map !== null ? '' : ''}
        gl_FragColor = vec4(color, min(vUv.y + 0.4,0.15)); // 设置当前像素点的颜色
    }
    `,
    wireframe: false,
    transparent: true,
    side: THREE.DoubleSide,
})

export const BlueTone =  (mesh: THREE.Mesh) => new LineMesh(mesh.geometry, BlueGradientMaterial(mesh.material), 0x0f9bff).proxyMesh;