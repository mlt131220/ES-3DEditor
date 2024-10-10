
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'

import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IVertexEntity extends IEntity, IPoint{
	bulge: number;
	curveFittingVertex: boolean;
	curveFitTangent: boolean;
	splineVertex: boolean;
	splineControlPoint: boolean;
	threeDPolylineVertex: boolean;
	threeDPolylineMesh: boolean;
	polyfaceMeshVertex: boolean;
	faceA: number;
	faceB: number;
	faceC: number;
	faceD: number;
}

export default class Vertex implements IGeometry {
	public ForEntityName= 'VERTEX' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		var entity = { type: curr.value } as IVertexEntity;
		curr = scanner.next();
		while(!scanner.isEOF()) {
				if(curr.code === 0) break;

				switch(curr.code) {
						case 10:	// X
								entity.x = curr.value as number;
								break;
						case 20: // Y
								entity.y = curr.value as number;
								break;
						case 30: // Z
								entity.z = curr.value as number;
								break;
						case 40: // start width
								break;
						case 41: // end width
								break;
						case 42: // bulge
								if(curr.value != 0) entity.bulge = curr.value as number;
								break;
						case 70: // flags
								entity.curveFittingVertex = ((curr.value as number) & 1) !== 0;
								entity.curveFitTangent = ((curr.value as number) & 2) !== 0;
								entity.splineVertex = ((curr.value as number) & 8) !== 0;
								entity.splineControlPoint = ((curr.value as number) & 16) !== 0;
								entity.threeDPolylineVertex = ((curr.value as number) & 32) !== 0;
								entity.threeDPolylineMesh = ((curr.value as number) & 64) !== 0;
								entity.polyfaceMeshVertex = ((curr.value as number) & 128) !== 0;
								break;
						case 50: // curve fit tangent direction
								break;
						case 71: // polyface mesh vertex index
								entity.faceA = curr.value as number;
								break;
						case 72: // polyface mesh vertex index
								entity.faceB = curr.value as number;
								break;
						case 73: // polyface mesh vertex index
								entity.faceC = curr.value as number;
								break;
						case 74: // polyface mesh vertex index
								entity.faceD = curr.value as number;
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
