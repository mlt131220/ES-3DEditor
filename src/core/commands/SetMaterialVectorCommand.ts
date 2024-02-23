import { Command } from '../Command';
import { useDispatchSignal } from "@/hooks/useSignal";

class SetMaterialVectorCommand extends Command {
	public object;
	private material;
	private oldValue;
	private newValue;
	private attributeName;

	constructor(object, attributeName, newValue, materialSlot) {
		super();

		this.type = 'SetMaterialColorCommand';
		this.name = `Set Material.${attributeName}`;
		this.updatable = true;

		this.object = object;
		this.material = window.editor.getObjectMaterial( object, materialSlot );

		this.oldValue = ( this.material !== undefined ) ? this.material[ attributeName ].toArray() : undefined;
		this.newValue = newValue;

		this.attributeName = attributeName;
	}

	execute() {
		this.material[ this.attributeName ].fromArray( this.newValue );
		useDispatchSignal("materialChanged",this.material)
	}

	undo() {
		this.material[ this.attributeName ].fromArray( this.oldValue );
		useDispatchSignal("materialChanged",this.material)
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

export { SetMaterialVectorCommand };
