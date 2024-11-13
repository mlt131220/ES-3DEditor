# ES 3DEditor

🌍
*[English](README.md)*
🌍
*[简体中文](README.zh-cn.md)*

### 基于vue3与ThreeJs，具体查看[Doc](http://editor-doc.mhbdng.cn/)

<div style="text-align: center">

![Static Badge](https://img.shields.io/badge/Vue-3.3.4-green)
![Static Badge](https://img.shields.io/badge/NaiveUI-2.34.4-green)
![Static Badge](https://img.shields.io/badge/ThreeJS-r163-8732D7)
![Static Badge](https://img.shields.io/badge/Cesium-1.107.0-8732D7)
![Static Badge](https://img.shields.io/badge/UnoCSS-0.46.5-8732D7)
<br />
![Static Badge](https://img.shields.io/badge/license-MIT-blue)

</div>

***

## 交流
<img src="https://upyun.mhbdng.cn/static/images/WeChatGroup.jpg" width="500px">

点击[这里](https://upyun.mhbdng.cn/static/images/WeChatGroup.jpg)查看最新群邀请图片。

***

## 后端
* Go实现: [ES3DEditorGoBack](https://github.com/mlt131220/ES3DEditorGoBack)

## 特性：
- [x] 模型导入展示，支持OBJ、FBX、GLTF、GLB、RVT、IFC、SEA、3DM、3DS、3MF、AMF、DAE、DRC、PLY、SVG、JSON等30+格式;
- [x] BIM模型（RVT、IFC）轻量化展示;
- [x] CAD图纸（DWG、DXF）解析关联;
- [x] 场景分包存储读取;
- [x] WebSocket 协作;
- [x] 又拍云 USS 存储;
- [x] Golang + MySQL 后端支持;
- [x] 运行脚本;
- [ ] 动画编辑器;
- [ ] 物理引擎支持;
- [ ] 粒子系统支持;
- [ ] WebGPU 支持;
- [ ] 数据组件 (暂定支持：API接口、WebSocket，不支持：前端SQL、GraphQL);
- [ ] VUE / React 组件支持;
- [ ] 低代码数据大屏;

[//]: # (## 工程结构)
[//]: # (```)
[//]: # (|-- .vscode                          // vscode配置文件)
[//]: # (|-- build                            // 打包配置)
[//]: # (|-- public )
[//]: # (|   |-- library                      // 静态资源库)
[//]: # (|   |-- release                      // 发布包模板         )
[//]: # (|   |-- static                       // 项目静态资源)
[//]: # (|   |-- logo.svg                     // Logo               )
[//]: # (|-- src                              // 源码目录               )
[//]: # (|   |-- cesium                       // cesium 场景相关)
[//]: # (|   |-- components                   // 组件)
[//]: # (|   |-- config                       // 项目各类配置)
[//]: # (|   |-- core                         // 编辑器核心代码)
[//]: # (|       |-- commands                 // 编辑器操作命令集合)
[//]: # (|       |-- exporters                // 自定义模型导出器)
[//]: # (|       |-- libs                     // 第三方相关js库)
[//]: # (|   |-- hooks                        // 钩子函数)
[//]: # (|   |-- http                         // 封装请求)
[//]: # (|   |-- language                     // i18n 国际化配置文件夹)
[//]: # (|   |-- router                       // 路由配置)
[//]: # (|   |-- store                        // Pinia 状态管理)
[//]: # (|   |-- utils                        // 全局公用函数目录    )
[//]: # (|   |-- views                        // vue页面            )
[//]: # (|   |-- App.vue                      // App入口文件)
[//]: # (|   |-- main.ts                      // 程序入口文件 )
[//]: # (|-- types                            // 全局类型定义目录 )
[//]: # (|-- .env                             // 通用环境文件)
[//]: # (|-- .env.development                 // 开发环境)
[//]: # (|-- .env.production                  // 生产环境)
[//]: # (|-- .gitignore                       // git ingnore)
[//]: # (|-- index.html                       // 入口html文件)
[//]: # (|-- package.json                     // 项目及工具的依赖配置文件)
[//]: # (|-- README.md                        // README)
[//]: # (|-- tsconfig.json                     // 指定了编译项目所需的根目录下的文件以及编译选项)
[//]: # (|-- vite.config.ts                    // Vite配置文件)
[//]: # (|-- yarn.lock                    )
[//]: # (```)

## 快速开始
```shell
   git clone https://github.com/mlt131220/ES-3DEditor.git
```

## 运行
```shell
    cd ES-3DEditor
    yarn install
    yarn run dev
```
Tips:
* `Node > 18.0.0`;

## 打包
```shell
    yarn run build
```

## 感谢 || 赞助🌹🌹🌹
如果本项目帮助到了你，请在[这里](https://github.com/mlt131220/ES-3DEditor/issues/2)留下你的网址，让更多的人看到。您的回复将会是我继续更新维护下去的动力。 </br></br>
本项目代码完全开源并且免费学习&使用，如果你开心并且想要打赏赞助，可扫描下方二维码：</br>
<img src="https://upyun.mhbdng.cn/static/images/alipay.jpg" width="320px">
<img src="https://upyun.mhbdng.cn/static/images/wepay.jpg" width="320px">

## 权益声明
本项目基于Apache-2.0协议开源，任何人可以免费使用，但任何情况下，请不要用于商业用途,商用用途请联系作者获得授权。

## 免责声明
本项目仅供学习交流使用，请勿用于任何非法用途，否则后果自负。
作者对使用本项目(原始项目或二次创作后)产生的任何问题不承担任何法律责任。

## Star 历史
[![Star History Chart](https://api.star-history.com/svg?repos=mlt131220/ES-3DEditor&type=Date)](https://star-history.com/#mlt131220/ES-3DEditor&Date)
