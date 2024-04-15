import {Object3D} from "three";
import { Command } from '../Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param script javascript object
 * @constructor
 */
class AddScriptCommand extends Command {
	private object: Object3D;
	private script: any;

	constructor(object:Object3D, script) {
		super();

		this.type = 'AddScriptCommand';
		this.name = 'Add Script';

		this.object = object;
		this.script = script;
	}

	execute() {
		if ( window.editor.scripts[this.object.uuid] === undefined) {
			window.editor.scripts[this.object.uuid] = [];
		}

		window.editor.scripts[this.object.uuid].push(this.script);

		useDispatchSignal("scriptAdded", this.script);
	}

	undo() {
		if ( window.editor.scripts[ this.object.uuid ] === undefined ) return;

		const index = window.editor.scripts[ this.object.uuid ].indexOf( this.script );

		if ( index !== - 1 ) {
			window.editor.scripts[ this.object.uuid ].splice( index, 1 );
		}

		useDispatchSignal("scriptRemoved", this.script);
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.script = this.script;

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.script = json.script;
		this.object = window.editor.objectByUuid( json.objectUuid );
	}
}

export { AddScriptCommand };
