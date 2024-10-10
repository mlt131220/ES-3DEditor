import { join } from 'node:path';
import pkg from 'fs-extra';
import dotenv from "dotenv";

/**
 * 读取所有环境变量配置文件以处理.env
 */
export function wrapperEnv(envConf) {
    const ret:any = {};

    for (const envName of Object.keys(envConf)) {
        let realName = envConf[envName].replace(/\\n/g, '\n');
        realName = realName === 'true' ? true : realName === 'false' ? false : realName;

        if (envName === 'VITE_PORT') {
            realName = Number(realName);
        }
        
        ret[envName] = realName;
        if (typeof realName === 'string') {
            process.env[envName] = realName;
        } else if (typeof realName === 'object') {
            process.env[envName] = JSON.stringify(realName);
        }
    }
    return ret;
}

/**
 * 获取当前环境下生效的配置文件名
 */
function getConfFiles() {
    const script = process.env.npm_lifecycle_script;
    const reg = new RegExp('--mode ([a-z_\\d]+)');
    const result = reg.exec(script as string) as any;
    if (result) {
        const mode = result[1] as string;
        return ['.env', `.env.${mode}`];
    }
    return ['.env', '.env.production'];
}

/**
 * 获取以指定前缀开头的环境变量
 * @param match prefix
 * @param confFiles ext
 */
export async function getEnvConfig(match = 'VITE_GLOB_', confFiles = getConfFiles()) {
    let envConfig = {};
    for (const confFile of confFiles) {
        try {
            const envPath = await pkg.readFile(join(process.cwd(), confFile), { encoding: 'utf8' });
            const env = dotenv.parse(envPath);
            envConfig = { ...envConfig, ...env };
        } catch (e) {
            console.error(`Error in parsing ${confFile}`, e);
        }
    }
    const reg = new RegExp(`^(${match})`);
    Object.keys(envConfig).forEach((key) => {
        if (!reg.test(key)) {
            Reflect.deleteProperty(envConfig, key);
        }
    });
    return envConfig;
}
