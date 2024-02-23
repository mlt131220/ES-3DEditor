import { Command } from '../Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue integer representing a hex color value
 * @constructor
 */
class SetMaterialColorCommand extends Command {
	public object;
	public material;
	public oldValue;
	public newValue;
	public attributeName;

	constructor(object, attributeName, newValue, materialSlot ) {
		super();

		this.type = 'SetMaterialColorCommand';
		this.name = `Set Material.${attributeName}`;
		this.updatable = true;

		this.object = object;
		this.material = (this.object !== undefined) ? window.editor.getObjectMaterial(object, materialSlot) : undefined;

		this.oldValue = (this.material !== undefined) ? this.material[attributeName].getHex() : undefined;
		this.newValue = newValue;

		this.attributeName = attributeName;
	}

	execute() {
		this.material[ this.attributeName ].setHex( this.newValue );
		useDispatchSignal("materialChanged",this.material);
	}

	undo() {
		this.material[ this.attributeName ].setHex( this.oldValue );
		useDispatchSignal("materialChanged",this.material);
	}

	update( cmd ) {
		this.newValue = cmd.newValue;
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.object = window.editor.objectByUuid( json.objectUuid );
		this.attributeName = json.attributeName;
		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
	}
}

export { SetMaterialColorCommand };
