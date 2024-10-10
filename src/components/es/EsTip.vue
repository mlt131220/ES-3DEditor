<script setup lang="ts">
import { AlertCircleOutline } from '@vicons/ionicons5';

withDefaults(defineProps<{
    size: string,
    trigger: 'click' | 'hover' | 'focus' | 'manual',
    placement:'top-start' | 'top' | 'top-end' | 'right-start' | 'right' | 'right-end' | 'bottom-start' | 'bottom' | 'bottom-end' | 'left-start' | 'left' | 'left-end'
}>(), {
    size: '18',
    trigger: "hover",
    placement:'top'
})
</script>

<template>
    <div class="inline-block flex items-center justify-center cursor-pointer">
        <n-tooltip :trigger="trigger" :placement="placement">
            <template #trigger>
                <n-icon :size="size">
                    <AlertCircleOutline />
                </n-icon>
            </template>
            <slot></slot>
        </n-tooltip>
    </div>
</template>