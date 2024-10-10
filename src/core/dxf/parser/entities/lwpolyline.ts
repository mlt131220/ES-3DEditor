import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IVertex extends IPoint{
	startWidth: number;
	endWidth: number;
	bulge: number;
}

export interface ILwpolylineEntity extends IEntity {
	vertices: IVertex[];
	elevation: number;
	depth: number;
	shape: boolean;
	hasContinuousLinetypePattern: boolean;
	width: number;
	extrusionDirectionX: number;
	extrusionDirectionY: number;
	extrusionDirectionZ: number;
}

export default class Lwpolyline implements IGeometry {
	public ForEntityName = 'LWPOLYLINE' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value, vertices: [] as IVertex[] } as ILwpolylineEntity;
		let numberOfVertices = 0;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;

			switch (curr.code) {
				case 38:
					entity.elevation = curr.value as number;
					break;
				case 39:
					entity.depth = curr.value as number;
					break;
				case 70: // 1 = Closed shape, 128 = plinegen?, 0 = default
					entity.shape = (((curr.value as number) & 1) === 1);
					entity.hasContinuousLinetypePattern = (((curr.value as number) & 128) === 128);
					break;
				case 90:
					numberOfVertices = curr.value as number;
					break;
				case 10: // X coordinate of point
					entity.vertices = parseLWPolylineVertices(numberOfVertices, scanner);
					break;
				case 43:
					if (curr.value !== 0) entity.width = curr.value as number;
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

function parseLWPolylineVertices(n:number, scanner: DxfArrayScanner) {
	if (!n || n <= 0) throw Error('n must be greater than 0 verticies');
	const vertices = [] as IVertex[];
	let vertexIsStarted = false;
	let vertexIsFinished = false;
	let curr = scanner.lastReadGroup;

	for (let i = 0; i < n; i++) {
		const vertex = {} as IVertex;
		while (!scanner.isEOF()) {
			if (curr.code === 0 || vertexIsFinished) break;

			switch (curr.code) {
				case 10: // X
					if (vertexIsStarted) {
						vertexIsFinished = true;
						continue;
					}
					vertex.x = curr.value as number;
					vertexIsStarted = true;
					break;
				case 20: // Y
					vertex.y = curr.value as number;
					break;
				case 30: // Z
					vertex.z = curr.value as number;
					break;
				case 40: // start width
					vertex.startWidth = curr.value as number;
					break;
				case 41: // end width
					vertex.endWidth = curr.value as number;
					break;
				case 42: // bulge
					if (curr.value != 0) vertex.bulge = curr.value as number;
					break;
				default:
					// if we do not hit known code return vertices.  Code might belong to entity
					scanner.rewind();
					if (vertexIsStarted) {
						vertices.push(vertex);
					}
					scanner.rewind();
					return vertices;
			}
			curr = scanner.next();
		}
		// See https://groups.google.com/forum/#!topic/comp.cad.autocad/9gn8s5O_w6E
		vertices.push(vertex);
		vertexIsStarted = false;
		vertexIsFinished = false;
	}
	scanner.rewind();
	return vertices;
}
