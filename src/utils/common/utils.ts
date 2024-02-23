import {TreeOption} from 'naive-ui';
import {BASE64_TYPES} from "@/config/global";

/**
 * 下载blob二进制对象
 * @param blob
 * @param filename
 */
const link = document.createElement('a');

export function downloadBlob(blob, filename) {
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }

    link.href = URL.createObjectURL(blob);
    link.download = filename || 'data.json';
    link.dispatchEvent(new MouseEvent('click'));
}

/**
 * 下载ArrayBuffer对象
 * @param buffer
 * @param filename
 */
export function saveArrayBuffer(buffer, filename) {
    downloadBlob(new Blob([buffer], {type: 'application/octet-stream'}), filename);
}

/**
 * 下载text文档
 * @param text
 * @param filename
 */
export function saveString(text, filename) {
    downloadBlob(new Blob([text], {type: 'text/plain'}), filename);
}

// 替换字符
export function escapeHTML(html) {
    return html
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * naive UI树结构寻找对应节点位置及所处父节点
 * @param node 目标节点
 * @param nodes 树数据
 */
export function findSiblingsAndIndex(node: TreeOption, nodes?: TreeOption[]): [TreeOption[], number] | [null, null] {
    if (!nodes) return [null, null];
    for (let i = 0; i < nodes.length; ++i) {
        const siblingNode = nodes[i];
        if (siblingNode.key === node.key) return [nodes, i];

        const [siblings, index] = findSiblingsAndIndex(node, siblingNode.children)
        if (siblings && index !== null) return [siblings, index];
    }
    return [null, null];
}

// base64 转 File
export function base64ToFile(dataurl, filename) {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], `${filename}.${BASE64_TYPES[arr[0]]}`, {type: mime});
}

/**
 * 防抖函数
 */
export function debounce(fn, delay) {
    let timer: NodeJS.Timeout | null = null;
    return function () {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(fn, delay);
    };
}

/**
 * 节流函数
 */
export function throttle(func, wait) {
    let timer: NodeJS.Timeout | null = null;
    return function (e) {
        if (timer) return;
        timer = setTimeout(function () {
            func(e);
            timer = null;
        }, wait)
    }
}

/**
 * 求次幂
 */
export function pow1024(num) {
    return Math.pow(1024, num)
}