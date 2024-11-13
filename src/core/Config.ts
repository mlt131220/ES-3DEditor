import {Storage} from "@/core/Storage";

class Config {
	protected storage: Storage;
	public config: { [s: string]: any };

	constructor(storage: Storage) {
		this.storage = storage;

		this.config = {
			// 历史记录功能是否启用
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
				Outline:{
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
				FXAA:{
					enabled:true,
				},
				// 辉光
				UnrealBloom:{
					enabled:false,
					// 光晕阈值，值越小，效果越明显
					threshold: 0,
					// 光晕强度
					strength: 1,
					// 光晕半径
					radius: 0
				},
				// 背景虚化
				Bokeh:{
					enabled:false,
					// 焦距，调整远近，对焦时才会清晰
					focus: 500.0,
					// 孔径，类似相机孔径调节
					aperture: 0.00005,
					// 最大模糊程度
					maxblur: 0.01
				},
				// 像素风
				Pixelate: {
					enabled:false,
					// 像素大小
					pixelSize: 6,
					// 法向边缘强度
					normalEdgeStrength: 0.3,
					// 深度边缘强度
					depthEdgeStrength: 0.4,
				},
				// 半色调
				Halftone:{
					enabled:false,
					// 形状：点，椭圆，线，正方形
					shape: 1,
					// 半径
					radius: 4,
					// R色旋转
					rotateR: Math.PI / 12,
					// G色旋转
					rotateG: Math.PI / 12 * 2,
					// B色旋转
					rotateB: Math.PI / 12 * 3,
					// 分散度
					scatter: 0,
					// 混合度
					blending: 1,
					// 混合模式：线性，相乘，相加，明亮，昏暗
					blendingMode: 1,
					// 灰度
					greyscale: false,
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
					let newVal = _value;
					// 有可能会在代码开发过程中增加新的配置项
					if(this.config[key] && typeof this.config[key] === "object"){
						newVal = Object.assign({},this.config[key],_value);
					}
					this.config[key] = newVal;

					if(newVal !== _value){
						this.storage.setConfigItem(key, newVal)
					}
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
