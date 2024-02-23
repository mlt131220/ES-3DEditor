import * as THREE from 'three';
import { Loader } from "./Loader";

export class Resource{
    private loader: Loader;

    constructor() {
        this.loader = new Loader();
    }

    loadURLTexture(url: string, onload: (tex: THREE.Texture) => void = ()=>{}) {
        const extension = url.split(".").pop()?.toLowerCase() as string;
        return this.loader.loadUrlTexture(extension, url, onload);
    }
}