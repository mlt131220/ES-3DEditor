
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface ISolidEntity extends IEntity {
	points: IPoint[];
	extrusionDirection: IPoint;
}

export default class Solid implements IGeometry {
	public ForEntityName = 'SOLID' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value, points: [] as IPoint[] } as ISolidEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 10:
					entity.points[0] = helpers.parsePoint(scanner);
					break;
				case 11:
					entity.points[1] = helpers.parsePoint(scanner);
					break;
				case 12:
					entity.points[2] = helpers.parsePoint(scanner);
					break;
				case 13:
					entity.points[3] = helpers.parsePoint(scanner);
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
