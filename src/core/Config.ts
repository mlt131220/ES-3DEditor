class Config {
	protected name:string;
	public storage:{[s:string]:any};

	constructor() {
		this.name = 'ES-Editor';

		this.storage = {
			selected:"",//当前选中的对象

			'project/xr': false,  // 项目运行是否启用vr按钮

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

			"cad/options":{}
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
		//console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']',`已保存 ${args[0]} 配置至 LocalStorage.`);
	}
	clear() {
		delete window.localStorage[this.name];
	}
}

export { Config };
