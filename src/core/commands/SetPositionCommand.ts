import { useDispatchSignal } from '@/hooks/useSignal';
import { Command } from '../Command';
import { Vector3 } from 'three';

/**
 * @param object THREE.Object3D
 * @param newPosition THREE.Vector3
 * @param optionalOldPosition THREE.Vector3
 * @constructor
 */
class SetPositionCommand extends Command {
	public object;
	public oldPosition;
	public newPosition;

	constructor(object, newPosition, optionalOldPosition? ) {
		super();

		this.type = 'SetPositionCommand';
		this.name = 'Set Position';
		this.updatable = true;
		this.object = object;
		if ( object !== undefined && newPosition !== undefined ) {
			this.oldPosition = object.position.clone();
			this.newPosition = newPosition.clone();
		}

		if ( optionalOldPosition !== undefined ) {
			this.oldPosition = optionalOldPosition.clone();
		}
	}

	execute() {
		this.object.position.copy( this.newPosition );
		this.object.updateMatrixWorld( true );
		useDispatchSignal("objectChanged",this.object)
	}

	undo() {
		this.object.position.copy( this.oldPosition );
		this.object.updateMatrixWorld( true );
		useDispatchSignal("objectChanged",this.object);
	}

	update( command ) {
		this.newPosition.copy( command.newPosition );
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.oldPosition = this.oldPosition.toArray();
		output.newPosition = this.newPosition.toArray();

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
		this.object = window.editor.objectByUuid( json.objectUuid );
		this.oldPosition = new Vector3().fromArray( json.oldPosition );
		this.newPosition = new Vector3().fromArray( json.newPosition );
	}
}

export { SetPositionCommand };
