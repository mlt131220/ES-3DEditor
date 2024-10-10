
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface ICircleEntity extends IEntity {
	center: IPoint;
	radius: number;
	startAngle: number;
	endAngle: number;
	angleLength: number;
}

export default class Circle implements IGeometry {
	public ForEntityName = 'CIRCLE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as ICircleEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 10: // X coordinate of point
					entity.center = helpers.parsePoint(scanner);
					break;
				case 40: // radius
					entity.radius = (curr.value as number);
					break;
				case 50: // start angle
					entity.startAngle = Math.PI / 180 * (curr.value as number);
					break;
				case 51: // end angle
					const endAngle = Math.PI / 180 * (curr.value as number);
					if (endAngle < entity.startAngle)
						entity.angleLength = endAngle + 2 * Math.PI - entity.startAngle;
					else
						entity.angleLength = endAngle - entity.startAngle;
					entity.endAngle = endAngle;
					break;
				default: // ignored attribute
					helpers.checkCommonEntityProperties(entity, curr, scanner);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	}
}
