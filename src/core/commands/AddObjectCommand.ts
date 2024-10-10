import { Command } from './Command';
import { ObjectLoader } from 'three';

/**
 * @param object THREE.Object3D
 * @constructor
 */
class AddObjectCommand extends Command {
	public object;

	constructor( object ) {
		super();

		this.type = 'AddObjectCommand';
		this.object = object;
		if ( object !== undefined ) {
			this.name = `Add Object: ${object.name}`;
		}
	}

	execute() {
		window.editor.addObject(this.object);
		window.editor.select(this.object);
	}

	undo() {
		window.editor.removeObject( this.object );
		window.editor.deselect();
	}

	toJSON() {
		const output = super.toJSON();
		output.object = this.object.toJSON();
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );
		this.object = window.editor.objectByUuid( json.object.object.uuid );

		if ( this.object === undefined ) {
			const loader = new ObjectLoader();
			this.object = loader.parse( json.object );
		}
	}
}

export { AddObjectCommand };
