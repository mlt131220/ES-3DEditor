import round10 from './round10'

/**
 * 复制和移植到代码标准，因为b样条库不再维护。
 * Source:
 * https://github.com/thibauts/b-spline
 */
export default (t:number, degree:number, points, knots, weights?:number[] | undefined) => {
  const n = points.length // 点数量
  const d = points[0].length // 分维数

  if ((t < 0) || (t > 1)) {
    throw new Error('t 在区间 [0,1] 外: t = ' + t)
  }
  if (degree < 1) throw new Error('degree 必须至少为1(线性)')
  if (degree > (n - 1)) throw new Error('degree 必须小于或等于点数量 - 1')

  if (!weights) {
    // 构建长度为[n]的权重向量
    weights = []
    for (let i = 0; i < n; i++) {
      weights[i] = 1
    }
  }

  if (!knots) {
    // 建立长度为[n + degree + 1]的结向量
    knots = []
    for (let i = 0; i < n + degree + 1; i++) {
      knots[i] = i
    }
  } else {
    if (knots.length !== n + degree + 1) throw new Error('坏结矢量长度')
  }

  const domain = [
    degree,
    knots.length - 1 - degree
  ]

  // 将t重新映射到定义样条的域
  const low = knots[domain[0]]
  const high = knots[domain[1]]
  t = t * (high - low) + low

  // 夹紧到上限和下限，而不是像在原始库中那样抛出错误
  t = Math.max(t, low)
  t = Math.min(t, high)

  // 为提供的[t]值找到s(样条段)
  let s
  for (s = domain[0]; s < domain[1]; s++) {
    if (t >= knots[s] && t <= knots[s + 1]) {
      break
    }
  }

  // 将点转换为齐次坐标
  const v:any = []
  for (let i = 0; i < n; i++) {
    v[i] = []
    for (let j = 0; j < d; j++) {
      v[i][j] = points[i][j] * weights[i]
    }
    v[i][d] = weights[i]
  }

  // l (level) 从 1 到 curve degree + 1
  let alpha
  for (let l = 1; l <= degree + 1; l++) {
    // build level l of the pyramid
    for (let i = s; i > s - degree - 1 + l; i--) {
      alpha = (t - knots[i]) / (knots[i + degree + 1 - l] - knots[i])

      // interpolate each component
      for (let j = 0; j < d + 1; j++) {
        v[i][j] = (1 - alpha) * v[i - 1][j] + alpha * v[i][j]
      }
    }
  }

  // 转换回笛卡尔坐标，然后返回
  const result:number[] = []
  for (let i = 0; i < d; i++) {
    result[i] = round10(v[s][i] / v[s][d], -9)
  }
  return result
}