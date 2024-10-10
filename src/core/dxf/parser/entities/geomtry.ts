import DxfArrayScanner, { IGroup } from "../DxfArrayScanner";

export interface IPoint {
	x: number;
	y: number;
	z: number;
}

export interface IEntity {
	lineType: string;
	layer: string;
	lineTypeScale: number;
	visible: boolean;
	colorIndex: number;
	color: number;
	inPaperSpace: boolean;
	ownerHandle: string;
	materialObjectHandle: number;
	lineweight: 0| 5| 9| 13| 15| 18| 20| 25| 30| 35| 40| 50| 53| 60| 70| 80| 90| 100| 106| 120| 140| 158| 200| 211|-3|-2|-1;
	extendedData: {
		customStrings: string[];
		applicationName: string;
	};
	type: string;
	handle: number;
}

export type EntityName = 'POINT'
	| '3DFACE'
	| 'ARC'
	| 'ATTDEF'
	| 'ATTRIB'
	| 'CIRCLE'
	| 'DIMENSION'
	| 'ELLIPSE'
	| 'HATCH'
	| 'INSERT'
	| 'LINE'
	| 'LWPOLYLINE'
	| 'MTEXT'
	| 'POLYLINE'
	| 'SOLID'
	| 'SPLINE'
	| 'TEXT'
	| 'VERTEX';

export default interface IGeometry {
	ForEntityName: EntityName;
	parseEntity(scanner: DxfArrayScanner, curr: IGroup): IEntity;
}
