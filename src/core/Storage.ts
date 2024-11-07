import localforage from 'localforage';

export class Storage {
    public dbs: { modelsDB: LocalForage,otherDB:LocalForage,configDB:LocalForage };

    constructor() {
        this.dbs = this.initDB();
    }

    initDB(){
        return {
            modelsDB: localforage.createInstance({
                name: 'modelsDB',
            }),
            otherDB: localforage.createInstance({
                name: 'otherDB'
            }),
            configDB: localforage.createInstance({
                name: 'configDB'
            })
        }
    }

    setModel(key: string, value: any){
        this.dbs.modelsDB.setItem(key, value);
    }

    async getModel(key: string){
        return await this.dbs.modelsDB.getItem(key);
    }

    setOtherItem(key: string, value: any){
        this.dbs.otherDB.setItem(key, value);
    }

    async getOtherItem(key:string){
        return await this.dbs.otherDB.getItem(key);
    }

    setConfigItem(key: string, value: any){
        return this.dbs.configDB.setItem(key, value);
    }

    async getConfigItem(key:string){
        return await this.dbs.configDB.getItem(key);
    }
}