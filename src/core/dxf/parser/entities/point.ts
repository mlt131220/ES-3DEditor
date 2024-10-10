
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IPointEntity extends IEntity{
	position: IPoint;
	thickness: number;
	extrusionDirection: IPoint;
}

export default class Point implements IGeometry{
	public ForEntityName= 'POINT' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const type = curr.value as string;
		const entity = { type } as unknown as IPointEntity;
		curr = scanner.next();
		while(!scanner.isEOF()) {
				if(curr.code === 0) break;

				switch(curr.code) {
						case 10:
								entity.position = helpers.parsePoint(scanner);
								break;
						case 39:
								entity.thickness = curr.value as number;
								break;
						case 210:
								entity.extrusionDirection = helpers.parsePoint(scanner);
								break;
						case 100:
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
