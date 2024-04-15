/**
 * @constructor
 */
class Command {
	protected id:number;
	protected inMemory:boolean;
	public updatable:boolean;
	protected type:string;
	protected name:string;

	constructor() {
		this.id = - 1;
		this.inMemory = false;
		this.updatable = false;
		this.type = '';
		this.name = '';
	}

	toJSON() {
		const output:any = {};
		output.type = this.type;
		output.id = this.id;
		output.name = this.name;
		return output;
	}

	fromJSON( json ) {
		this.inMemory = true;
		this.type = json.type;
		this.id = json.id;
		this.name = json.name;
	}
}

export { Command };
