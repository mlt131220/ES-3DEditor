import { AddObjectCommand } from '@/core/commands/AddObjectCommand';
import { SetPositionCommand } from '@/core/commands/SetPositionCommand';
import { RemoveObjectCommand } from '@/core/commands/RemoveObjectCommand';
import { Box3, Vector3 } from 'three';

export class MenubarEdit {
	constructor() {}

	// 调用对应方法
	init(key: string) {
		this[key]();
	}

	//撤销
	undo() {
		window.editor.undo();
	}

	//重做
	redo() {
		window.editor.redo();
	}

	//清空历史记录
	clearHistory() {
		window.$dialog.warning({
			title: window.$t('other.warning'),
			content: window.$t("prompt['The Undo/Redo History will be cleared. Are you sure?']"),
			positiveText: window.$t('other.ok'),
			negativeText: window.$t('other.cancel'),
			onPositiveClick: () => {
				window.editor.history.clear();
			},
		});
	}

	//居中
	center() {
		const object = window.editor.selected;

		//避免居中相机或场景
		if (object === null || object.parent === null) return;

		const aabb = new Box3().setFromObject(object);
		const center = aabb.getCenter(new Vector3());
		const newPosition = new Vector3();

		newPosition.x = object.position.x + (object.position.x - center.x);
		newPosition.y = object.position.y + (object.position.y - center.y);
		newPosition.z = object.position.z + (object.position.z - center.z);

		window.editor.execute(new SetPositionCommand(object, newPosition));
	}

	//拷贝
	clone() {
		let object = window.editor.selected;

		//避免复制相机或场景
		if (object === null || object.parent === null) return;

		object = object.clone();

		window.editor.execute(new AddObjectCommand(object));
	}

	//删除
	delete() {
		const object = window.editor.selected;

		if (object !== null && object.parent !== null) {
			window.editor.execute(new RemoveObjectCommand(object));
		}
	}
}
