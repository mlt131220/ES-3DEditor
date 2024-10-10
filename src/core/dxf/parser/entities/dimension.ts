
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IDimensionEntity extends IEntity{
	block: string;
	anchorPoint: IPoint;
	middleOfText: IPoint;
	insertionPoint: IPoint;
	linearOrAngularPoint1: IPoint;
	linearOrAngularPoint2: IPoint;
	diameterOrRadiusPoint: IPoint;
	arcPoint: IPoint;
	dimensionType: number;
	attachmentPoint: number;
	actualMeasurement: number;
	text: string;
	angle: number;
}

export default class Dimension implements IGeometry {
	public ForEntityName = 'DIMENSION' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as IDimensionEntity;
		curr = scanner.next();
		while(!scanner.isEOF()) {
			if(curr.code === 0) break;

			switch(curr.code) {
				case 2: // Referenced block name
					entity.block = curr.value as string;
					break;
				case 10: // X coordinate of 'first alignment point'
					entity.anchorPoint = helpers.parsePoint(scanner);
					break;
				case 11:
					entity.middleOfText = helpers.parsePoint(scanner);
					break;
				case 12: // Insertion point for clones of a dimension
					entity.insertionPoint = helpers.parsePoint(scanner);
					break;
				case 13: // Definition point for linear and angular dimensions 
					entity.linearOrAngularPoint1 = helpers.parsePoint(scanner);
					break;
				case 14: // Definition point for linear and angular dimensions 
					entity.linearOrAngularPoint2 = helpers.parsePoint(scanner);
					break;
				case 15: // Definition point for diameter, radius, and angular dimensions
					entity.diameterOrRadiusPoint = helpers.parsePoint(scanner);
					break;
				case 16: // Point defining dimension arc for angular dimensions
					entity.arcPoint = helpers.parsePoint(scanner);
					break;
				case 70: // Dimension type
					entity.dimensionType = curr.value as number;
					break;
				case 71: // 5 = Middle center
					entity.attachmentPoint = curr.value as number;
					break;
				case 42: // Actual measurement
					entity.actualMeasurement = curr.value as number;
					break;
				case 1: // Text entered by user explicitly
					entity.text = curr.value as string;
					break;
				case 50: // Angle of rotated, horizontal, or vertical dimensions
					entity.angle = curr.value as number;
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
