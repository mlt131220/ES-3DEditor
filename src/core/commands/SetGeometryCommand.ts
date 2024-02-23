import { Command } from '../Command';
import { ObjectLoader,BufferGeometry,Mesh, InstancedBufferGeometry} from 'three';
import {useDispatchSignal} from "@/hooks/useSignal";

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param newGeometry THREE.Geometry
 * @constructor
 */
class SetGeometryCommand extends Command {
	object:Mesh;
	private oldGeometry: BufferGeometry | InstancedBufferGeometry | undefined;
	private newGeometry: BufferGeometry | InstancedBufferGeometry

	constructor(object:Mesh, newGeometry:BufferGeometry) {
		super();

		this.type = 'SetGeometryCommand';
		this.name = 'Set Geometry';
		this.updatable = true;

		this.object = object;
		this.oldGeometry = ( object !== undefined ) ? object.geometry : undefined;
		this.newGeometry = newGeometry;

	}

	execute() {
		this.object.geometry.dispose();
		this.object.geometry = this.newGeometry;
		this.object.geometry.computeBoundingSphere();

		useDispatchSignal("geometryChanged",this.object);
		useDispatchSignal("sceneGraphChanged");
	}

	undo() {
		this.object.geometry.dispose();
		this.oldGeometry && (this.object.geometry = this.oldGeometry);
		this.object.geometry.computeBoundingSphere();

		useDispatchSignal("geometryChanged",this.object);
		useDispatchSignal("sceneGraphChanged");
	}

	update(cmd: { newGeometry: BufferGeometry | InstancedBufferGeometry; }) {
		this.newGeometry = cmd.newGeometry;
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.oldGeometry = this.object.geometry.toJSON();
		output.newGeometry = this.newGeometry.toJSON();

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.object = window.editor.objectByUuid( json.objectUuid );
		this.oldGeometry = parseGeometry( json.oldGeometry );
		this.newGeometry = parseGeometry( json.newGeometry );

		function parseGeometry(data) {
			const loader = new ObjectLoader();
			return loader.parseGeometries( [ data ] )[ data.uuid ];
		}
	}
}

export { SetGeometryCommand };
