import { Object3D } from 'three';
import { Command } from '../Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param script javascript object
 * @param attributeName string
 * @param newValue string, object
 * @constructor
 */
class SetScriptValueCommand extends Command {
	private object: Object3D;
	private script: IScript.IStruct;
	private attributeName: string;
	private oldValue: any;
	private newValue: string;

	constructor(object:Object3D, script:IScript.IStruct, attributeName:string, newValue:string) {
		super();

		this.type = 'SetScriptValueCommand';
		this.name = `Set Script.${attributeName}`;
		this.updatable = true;

		this.object = object;
		this.script = script;

		this.attributeName = attributeName;
		this.oldValue = ( script !== undefined ) ? script[ this.attributeName ] : undefined;
		this.newValue = newValue;
	}

	execute() {
		this.script[this.attributeName] = this.newValue;

		useDispatchSignal("scriptChanged");
	}

	undo() {
		this.script[ this.attributeName ] = this.oldValue;

		useDispatchSignal("scriptChanged");
	}

	update(cmd) {
		this.newValue = cmd.newValue;
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.index = window.editor.scripts[this.object.uuid].indexOf(this.script);
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;
	}

	fromJSON(json) {
		super.fromJSON(json);

		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.attributeName = json.attributeName;
		this.object = window.editor.objectByUuid(json.objectUuid);
		this.script = window.editor.scripts[json.objectUuid][json.index];
	}
}

export { SetScriptValueCommand };
