# ThreeJSEditor For Vue 3.2    

### 基于vue3.2与ThreeJs官方Editor重写。 
<br/>

## Used
- [Vue3.2](https://v3.cn.vuejs.org/)
- [TypeScript](https://www.naiveui.com/zh-CN/os-theme)
- [Naive UI](https://www.naiveui.com/zh-CN/os-theme)  
- [xicons](https://www.xicons.org) @vicons/fa 系列图标
<br/>

## Installation   
```sh

```   
<br/>   

## The project structure
```
|-- .vscode                          // vscode配置文件
|-- public                          
|-- src                              // 源码目录               
|   |-- assets                       // 资源文件目录
|   |-- components                   // 组件
|       |-- layout                   // views/Layout.vue页面相关组件 
|           |-- Footer.vue            
|           |-- Header.vue           //顶部菜单栏组件  
|       |-- namespace                // 命名空间组件目录 
|           |-- layout.ts            // views/Layout.vue页面相关组件命名空间
|   |-- router                       // Vue 路由
|       |-- index.ts
|   |-- store                        // Vuex Store文件
|       |-- actions.ts 
|       |-- getting.ts 
|       |-- index.ts  
|       |-- mutations.ts               
|       |-- state.ts          
|       |-- vuex.d.ts                // Vuex 类型声明文件
|   |-- type                         // 全局类型定义目录  
|       |-- store.ts                 // Vuex 类型定义文件     
|   |-- utils                        // 全局公用函数目录    
|   |-- views                        // vue页面  
|       |-- Layout.vue               // layout布局组件             
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