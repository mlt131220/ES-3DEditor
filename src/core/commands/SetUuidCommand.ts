import { Command } from './Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param newUuid string
 * @constructor
 */
class SetUuidCommand extends Command {
	public object;
	public oldUuid;
	public newUuid;

	constructor(object, newUuid ) {
		super();

		this.type = 'SetUuidCommand';
		this.name = 'Update UUID';

		this.object = object;

		this.oldUuid = ( object !== undefined ) ? object.uuid : undefined;
		this.newUuid = newUuid;

	}

	execute() {
		this.object.uuid = this.newUuid;
		useDispatchSignal("objectChanged",this.object);
		useDispatchSignal("sceneGraphChanged");
	}

	undo() {
		this.object.uuid = this.oldUuid;
		useDispatchSignal("objectChanged",this.object);
		useDispatchSignal("sceneGraphChanged");
	}

	toJSON() {
		const output = super.toJSON();
		output.oldUuid = this.oldUuid;
		output.newUuid = this.newUuid;

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.oldUuid = json.oldUuid;
		this.newUuid = json.newUuid;
		this.object = window.editor.objectByUuid( json.oldUuid );

		if ( this.object === undefined ) {

			this.object = window.editor.objectByUuid( json.newUuid );

		}

	}

}

export { SetUuidCommand };
