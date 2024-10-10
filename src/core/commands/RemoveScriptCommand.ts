import {Object3D} from "three";
import { Command } from './Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param script javascript object
 * @constructor
 */
class RemoveScriptCommand extends Command {
	private object: Object3D;
	private script: any;
	private index: number = -1;

	constructor(object:Object3D, script) {
		super();

		this.type = 'RemoveScriptCommand';
		this.name = 'Remove Script';

		this.object = object;
		this.script = script;
		if (this.object && this.script) {
			this.index = window.editor.scripts[this.object.uuid].findIndex((i) => i.name === this.script.name);
		}
	}

	execute() {
		if (window.editor.scripts[ this.object.uuid ] === undefined) return;

		if (this.index !== -1) {
			window.editor.scripts[this.object.uuid].splice( this.index, 1 );
		}

		useDispatchSignal("scriptRemoved",this.script);
	}

	undo() {
		if (window.editor.scripts[ this.object.uuid ] === undefined) {
			window.editor.scripts[ this.object.uuid ] = [];
		}

		window.editor.scripts[this.object.uuid].splice(this.index, 0, this.script);

		useDispatchSignal("scriptAdded",this.script);
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.script = this.script;
		output.index = this.index;

		return output;
	}

	fromJSON(json) {
		super.fromJSON( json );

		this.script = json.script;
		this.index = json.index;
		this.object = window.editor.objectByUuid( json.objectUuid );
	}
}

export { RemoveScriptCommand };
