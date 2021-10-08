/**
 *Listener
 *
 * @interface Listener
 */
interface Listener {
    (message?: any): void
}

/**
 *Event
 *
 * @interface Event
 */
interface Event {
    name: string
    listener: Listener
}

/**
 * @Date 2021/10/08
 * @Author 二三
 * @Description 一个简单的事件发布订阅类
 * 
 * @export
 * @class Bus
 */
export default class Bus {
    private constructor() {
        //单例模式：保证不同开发人员实例化Bus类后，拿到的状态是同一个
        this._events = new Array<Event>();
    }

    private static instance: Bus
    /**
     * Bus
     *
     * @static
     * @returns {Bus}
     * @memberof Bus
     */
    static getInstance():Bus {
        this.instance = this.instance || new Bus();
        return this.instance;
    }

    private _events: Event[];

    /**
     * @param {string} name
     * @param {Listener} listener
     * @memberof Bus
     * @Description 订阅（监听事件）
     */
    add(name: string, listener: Listener): void {
        this._events.push({ name: name, listener: listener })
    }

    /**
     * @param {string} name
     * @param {*} [message]
     * @memberof Bus
     * @Description 发布（触发事件）
     */
    dispatch(name: string, message?: any): void {
        this._events.filter(event => event.name === name)
            .map(event => event.listener)
            .forEach(listener => listener(message))
    }

    /**
     * @param {string} name
     * @memberof Bus
     * @Description 移除订阅
     */
    remove(name: string):void {
        this._events = this._events.filter(event => event.name !== name);
    }
}