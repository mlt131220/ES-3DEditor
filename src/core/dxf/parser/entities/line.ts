
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface ILineEntity extends IEntity{
	vertices: IPoint[];
	extrusionDirection: IPoint;
}

export default class Line implements IGeometry{
	public ForEntityName= 'LINE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value, vertices: [] as IPoint[] } as ILineEntity;
		curr = scanner.next();
		while(!scanner.isEOF()) {
				if(curr.code === 0) break;

				switch(curr.code) {
						case 10: // X coordinate of point
								entity.vertices.unshift(helpers.parsePoint(scanner));
								break;
						case 11:
								entity.vertices.push(helpers.parsePoint(scanner));
								break;
						case 210:
								entity.extrusionDirection = helpers.parsePoint(scanner);
								break;
						case 100:
								break;
						default:
								helpers.checkCommonEntityProperties(entity, curr, scanner);
								break;
				}
				
				curr = scanner.next();
		}
		return entity;
	}
}
