(function(e,n){typeof exports=="object"&&typeof module<"u"?module.exports=n():typeof define=="function"&&define.amd?define(n):(e=typeof globalThis<"u"?globalThis:e||self,e.Msy3D=n())})(this,function(){"use strict";function e(o){return new Promise((r,c)=>{o.toBlob(i=>{if(i===null){c("截屏失败");return}const t=new Image;t.src=URL.createObjectURL(i),r(t)})})}function n(o,r){return new Promise((c,i)=>{e(o).then(t=>{const s=document.createElement("a");s.href=t.src,s.download=r||`screencapture-${o.width}x${o.height}.png`,s.click(),c()}).catch(t=>{i(t)})})}return{Utils:Object.freeze(Object.defineProperty({__proto__:null,getViewportImage:e,saveScreenCapture:n},Symbol.toStringTag,{value:"Module"}))}});