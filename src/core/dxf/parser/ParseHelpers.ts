import AUTO_CAD_COLOR_INDEX from './AutoCadColorIndex';
import ExtendedDataParser from './ExtendedDataParser';
import DxfArrayScanner, { IGroup } from './DxfArrayScanner';
import { IEntity, IPoint } from './entities/geomtry';

/**
 * 返回给定AutoCad颜色索引值的对应color值
 * @return {Number} color value as a number
 */
export function getAcadColor(index: number) {
	return AUTO_CAD_COLOR_INDEX[index];
}

/**
 * 解析2D或3D坐标、矢量或点。完成后，扫描器保持在坐标的最后一组上。
 * @param {*} scanner 
 */
export function parsePoint(scanner: DxfArrayScanner) {
	const point = {} as IPoint;

	// 重读第一个坐标的组
	scanner.rewind();
	let curr = scanner.next();

	let code = curr.code;
	point.x = curr.value as number;

	code += 10;
	curr = scanner.next();
	if (curr.code != code)
		throw new Error('Expected code for point value to be ' + code +
			' but got ' + curr.code + '.');
	point.y = curr.value as number;

	code += 10;
	curr = scanner.next();
	if (curr.code != code) {
		// Only the x and y are specified. Don't read z.
		scanner.rewind(); // Let the calling code advance off the point
		return point;
	}
	point.z = curr.value as number;

	return point;
}

/**
 * 某些实体可能包含由组101开始的嵌入对象。实体结束前的所有其他数据不应被解释为实体属性。该特性没有相关文档。
 * @param scanner
 */
export function skipEmbeddedObject(scanner: DxfArrayScanner) {
	/* 确保正确启动组. */
	scanner.rewind()
	let curr = scanner.next()
	if (curr.code !== 101) {
		throw new Error("Bad call for skipEmbeddedObject()")
	}
	do {
		curr = scanner.next()
	} while (curr.code !== 0)
	scanner.rewind()
}

/**
 * 尝试解析所有实体通用的代码。如果组由此函数处理，则返回true。
 * @param {*} entity - the entity currently being parsed
 * @param {*} curr - the current group being parsed
 * @param scanner
 */
export function checkCommonEntityProperties(entity: IEntity, curr:IGroup, scanner:DxfArrayScanner) {
	let xdataParser;
	while (curr.code >= 1000) {
		if (!xdataParser) {
			xdataParser = new ExtendedDataParser()
		}
		if (xdataParser.Feed(curr)) {
			xdataParser.Finish(entity)
			xdataParser = null;
		} else {
			curr = scanner.next()
		}
	}
	if (xdataParser) {
		xdataParser.Finish(entity);
		scanner.rewind();
		return true;
	}

	switch (curr.code) {
		case 0:
			entity.type = curr.value as string;
			break;
		case 5:
			entity.handle = curr.value as number;
			break;
		case 6:
			entity.lineType = curr.value as string;
			break;
		case 8: // Layer name
			entity.layer = curr.value as string;
			break;
		case 48:
			entity.lineTypeScale = curr.value as number;
			break;
		case 60:
			entity.visible = curr.value === 0;
			break;
		case 62: // Acad Index Color. 0 inherits ByBlock. 256 inherits ByLayer. Default is bylayer
			entity.colorIndex = curr.value as number;
			entity.color = getAcadColor(Math.abs(curr.value as number));
			break;
		case 67:
			// 不存在或0表示图元位于模型空间中。
			// 1 表示图元位于图纸空间中（可选）
			entity.inPaperSpace = curr.value !== 0;
			break;
		case 100:
			//ignore
			break;
		case 101: // Embedded Object in ACAD 2018.
			// See https://ezdxf.readthedocs.io/en/master/dxfinternals/dxftags.html#embedded-objects
			while (curr.code != 0) {
				curr = scanner.next();
			}
			scanner.rewind();
			break;
		case 330:
			entity.ownerHandle = curr.value as string;
			break;
		case 347:
			entity.materialObjectHandle = curr.value as number;
			break;
		case 370:
			//From https://www.woutware.com/Forum/Topic/955/lineweight?returnUrl=%2FForum%2FUserPosts%3FuserId%3D478262319
			// An integer representing 100th of mm, must be one of the following values:
			// 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211.
			// -3 = STANDARD, -2 = BYLAYER, -1 = BYBLOCK
			entity.lineweight = curr.value as 0| 5| 9| 13| 15| 18| 20| 25| 30| 35| 40| 50| 53| 60| 70| 80| 90| 100| 106| 120| 140| 158| 200| 211|-3|-2|-1;
			break;
		case 420: // TrueColor Color
			entity.color = curr.value as number;
			break;
		case 1000:
			entity.extendedData = entity.extendedData || {};
			entity.extendedData.customStrings = entity.extendedData.customStrings || [];
			entity.extendedData.customStrings.push(curr.value as string);
			break;
		case 1001:
			entity.extendedData = entity.extendedData || {};
			entity.extendedData.applicationName = curr.value as string;
			break;
		default:
			return false;
	}
	return true;
}
