# ThreeJSEditor For Vue 3.2    

### 基于vue3.2与ThreeJs官方Editor重写。 
<br/>

## Languages
- [Vue3.2](https://v3.cn.vuejs.org/)
- [TypeScript](https://www.naiveui.com/zh-CN/os-theme)
- [Naive UI](https://www.naiveui.com/zh-CN/os-theme)    
<br/>

## Installation   
```sh

```   
<br/>   

## 项目结构
```
|-- .vscode                          // vscode配置文件
|-- public                          
|-- src                              // 源码目录               
|   |-- assets                       // 资源文件目录
|   |-- components                   // 组件
|       |-- Layout.vue               // layout布局组件       
|   |-- router                       // Vue 路由
|       |-- index.ts
|   |-- store                        // Vuex Store文件
|       |-- modules                  // Vuex模块目录  
|       |-- index.ts      
|       |-- vuex.d.ts                // Vuex 类型声明文件        
|   |-- utils                        // 全局公用函数目录                
|   |-- App.vue                      // App入口文件
|   |-- env.d.ts                     // 类型声明文件
|   |-- main.ts                      // 程序入口文件 
|-- .gitignore                       // git ingnore
|-- README.md                        // README
|-- index.html                       // 入口html文件
|-- package.json                     // 项目及工具的依赖配置文件
|-- tsconfig.json                     // 指定了编译项目所需的根目录下的文件以及编译选项
|-- vite.config.ts                    // Vite配置文件
|-- yarn.lock                    
```
<br/>

## Run demo    
``` bash
# clone the repository
git clone https://github.com/mlt131220/Vue3-ThreeJSEditor.git
# install library dependencies
cd Vue3-ThreeJSEditor
yarn
# run demo
yarn dev
# build for production with minification
yarn build
```
<br/>