declare namespace IConfig {
    type Theme = 'osTheme' |'lightTheme' | 'darkTheme';

    type Locale = 'zh-CN' |'en-US';

    interface Color {
        CMYK:number[];
        RGB:number[];
        hex:string;
        hexHover?:string;
        hexPressed?:string;
        hexSuppl?:string;
        name:string;
        pinyin:string;
    }
}