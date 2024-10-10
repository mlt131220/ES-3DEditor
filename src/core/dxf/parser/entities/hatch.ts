import DxfArrayScanner, {IGroup} from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, {IEntity, IPoint} from './geomtry';

export interface IHatchEntity extends IEntity {
    boundaryLoops: any[];
    definitionLines: any[];
    seedPoints: any[];
    patternName: string;
    isSolid: boolean;
    hatchStyle: string;
    patternType: number;
    patternAngle: number;
    patternScale: number;
}

export default class Hatch implements IGeometry {
    public ForEntityName = 'HATCH' as const;

    public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
        let entity = {type: curr.value} as IHatchEntity;

        let numBoundaryLoops = 0;
        let numDefinitionLines = 0;
        let numSeedPoints = 0;

        curr = scanner.next();
        while (!scanner.isEOF()) {
            if (curr.code === 0) break;

            while (numBoundaryLoops > 0) {
                const loop = ParseBoundaryLoop(curr, scanner)
                if (loop) {
                    entity.boundaryLoops.push(loop);
                    numBoundaryLoops--;
                    curr = scanner.next();
                } else {
                    numBoundaryLoops = 0
                }
            }

            while (numDefinitionLines > 0) {
                const line = ParseDefinitionLine(curr, scanner)
                if (line) {
                    entity.definitionLines.push(line);
                    numDefinitionLines--;
                    curr = scanner.next();
                } else {
                    numDefinitionLines = 0
                }
            }

            while (numSeedPoints > 0) {
                const pt = ParseSeedPoint(curr, scanner);
                if (pt) {
                    entity.seedPoints.push(pt);
                    numSeedPoints--;
                    curr = scanner.next();
                } else {
                    numSeedPoints = 0
                }
            }

            if (curr.code === 0) break;

            switch (curr.code) {
                case 2: // 填充图案名
                    entity.patternName = curr.value as string;
                    break;
                case 70: // 实体填充标志（实体填充 = 1；图案填充 = 0）
                    entity.isSolid = curr.value != 0;
                    break;
                case 91: // 边界路径（环）数
                    numBoundaryLoops = curr.value as number;
                    if (numBoundaryLoops > 0) {
                        entity.boundaryLoops = []
                    }
                    break;
                /**
                 * 图案填充样式：
                 * 0 = 对“奇数奇偶校验”区域进行图案填充（普通样式）
                 * 1 = 仅对最外层区域进行图案填充（“外部”样式）
                 * 2 = 对整个区域进行图案填充（“忽略”样式）
                 */
                case 75:
                    entity.hatchStyle = curr.value as string;
                    break;
                /**
                 * 填充图案类型：
                 * 0 = 用户定义；1 = 预定义；2 = 自定义
                 */
                case 76:
                    entity.patternType = curr.value as number;
                    break;
                case 52: // 填充图案角度（仅限图案填充）
                    entity.patternAngle = (curr.value as number) * Math.PI / 180;
                    break;
                case 41: // 填充图案比例或间距（仅限图案填充）
                    entity.patternScale = curr.value as number;
                    break;
                case 78: // 图案定义直线数
                    numDefinitionLines = curr.value as number;
                    if (numDefinitionLines > 0) {
                        entity.definitionLines = []
                    }
                    break;
                case 98: // 种子点数
                    numSeedPoints = curr.value as number;
                    if (numSeedPoints > 0) {
                        entity.seedPoints = []
                    }
                    break;
                default: // 检查通用实体属性
                    helpers.checkCommonEntityProperties(entity, curr, scanner);
                    break;
            }
            curr = scanner.next();
        }

        return entity;
    };
}

function ParseBoundaryLoop(curr: IGroup, scanner: DxfArrayScanner) {
    let entity:any = null

    const ParsePolyline = () => {
        const pl: { vertices: IPoint[], isClosed: boolean } = {vertices: [], isClosed: false};
        let numVertices = 0;
        while (true) {
            if (numVertices > 0) {
                for (let i = 0; i < numVertices; i++) {
                    if (curr.code != 10) {
                        break
                    }
                    const p = helpers.parsePoint(scanner)
                    curr = scanner.next();
                    if (curr.code == 42) {
                        // @ts-ignore
                        p.bulge = curr.value;
                        curr = scanner.next();
                    }
                    pl.vertices.push(p)
                }
                return pl
            }

            switch (curr.code) {
                case 73:
                    pl.isClosed = curr.value as boolean;
                    break;
                case 93:
                    numVertices = curr.value as number;
                    break;
                default:
                    return pl;
            }
            curr = scanner.next();
        }
    }

    const ParseEdge = () => {
        if (curr.code != 72) {
            return null
        }
        const e:any = {type: curr.value}
        curr = scanner.next();
        const isSpline = e.type == 4;

        while (true) {
            switch (curr.code) {
                case 10:
                    if (isSpline) {
                        if (!e.controlPoints) {
                            e.controlPoints = [];
                        }
                        e.controlPoints.push(helpers.parsePoint(scanner));
                    } else {
                        e.start = helpers.parsePoint(scanner);
                    }
                    break;
                case 11:
                    if (isSpline) {
                        if (!e.fitPoints) {
                            e.fitPoints = [];
                        }
                        e.fitPoints.push(helpers.parsePoint(scanner));
                    } else {
                        e.end = helpers.parsePoint(scanner);
                    }
                    break;
                case 40:
                    if (isSpline) {
                        if (!e.knotValues) {
                            e.knotValues = [];
                        }
                        e.knotValues.push(curr.value);
                    } else {
                        e.radius = curr.value;
                    }
                    break;
                case 50:
                    e.startAngle = (curr.value as number) * Math.PI / 180;
                    break;
                case 51:
                    e.endAngle = (curr.value as number) * Math.PI / 180;
                    break;
                case 73:
                    if (isSpline) {
                        e.rational = curr.value;
                    } else {
                        e.isCcw = curr.value;
                    }
                    break;
                case 74:
                    e.periodic = curr.value;
                    break;
                case 94:
                    e.degreeOfSplineCurve = curr.value;
                    break;

                //XXX暂时忽略一些群体，主要是样条
                case 95:
                case 96:
                case 42:
                case 97:
                    break;
                default:
                    return e
            }
            curr = scanner.next();
        }
    }

    let polylineParsed = false;
    let numEdges = 0;
    let numSourceRefs = 0;

    while (true) {
        if (!entity) {
            if (curr.code != 92) {
                return null;
            }
            entity = {type: curr.value};
            curr = scanner.next();
        }

        if ((entity.type & 2) && !polylineParsed) {
            entity.polyline = ParsePolyline()
            polylineParsed = true
        }

        while (numEdges) {
            const edge = ParseEdge();
            if (edge) {
                entity.edges.push(edge);
                numEdges--;
            } else {
                numEdges = 0;
            }
        }

        while (numSourceRefs) {
            if (curr.code == 330) {
                entity.sourceRefs.push(curr.value);
                numSourceRefs--;
                curr = scanner.next();
            } else {
                numSourceRefs = 0
            }
        }

        switch (curr.code) {
            case 93:
                numEdges = curr.value as number;
                if (numEdges > 0) {
                    entity.edges = []
                }
                break;
            case 97:
                numSourceRefs = curr.value as number;
                if (numSourceRefs > 0) {
                    entity.sourceRefs = []
                }
                break;
            default:
                scanner.rewind();
                return entity;
        }
        curr = scanner.next();
    }
}

function ParseDefinitionLine(curr: IGroup, scanner: DxfArrayScanner) {
    /* 假设总是从53组开始. */
    if (curr.code != 53) {
        return null
    }
    const entity:any = {
        angle: (curr.value as number) * Math.PI / 180,
        base: {x: 0, y: 0},
        offset: {x: 0, y: 0}
    };
    curr = scanner.next();

    let numDashes = 0;
    while (true) {
        switch (curr.code) {
            case 43:
                entity.base.x = curr.value as number;
                break;
            case 44:
                entity.base.y = curr.value as number;
                break;
            case 45:
                entity.offset.x = curr.value as number;
                break;
            case 46:
                entity.offset.y = curr.value as number;
                break;
            case 49:
                if (numDashes > 0) {
                    entity.dashes.push(curr.value);
                    numDashes--;
                }
                break;
            case 79:
                numDashes = curr.value as number;
                if (curr.value) {
                    entity.dashes = []
                }
                break;
            default:
                scanner.rewind();
                return entity;
        }
        curr = scanner.next();
    }
}

function ParseSeedPoint(curr: IGroup, scanner: DxfArrayScanner) {
    if (curr.code != 10) {
        return null
    }
    return helpers.parsePoint(scanner);
}
