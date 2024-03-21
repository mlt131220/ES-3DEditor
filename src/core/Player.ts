import { APP } from './libs/app.js';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";

let sceneResizeFn,startPlayerFn,stopPlayerFn;
export class Player{
	player = new APP.Player();
	playerDom:HTMLDivElement;

	constructor() {
		this.playerDom = document.getElementById("player") as HTMLDivElement;
		this.playerDom.appendChild(this.player.dom);

		window.addEventListener('resize', () => {
			this.player.setSize(this.playerDom.clientWidth, this.playerDom.clientHeight);
		});

		sceneResizeFn = this.sceneResize.bind(this);
		useAddSignal("sceneResize",sceneResizeFn);
		startPlayerFn = this.startPlayer.bind(this);
		useAddSignal("startPlayer",startPlayerFn);
		stopPlayerFn = this.stopPlayer.bind(this);
		useAddSignal("stopPlayer",stopPlayerFn);
	}

	sceneResize(){
		this.player.setSize(this.playerDom.clientWidth, this.playerDom.clientHeight);
	}

	startPlayer(){
		this.player.load( window.editor.toJSON() );
		this.player.setSize(this.playerDom.clientWidth, this.playerDom.clientHeight);
		this.player.play();
	}

	stopPlayer(){
		this.player.stop();
		this.player.dispose();
	}

	dispose(){
		useRemoveSignal("sceneResize",sceneResizeFn);
		sceneResizeFn = undefined;
		useRemoveSignal("startPlayer",startPlayerFn);
		startPlayerFn = undefined;
		useRemoveSignal("stopPlayer",stopPlayerFn);
		stopPlayerFn = undefined;
	}
}
