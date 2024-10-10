import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers';
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface IAttribEntity extends IEntity {
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
    lineSpacingFactor: number;
    fillBoxScale: number;
    annotationHeight: number;
    obliqueAngle: number;
    invisible: boolean;
    constant: boolean;
    verificationRequired: boolean;
    preset: boolean;
    horizontalJustification: number;
    verticalJustification: number;
    backgroundFillColor: string;
    attachmentPoint: number;
    lineSpacing: number;
    backgroundFillSetting: string;
    extrusionDirection: IPoint;
    lockPositionFlag: number;
    hardPointerId: number;
}

export default class Attrib implements IGeometry{
    public ForEntityName = 'ATTRIB' as const;

    public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
        const entity = {
            type: curr.value,
            scale: 1,
            textStyle: 'STANDARD',
        } as IAttribEntity;
        curr = scanner.next();
        while (!scanner.isEOF()) {
            // 0 为图元类型 (MTEXT)，不写入，此处当作 Attrib解析
            if (curr.code === 0) {
                break;
            }
            switch (curr.code) {
                case 1:
                    // 字符串本身
                    entity.text = curr.value as string;
                    break;
                case 2:
                    // 属性标签（字符串；不能包含空格）
                    entity.tag = curr.value as string;
                    break;
                case 3:
                    // 附加文字（始终在长度为 250 个字符的数据块中）（可选）
                    entity.prompt = curr.value as string;
                    break;
                case 7:
                    // DXF：X 值；APP：三维矢量文字样式名（如果未提供，则为 STANDARD）（可选）
                    entity.textStyle = curr.value as string;
                    break;
                case 10: // 文字起点（在 OCS 中）
                    entity.startPoint = helpers.parsePoint(scanner);
                    break;
                case 11: //X 轴方向矢量（在 WCS 中）
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
                    // X 相对缩放比例（宽度）（可选；默认值 = 1）。使用拟合类型的文字时，该值也将进行调整。
                    entity.scale = curr.value as number;
                    break;
                case 44:
                    // 多行文字的行距比例（可选）：
                    // 要应用的行距的默认百分比（五分之三）。
                    // 有效值的范围从 0.25 到 4.00
                    entity.lineSpacingFactor = curr.value as number;
                    break;
                case 45:
                    // 填充框大小（可选）：
                    // 确定文字周围的边框大小。
                    entity.fillBoxScale = curr.value as number;
                    break;
                case 46:
                    // 定义注释高度
                    entity.annotationHeight = curr.value as number;
                    break;
                case 50:
                    //文字旋转角度（可选；默认值 = 0）
                    entity.rotation = curr.value as number;
                    break;
                case 51:
                    // 倾斜角（可选；默认值 = 0）
                    entity.obliqueAngle = curr.value as number;
                    break;
                case 63:
                    //背景填充颜色（可选）：
                    // 组码 90 为 1 时要用于背景填充的颜色。
                    entity.backgroundFillColor = curr.value as string
                    break;
                case 70:
                    entity.invisible = !!((curr.value as number) & 0x01);
                    entity.constant = !!((curr.value as number) & 0x02);
                    entity.verificationRequired = !!((curr.value as number) & 0x04);
                    entity.preset = !!((curr.value as number) & 0x08);
                    break;
                case 71:
                    //附着点：
                    // 1 = 左上；2 = 中上；3 = 右上
                    // 4 = 左中；5 = 正中；6 = 右中
                    // 7 = 左下；8 = 中下；9 = 右下
                    entity.attachmentPoint = curr.value as number;
                    break;
                case 72:
                    // 文字水平对正类型（可选；默认值 = 0）
                    entity.horizontalJustification = curr.value as number;
                    break;
                case 73:
                    // 字段长度（可选；默认值 = 0）（当前未使用）
                    entity.lineSpacing = curr.value as number;
                    break;
                case 74:
                    // 垂直文字对正类型（可选；默认值 = 0）
                    entity.verticalJustification = curr.value as number;
                    break;
                case 90:
                    // 背景填充设置：
                    // 0 = 背景填充关闭
                    // 1 = 使用背景填充颜色
                    // 2 = 使用图形窗口颜色作为背景填充颜色
                    entity.backgroundFillSetting = curr.value as string;
                    break;
                case 210:
                    // 拉伸方向。仅当图元的拉伸方向与 WCS 的 Z 轴不平行时才出现（可选；默认值 = 0, 0, 1）
                    entity.extrusionDirection = helpers.parsePoint(scanner);
                    break;
                case 280:
                    // 锁定位置标志。锁定块参照中属性的位置
                    entity.lockPositionFlag = curr.value as number;
                    break;
                case 340:
                    // 次要属性或属性定义的硬指针 ID
                    entity.hardPointerId = curr.value as number;
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
