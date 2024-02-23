import { Command } from '../Command';
import { ObjectLoader } from 'three';
import {useDispatchSignal} from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param newMaterial THREE.Material
 * @constructor
 */
class SetMaterialCommand extends Command {
	private object;
	private materialSlot;
	private oldMaterial;
	private newMaterial;

	constructor(object, newMaterial, materialSlot? ) {
		super();

		this.type = 'SetMaterialCommand';
		this.name = 'New Material';

		this.object = object;
		this.materialSlot = materialSlot;

		this.oldMaterial = window.editor.getObjectMaterial( object, materialSlot );
		this.newMaterial = newMaterial;
	}

	execute() {
		window.editor.setObjectMaterial( this.object, this.materialSlot, this.newMaterial );
		useDispatchSignal("materialChanged",this.newMaterial);
	}

	undo() {
		window.editor.setObjectMaterial( this.object, this.materialSlot, this.oldMaterial );
		useDispatchSignal("materialChanged",this.oldMaterial);
	}

	toJSON() {
		const output = super.toJSON();
		output.objectUuid = this.object.uuid;
		output.oldMaterial = this.oldMaterial.toJSON();
		output.newMaterial = this.newMaterial.toJSON();
		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.object = window.editor.objectByUuid( json.objectUuid );
		this.oldMaterial = parseMaterial( json.oldMaterial );
		this.newMaterial = parseMaterial( json.newMaterial );

		function parseMaterial( json ) {
			const loader = new ObjectLoader();
			//@ts-ignore
			const images = loader.parseImages( json.images );
			const textures = loader.parseTextures( json.textures, images );
			const materials = loader.parseMaterials( [ json ], textures );
			return materials[ json.uuid ];
		}
	}
}

export { SetMaterialCommand };
