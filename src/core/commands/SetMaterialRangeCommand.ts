import { Command } from './Command';
import { useDispatchSignal } from "@/hooks/useSignal";

/**
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newMinValue number
 * @param newMaxValue number
 * @constructor
 */
class SetMaterialRangeCommand extends Command {
	public object;
	public material;
	public oldRange;
	public newRange;
	public attributeName;

	constructor(object, attributeName, newMinValue, newMaxValue, materialSlot ) {
		super();

		this.type = 'SetMaterialRangeCommand';
		this.name = `Set Material.${attributeName}`;
		this.updatable = true;

		this.object = object;
		this.material = window.editor.getObjectMaterial( object, materialSlot );

		this.oldRange = ( this.material !== undefined && this.material[ attributeName ] !== undefined ) ? [ ...this.material[ attributeName ] ] : undefined;
		this.newRange = [ newMinValue, newMaxValue ];

		this.attributeName = attributeName;
	}

	execute() {
		this.material[ this.attributeName ] = [ ...this.newRange ];
		this.material.needsUpdate = true;

		useDispatchSignal("objectChanged",this.object);
		useDispatchSignal("materialChanged",this.material);
	}

	undo() {
		this.material[ this.attributeName ] = [ ...this.oldRange ];
		this.material.needsUpdate = true;

		useDispatchSignal("objectChanged",this.object);
		useDispatchSignal("materialChanged",this.material);
	}

	update( cmd ) {
		this.newRange = [ ...cmd.newRange ];
	}

	toJSON() {
		const output = super.toJSON();

		output.objectUuid = this.object.uuid;
		output.attributeName = this.attributeName;
		output.oldRange = [ ...this.oldRange ];
		output.newRange = [ ...this.newRange ];

		return output;
	}

	fromJSON( json ) {
		super.fromJSON( json );

		this.attributeName = json.attributeName;
		this.oldRange = [ ...json.oldRange ];
		this.newRange = [ ...json.newRange ];
		this.object = window.editor.objectByUuid( json.objectUuid );
	}
}

export { SetMaterialRangeCommand };
