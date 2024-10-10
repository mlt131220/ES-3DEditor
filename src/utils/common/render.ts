import { h } from 'vue';
import type { Component } from 'vue'
import { NIcon } from 'naive-ui';

/**
 * 渲染icon
 * @param icon vicons
 * @returns 
 */
export function renderIcon(icon: Component) {
	return () => h(NIcon, null, { default: () => h(icon) });
}
