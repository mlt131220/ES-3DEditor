declare interface Window {
	$t:(s: string)=>string;
	$cpt:(s: string)=>ComputedRef<string>;
	$loadingBar?: import("naive-ui").LoadingBarProviderInst;
	$dialog: import('naive-ui').DialogProviderInst;
	$message?: import('naive-ui').MessageProviderInst;
	$notification: import('naive-ui').NotificationProviderInst;
	editor: any;
	DrawViewer: any;
	CesiumApp:any;
	VRButton: any;
}

declare interface Number{
	format:()=>string
}

declare namespace Common {
	/**
	 * 策略模式
	 * [状态, 为true时执行的回调函数]
	 */
	type StrategyAction = [boolean, () => void];
}
