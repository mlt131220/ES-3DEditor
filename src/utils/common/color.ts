export function strToHex(str: string) {
    const result: string[] = [];
    for (let i = 0; i < str.length; ++i) {
        const hex = str.charCodeAt(i).toString(16);
        result.push(('000' + hex).slice(-4));
    }
    return result.join('').toUpperCase();
}

// 10进制转rgba
export function decToRgb(number:number) {
    const blue = number & 0xff;
    const green = number >> 8 & 0xff;
    const red = number >> 16 & 0xff;
    return `rgb(${red}, ${green}, ${blue})`;
}