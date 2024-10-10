import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IInsertEntity extends IEntity {
	name: string;
	xScale: number;
	yScale: number;
	zScale: number;
	position: IPoint;
	rotation: number;
	columnCount: number;
	rowCount: number;
	columnSpacing: number;
	rowSpacing: number;
	extrusionDirection: IPoint;
}

export default class Insert implements IGeometry {
	public ForEntityName = 'INSERT' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as IInsertEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 2:
					entity.name = curr.value as string;
					break;
				case 41:
					entity.xScale = curr.value as number;
					break;
				case 42:
					entity.yScale = curr.value as number;
					break;
				case 43:
					entity.zScale = curr.value as number;
					break;
				case 10:
					entity.position = helpers.parsePoint(scanner);
					break;
				case 50:
					entity.rotation = curr.value as number;
					break;
				case 70:
					entity.columnCount = curr.value as number;
					break;
				case 71:
					entity.rowCount = curr.value as number;
					break;
				case 44:
					entity.columnSpacing = curr.value as number;
					break;
				case 45:
					entity.rowSpacing = curr.value as number;
					break;
				case 210:
					entity.extrusionDirection = helpers.parsePoint(scanner);
					break;
				default: // check common entity attributes
					helpers.checkCommonEntityProperties(entity, curr, scanner);
					break;
			}
			curr = scanner.next();
		}

		return entity;
	}
}
