/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/3/19 11:12
 * @description 异步引入monaco-editor
 */
import loader from '@monaco-editor/loader'
import {ref} from 'vue'

const monacoRef = ref<any>(null);
loader.config({
    paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs"
    }
});

const initMonaco = () => {
    return new Promise<void>((resolve, reject) => {
        if (monacoRef.value) {
            resolve();
            return;
        }

        loader.init().then((monacoInstance) => {
            monacoRef.value = monacoInstance;
            resolve();
        }).catch((error) => {
            if (error?.type !== 'cancelation') {
                console.error('Monaco initialization error:', error);
                reject();
            }
        })
    })
}

export function useMonacoEditor() {
    return {
        initMonaco,
        monacoRef
    }
}
