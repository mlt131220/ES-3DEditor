// 这是基础的示例代码
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
// MDN上的示例代码是公共领域或CC0(您的偏好)或MIT，具体取决于示例代码添加的时间:
// https://developer.mozilla.org/en-US/docs/MDN/About

export default (value: number | string[], exp?:number | undefined) => {
    // 如果exp没有定义或者为零...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math.round(value as number)
    }
    value = +value
    exp = +exp
    // 如果值不是数字或exp不是整数…
    if (isNaN(value) || !(exp % 1 === 0)) {
      return NaN
    }
    // Shift
    value = value.toString().split('e')
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)))
    // Shift back
    value = value.toString().split('e')
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp))
  }