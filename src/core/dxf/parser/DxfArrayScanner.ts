export interface IGroup {
	code: number;
	value: number | string | boolean;
}

/**
 * DxfArrayScanner
 *
 * Based off the AutoCad 2012 DXF Reference
 * http://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf
 *
 * 读取表示dxf文件行的数组。接受一个数组，并提供一个简单的接口来提取组代码和值对。
 * @param data - 一个数组，其中每个元素表示DXF文件中的一行
 * @constructor
 */
export default class DxfArrayScanner {
	private _pointer = 0;
	private _eof = false;
	public lastReadGroup: IGroup | undefined;
	private _data: string[];

	constructor(data: string[]) {
		this._data = data;
	}

	/**
	 * 从数组中获取下一组(代码、值)。组是数组中两个连续的元素。第一个是代码，第二个是值。
	 * @returns {{code: Number}|*}
	 */
	public next() {
		if (!this.hasNext()) {
			if (!this._eof)
				throw new Error('输入结束异常:EOF组未在文件结束前读取。代码结束: ' + this._data[this._pointer]);
			else
				throw new Error('Cannot call \'next\' after EOF group has been read');
		}

		const group = {
			code: parseInt(this._data[this._pointer])
		} as IGroup;

		this._pointer++;

		group.value = parseGroupValue(group.code, this._data[this._pointer].trim());

		this._pointer++;

		if (group.code === 0 && group.value === 'EOF') this._eof = true;

		this.lastReadGroup = group;

		return group;
	}

	public peek() {
		if (!this.hasNext()) {
			if (!this._eof)
				throw new Error('输入结束异常:EOF组未在文件结束前读取。代码结束: ' + this._data[this._pointer]);
			else
				throw new Error('Cannot call \'next\' after EOF group has been read');
		}

		const group = {
			code: parseInt(this._data[this._pointer])
		} as IGroup;

		group.value = parseGroupValue(group.code, this._data[this._pointer + 1].trim());

		return group;
	}


	public rewind(numberOfGroups = 1) {
		this._pointer = this._pointer - numberOfGroups * 2;
	}

	/**
	 * 如果存在另一个代码/值对(数组中的2个元素)则返回true。
	 * @returns {boolean}
	 */
	public hasNext() {
		// 检查我们是否读过EOF组代码
		if (this._eof) {
			return false;
		}

		// 我们需要确保有两条线路可用
		return this._pointer <= this._data.length - 2;
	}

	/**
	 * 如果扫描器位于数组的末尾，则返回true
	 * @returns {boolean}
	 */
	public isEOF() {
		return this._eof;
	}
}

/**
 * Parse a value to its proper type.
 * See pages 3 - 10 of the AutoCad DXF 2012 reference given at the top of this file
 *
 * @param code
 * @param value
 * @returns {*}
 */
function parseGroupValue(code: number, value: string) {
	if (code <= 9) return value;
	if (code >= 10 && code <= 59) return parseFloat(value);
	if (code >= 60 && code <= 99) return parseInt(value);
	if (code >= 100 && code <= 109) return value;
	if (code >= 110 && code <= 149) return parseFloat(value);
	if (code >= 160 && code <= 179) return parseInt(value);
	if (code >= 210 && code <= 239) return parseFloat(value);
	if (code >= 270 && code <= 289) return parseInt(value);
	if (code >= 290 && code <= 299) return parseBoolean(value as '0' | '1');
	if (code >= 300 && code <= 369) return value;
	if (code >= 370 && code <= 389) return parseInt(value);
	if (code >= 390 && code <= 399) return value;
	if (code >= 400 && code <= 409) return parseInt(value);
	if (code >= 410 && code <= 419) return value;
	if (code >= 420 && code <= 429) return parseInt(value);
	if (code >= 430 && code <= 439) return value;
	if (code >= 440 && code <= 459) return parseInt(value);
	if (code >= 460 && code <= 469) return parseFloat(value);
	if (code >= 470 && code <= 481) return value;
	if (code === 999) return value;
	if (code >= 1000 && code <= 1009) return value;
	if (code >= 1010 && code <= 1059) return parseFloat(value);
	if (code >= 1060 && code <= 1071) return parseInt(value);

	//console.log('WARNING: 组代码没有定义的类型: %j', { code: code, value: value });
	return value;
}

/**
 * 根据1或0值解析布尔值
 * @param str
 * @returns {boolean}
 */
function parseBoolean(str: '0' | '1') {
	if (str === '0') return false;
	if (str === '1') return true;
	return str;
	// throw TypeError('String \'' + str + '\' cannot be cast to Boolean type');
}