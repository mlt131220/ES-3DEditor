import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IAttdefEntity extends IEntity {
	scale: number;
	textStyle: 'STANDARD' | string;
	text: string;
	tag: string;
	prompt: string;
	startPoint: IPoint;
	endPoint: IPoint;
	thickness: number;
	textHeight: number;
	rotation: number;
	obliqueAngle: number;
	invisible: boolean;
	constant: boolean;
	verificationRequired: boolean;
	preset: boolean;
	backwards: boolean;
	mirrored: boolean;
	horizontalJustification: number;
	fieldLength: number;
	verticalJustification: number;
	extrusionDirectionX: number;
	extrusionDirectionY: number;
	extrusionDirectionZ: number;
}

export default class Attdef implements IGeometry {
	public ForEntityName = 'ATTDEF' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = {
			type: curr.value,
			scale: 1,
			textStyle: 'STANDARD'
		} as IAttdefEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) {
				break;
			}
			switch (curr.code) {
				case 1:
					entity.text = curr.value as string;
					break;
				case 2:
					entity.tag = curr.value as string;
					break;
				case 3:
					entity.prompt = curr.value as string;
					break;
				case 7:
					entity.textStyle = curr.value as string;
					break;
				case 10: // X coordinate of 'first alignment point'
					entity.startPoint = helpers.parsePoint(scanner);
					break;
				case 11: // X coordinate of 'second alignment point'
					entity.endPoint = helpers.parsePoint(scanner);
					break;
				case 39:
					entity.thickness = curr.value as number;
					break;
				case 40:
					entity.textHeight = curr.value as number;
					break;
				case 41:
					entity.scale = curr.value as number;
					break;
				case 50:
					entity.rotation = curr.value as number;
					break;
				case 51:
					entity.obliqueAngle = curr.value as number;
					break;
				case 70:
					entity.invisible = !!((curr.value as number) & 0x01);
					entity.constant = !!((curr.value as number) & 0x02);
					entity.verificationRequired = !!((curr.value as number) & 0x04);
					entity.preset = !!((curr.value as number) & 0x08);
					break;
				case 71:
					entity.backwards = !!((curr.value as number) & 0x02);
					entity.mirrored = !!((curr.value as number) & 0x04);
					break;
				case 72:
					// TODO: enum values?
					entity.horizontalJustification = curr.value as number;
					break;
				case 73:
					entity.fieldLength = curr.value as number;
					break;
				case 74:
					// TODO: enum values?
					entity.verticalJustification = curr.value as number;
					break;
				case 100:
					break;
				case 210:
					entity.extrusionDirectionX = curr.value as number;
					break;
				case 220:
					entity.extrusionDirectionY = curr.value as number;
					break;
				case 230:
					entity.extrusionDirectionZ = curr.value as number;
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
