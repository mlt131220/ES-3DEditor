import localforage from 'localforage';

export class Storage {
    private dbs: { modelsDB: LocalForage,otherDB:LocalForage };

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
}