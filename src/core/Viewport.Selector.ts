import {useDispatchSignal, useAddSignal} from '@/hooks/useSignal';
import { MeshLambertMaterial } from "three";

class Selector {
	public editor;
	public lastIsIFC = false; // 上一次选中的是否是IFC模型
	public lastIFCModelID = null; // 上一次选中的IFC模型ID
	private preselectMat = new MeshLambertMaterial({
		transparent: true,
		opacity: 0.6,
		color: 0xff88ff,
		depthTest: false,
	});

	constructor(editor) {
		this.editor = editor;

		// signals
		useAddSignal("intersectionsDetected",async (intersects) => {
			if(this.lastIFCModelID !== null){
				// 移除之前IFC模型的高亮部分
				this.editor.loader.ifcLoader.ifcManager.removeSubset(this.lastIFCModelID, this.preselectMat);
				this.lastIFCModelID = null;
			}

			if ( intersects.length > 0 ) {
				const object = intersects[0].object;

				// ---- 2023/8/10 添加IFC模型检测判断-----
				if(object.userData.isIFC){
					const index = intersects[0].faceIndex;
					const geometry = object.geometry;
					const ifc = this.editor.loader.ifcLoader.ifcManager;
					const id = ifc.getExpressId(geometry, index);

					this.lastIFCModelID = object.modelID;
					const props = await ifc.getItemProperties(this.lastIFCModelID, id,true);

					useDispatchSignal("IFCPropertiesVisible",true,props)
					this.lastIsIFC = true;

					// TODO 部件选中
					// 创建子集
					this.editor.loader.ifcLoader.ifcManager.createSubset({
						modelID: this.lastIFCModelID,
						ids: [id],
						material: this.preselectMat,
						scene: this.editor.scene,
						removePrevious: true,
					});

					return
				}

				if(this.lastIsIFC){
					useDispatchSignal("IFCPropertiesVisible",false)
					this.lastIsIFC = false;
				}

				if ( object.userData.object !== undefined ) {
					// helper
					this.select( object.userData.object );
				} else {
					this.select( object );
				}
			} else {
				this.select( null );
			}
		})
	}

	select( object ) {
		if ( this.editor.selected === object ) return;
		let uuid = null;
		if ( object !== null ) {
			uuid = object.uuid;
		}

		this.editor.selected = object;
		this.editor.config.setKey( 'selected', uuid );

		useDispatchSignal("objectSelected",object);
		useDispatchSignal("sceneGraphChanged");
	}

	deselect() {
		this.select(null);
	}
}

export { Selector };
