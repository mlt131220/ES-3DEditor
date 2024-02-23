class Session {
	protected name;
	protected session;

	constructor() {
		this.name = 'ES-Editor';

		this.session = {};
		window.sessionStorage[this.name] = JSON.stringify(this.session);
	}

	getKey(key) {
		return this.session[key];
	}

	setKey() {
		// key, value, key, value ...
		for (let i = 0, l = arguments.length; i < l; i += 2) {
			this.session[arguments[i]] = arguments[i + 1];
		}
		window.sessionStorage[this.name] = JSON.stringify(this.session);
		//@ts-ignore
		console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']','Saved config to SessionStorage.');
	}
	
	clear() {
		delete window.sessionStorage[this.name];
	}
}

export { Session };
