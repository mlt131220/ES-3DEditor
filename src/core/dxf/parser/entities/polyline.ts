
import * as helpers from '../ParseHelpers'
import VertexParser, { IVertexEntity } from './vertex';
import IGeometry, { IEntity, IPoint } from './geomtry';
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';

export interface IPolylineEntity extends IEntity {
	vertices: IVertexEntity[];
	thickness: number;
	shape: boolean;
	includesCurveFitVertices: boolean;
	includesSplineFitVertices: boolean;
	is3dPolyline: boolean;
	is3dPolygonMesh: boolean;
	is3dPolygonMeshClosed: boolean;
	isPolyfaceMesh: boolean;
	hasContinuousLinetypePattern: boolean;
	extrusionDirection: IPoint;
}

export default class Polyline implements IGeometry {
	public ForEntityName = 'POLYLINE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		var entity = { type: curr.value, vertices: [] as IVertexEntity[] } as IPolylineEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 10: // always 0
					break;
				case 20: // always 0
					break;
				case 30: // elevation
					break;
				case 39: // thickness
					entity.thickness = curr.value as number;
					break;
				case 40: // start width
					break;
				case 41: // end width
					break;
				case 70:
					entity.shape = ((curr.value as number) & 1) !== 0;
					entity.includesCurveFitVertices = ((curr.value as number) & 2) !== 0;
					entity.includesSplineFitVertices = ((curr.value as number) & 4) !== 0;
					entity.is3dPolyline = ((curr.value as number) & 8) !== 0;
					entity.is3dPolygonMesh = ((curr.value as number) & 16) !== 0;
					entity.is3dPolygonMeshClosed = ((curr.value as number) & 32) !== 0; // 32 = The polygon mesh is closed in the N direction
					entity.isPolyfaceMesh = ((curr.value as number) & 64) !== 0;
					entity.hasContinuousLinetypePattern = ((curr.value as number) & 128) !== 0;
					break;
				case 71: // Polygon mesh M vertex count
					break;
				case 72: // Polygon mesh N vertex count
					break;
				case 73: // Smooth surface M density
					break;
				case 74: // Smooth surface N density
					break;
				case 75: // Curves and smooth surface type
					break;
				case 210:
					entity.extrusionDirection = helpers.parsePoint(scanner);
					break;
				default:
					helpers.checkCommonEntityProperties(entity, curr, scanner);
					break;
			}
			curr = scanner.next();
		}

		entity.vertices = parsePolylineVertices(scanner, curr);

		return entity;
	}
}

function parsePolylineVertices(scanner:DxfArrayScanner, curr:IGroup) {
	const vertexParser = new VertexParser();

	const vertices = [];
	while (!scanner.isEOF()) {
		if (curr.code === 0) {
			if (curr.value === 'VERTEX') {
				vertices.push(vertexParser.parseEntity(scanner, curr));
				curr = scanner.lastReadGroup;
			} else if (curr.value === 'SEQEND') {
				parseSeqEnd(scanner, curr);
				break;
			}
		}
	}
	return vertices;
}

function parseSeqEnd(scanner:DxfArrayScanner, curr: IGroup) {
	const entity = { type: curr.value } as IEntity;
	curr = scanner.next();
	while (!scanner.isEOF()) {
		if (curr.code == 0) break;
		helpers.checkCommonEntityProperties(entity, curr, scanner);
		curr = scanner.next();
	}

	return entity;
};
