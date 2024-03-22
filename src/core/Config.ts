class Config {
	protected name:string;
	public storage:{[s:string]:any};

	constructor() {
		this.name = 'ES-Editor';

		this.storage = {
			language: 'zh',
			selected:"",//当前选中的对象

            // 'project/currentSceneType':"three", //当前场景类型 enum:three | cesium
			//
			// 'project/id':'',//场景id
			// 'project/title': '',//项目标题
			// 'project/introduction': '',//项目描述
			// 'project/version': 1,//项目版本
			'project/editable': false,  // 打包后的项目是否可编辑
			'project/vr': false,  // 项目运行是否启用vr按钮

			'project/renderer/antialias': true,
			'project/renderer/shadows': true,
			'project/renderer/shadowType': 1, // PCF
			'project/renderer/physicallyCorrectLights': false,
			'project/renderer/toneMapping': 0, // NoToneMapping
			'project/renderer/toneMappingExposure': 1,

			// 快捷键
			'settings/shortcuts/translate': 'w',
			'settings/shortcuts/rotate': 'e',
			'settings/shortcuts/scale': 'r',
			'settings/shortcuts/undo': 'z',
			'settings/shortcuts/focus': 'f',
			//历史记录
			'settings/history': false,

            /* Cesium 相关 */
            "cesium/token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyY2ZkOTRlZC1lZTQyLTQwNzQtODhlNC02MmQxODNiNTFlZWIiLCJpZCI6ODU5OTEsImlhdCI6MTY0NzQyNDc1OH0.P57wIrNyawYT680864HUGQ3XE3BM7XCmAQD-tj-C95U",
            "cesium/defaultMap":"Amap", //默认底图
            "cesium/defaultMapType":"satellite", //默认底图类型 satellite：影像图，vector：矢量图
            "cesium/markMap":true,//是否需要标记图
            "cesium/tiandituTk":"1f264db8cede7365b0b4c47df89b3b16",//天地图密匙
		};

		if (window.localStorage[this.name] === undefined) {
			window.localStorage[this.name] = JSON.stringify(this.storage);
		} else {
			const data = JSON.parse(window.localStorage[this.name]);
			for (const key in data) {
				this.storage[key] = data[key];
			}
		}
	}

	getKey(key) {
		return this.storage[key];
	}
	setKey(...args) {
		// key, value, key, value ...
		for (let i = 0, l = args.length; i < l; i += 2) {
			this.storage[args[i]] = args[i + 1];
		}
		window.localStorage[this.name] = JSON.stringify(this.storage);
		//@ts-ignore
		console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']',`已保存 ${args[0]} 配置至 LocalStorage.`);
	}
	clear() {
		delete window.localStorage[this.name];
	}
}

export { Config };
