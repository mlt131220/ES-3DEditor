import DxfArrayScanner, {IGroup} from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, {IEntity, IPoint} from './geomtry';

export interface ITextEntity extends IEntity {
    startPoint: IPoint;
    endPoint: IPoint;
    textHeight: number;
    xScale: number;
    rotation: number;
    obliqueAngle: number;
    text: string;
    fontName: string;
    thickness: number;
    halign: number;
    valign: number;
    flags: number;
}

export default class Text implements IGeometry {
    public ForEntityName = 'TEXT' as const;

    public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
        const entity = {type: curr.value} as ITextEntity;
        curr = scanner.next();
        while (!scanner.isEOF()) {
            if (curr.code === 0) break;
            switch (curr.code) {
                case 1:
                    // 字符串本身
                    entity.text = curr.value as string;
                    break;
                case 7: // 字体名称/文字样式名（可选；默认值 = 标准）
                    entity.fontName = curr.value as string;
                    break;
                case 10:
                    // 第一对齐点（在 OCS 中） DXF：X 值；APP：三维点
                    entity.startPoint = helpers.parsePoint(scanner);
                    break;
                case 11:
                    // 第二对齐点（在 OCS 中）（可选）;
                    // DXF：X 值；APP：三维点;
                    // 只有当 72 或 73 组的值非零时，该值才有意义（如果对正不是基线对正/左对正）
                    entity.endPoint = helpers.parsePoint(scanner);
                    break;
                case 39:
                    // 厚度（可选；默认值 = 0）
                    entity.thickness = curr.value as number;
                    break;
                case 40:
                    // 文字高度
                    entity.textHeight = curr.value as number;
                    break;
                case 41:
                    // 相对 X 比例因子 — 宽度（可选；默认值 = 1）
                    // 使用拟合类型的文字时，该值也将进行调整。
                    entity.xScale = curr.value as number;
                    break;
                case 50:
                    // 文字旋转角度（可选；默认值 = 0）
                    entity.rotation = curr.value as number;
                    break;
                case 51:
                    // 倾斜角度（可选；默认值 = 0）
                    entity.obliqueAngle = curr.value as number;
                    break;
                case 71:
                    // 文字生成标志（可选，仅适用于 SHX 文字）：
                    // 2 = 文字反向（在 X 轴方向镜像）
                    // 4 = 文字倒置（在 Y 轴方向镜像）
                    entity.flags = curr.value as number;
                    break;
                // NOTE: 72和73没有11就没有意义(第二个对齐点)
                case 72:
                    // 文字水平对正类型（可选；默认值 = 0）整数代码（非按位编码）
                    // 0 = 左对正；1 = 居中对正；2 = 右对正
                    // 3 = 对齐（如果垂直对齐 = 0）
                    // 4 = 中间（如果垂直对齐 = 0）
                    // 5 = 拟合（如果垂直对齐 = 0）
                    entity.halign = curr.value as number;
                    break;
                case 73:
                    // 文字垂直对正类型（可选；默认值 = 0）整数代码（不是按位编码）
                    // 0 = 基线对正；1 = 底端对正；2 = 居中对正；3 = 顶端对正
                    entity.valign = curr.value as number;
                    break;
                default:
                    // check common entity attributes
                    helpers.checkCommonEntityProperties(entity, curr, scanner);
                    break;
            }
            curr = scanner.next();
        }
        return entity;
    }
}
