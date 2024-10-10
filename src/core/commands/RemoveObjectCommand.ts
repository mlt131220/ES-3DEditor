import { Command } from './Command';
import { ObjectLoader } from 'three';

/**
 * @param object THREE.Object3D
 * @constructor
 */
class RemoveObjectCommand extends Command {
	public object;
	public parent;
	public index;

	constructor( object ) {
		super();

		this.type = 'RemoveObjectCommand';
		this.name = 'Remove Object';

		this.object = object;
		this.parent = ( object !== undefined ) ? object.parent : undefined;
		if ( this.parent !== undefined ) {
			this.index = this.parent.children.indexOf( this.object );
		}
	}

	execute() {
		window.editor.removeObject( this.object );
		window.editor.deselect();
	}

	undo() {
		window.editor.addObject( this.object, this.parent, this.index );
		window.editor.select( this.object );
	}

	toJSON() {
		const output = super.toJSON();
		output.object = this.object.toJSON();
		output.index = this.index;
		output.parentUuid = this.parent.uuid;

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.parent = window.editor.objectByUuid( json.parentUuid );
		if ( this.parent === undefined ) {
			this.parent = window.editor.scene;
		}

		this.index = json.index;
		this.object = window.editor.objectByUuid( json.object.object.uuid );

		if ( this.object === undefined ) {
			const loader = new ObjectLoader();
			this.object = loader.parse( json.object );
		}
	}
}

export { RemoveObjectCommand };
