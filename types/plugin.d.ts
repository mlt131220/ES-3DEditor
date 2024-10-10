declare namespace IPlugin{
    interface Item {
        // 插件名称
        name:string;
        // 插件icon
        icon:string;
        // 插件ems js地址
        src?:string;
    }

    // 内置glTF处理器优化参数
    interface GLTFHandlerOptimizeModel {
        instance: boolean;
        instanceMin: number;
        meshoptLevel: 'medium' | 'high';
        palette: boolean;
        paletteMin: number;
        simplify: boolean;
        simplifyError: number;
        simplifyRatio: number;
        simplifyLockBorder: boolean;
        prune: boolean;
        pruneAttributes: boolean;
        pruneLeaves: boolean;
        pruneSolidTextures: boolean;
        compress: 'draco' | 'meshopt' | 'quantize' | "false";
        textureCompress: 'webp' | 'avif' | 'auto' | "none"; // 暂不支持 'ktx2'
        textureSize: number;
        flatten: boolean;
        join: boolean;
        weld: boolean;
    }
}