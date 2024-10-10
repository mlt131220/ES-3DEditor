
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IEllipseEntity extends IEntity {
	center: IPoint;
	majorAxisEndPoint: IPoint;
	axisRatio: number;
	startAngle: number;
	endAngle: number;
	name: string;
}

export default class Ellipse implements IGeometry {
	public ForEntityName = 'ELLIPSE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as IEllipseEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 10:
					entity.center = helpers.parsePoint(scanner);
					break;
				case 11:
					entity.majorAxisEndPoint = helpers.parsePoint(scanner);
					break;
				case 40:
					entity.axisRatio = curr.value as number;
					break;
				case 41:
					entity.startAngle = curr.value as number;
					break;
				case 42:
					entity.endAngle = curr.value as number;
					break;
				case 2:
					entity.name = curr.value as string;
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
