import {Storage} from "@/core/Storage";

class Config {
	protected storage: Storage;
	public config: { [s: string]: any };

	constructor(storage: Storage) {
		this.storage = storage;

		this.config = {
			//历史记录功能是否启用
			history: false,
			// 项目运行是否启用xr
			xr: false,
			// 渲染器相关配置
			renderer: {
				antialias: true,
				shadows: true,
				shadowType: 1, // PCF
				physicallyCorrectLights: false,
				toneMapping: 0, // NoToneMapping
				toneMappingExposure: 1,
			},
			// 后处理
			effect:{
				enabled:true,
				// 描边线
				outline:{
					enabled:true,
					// 边缘的强度，值越高边框范围越大
					edgeStrength: Number(3.0),
					// 发光强度
					edgeGlow: Number(0.2),
					// 边缘浓度
					edgeThickness: Number(1.0),
					// 闪烁频率，值越大频率越低
					pulsePeriod: Number(0.0),
					// 禁用纹理以获得纯线的效果
					usePatternTexture: false,
					// 可见边缘的颜色
					visibleEdgeColor:"#ffee00",
					// 不可见边缘的颜色
					hiddenEdgeColor:"#ff6a00"
				},
				// 抗锯齿
				fxaa:{
					enabled:true,
				}
			},
			// 快捷键相关配置
			shortcuts: {
				translate: 'w',
				rotate: 'e',
				scale: 'r',
				undo: 'z',
				focus: 'f',
			},
			// cad图纸功能相关配置
			cad: {}
		};

		for (let key of Object.keys(this.config)) {
			this.storage.getConfigItem(key).then(_value => {
				if(_value === null){
					this.storage.setConfigItem(key, this.config[key])
				}else{
					this.config[key] = _value;
				}
			}).catch(() => {
				this.storage.setConfigItem(key, this.config[key])
			})
		}
	}

	getKey(key) {
		return this.config[key];
	}

	setKey(...args) {
		// key, value, key, value ...
		for (let i = 0, l = args.length; i < l; i += 2) {
			this.config[args[i]] = args[i + 1];
			this.storage.setConfigItem(args[i], args[i + 1])
		}
	}

	/**
	 * 获取渲染器配置
	 * @param {string} key
	 */
	getRendererItem(key: string) {
		return this.config.renderer[key];
	}

	/**
	 * 设置渲染器配置
	 * @param {string} key
	 * @param {any} value
	 */
	setRendererItem(key: string,value:any) {
		this.config.renderer[key] = value;
		return this.storage.setConfigItem("renderer", this.config.renderer)
	}

	/**
	 * 获取后处理配置
	 * @param {string} key
	 */
	getEffectItem(key: string) {
		return this.config.effect[key];
	}

	/**
	 * 设置后处理配置
	 * @param {string} key
	 * @param {any} value
	 */
	setEffectItem(key: string,value:any) {
		this.config.effect[key] = value;
		return this.storage.setConfigItem("effect", this.config.effect)
	}

	/**
	 * 获取快捷键配置
	 * @param {string} key
	 */
	getShortcutItem(key: string) {
		return this.config.shortcuts[key];
	}

	/**
	 * 设置快捷键
	 * @param {string} key
	 * @param {any} value
	 */
	setShortcutItem(key: string,value:any) {
		this.config.shortcuts[key] = value;
		return this.storage.setConfigItem("shortcuts", this.config.shortcuts)
	}

	clear() {
		this.storage.dbs.configDB.clear();
	}
}

export {Config};
