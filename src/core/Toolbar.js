import { UIPanel, UIButton, UICheckbox } from './libs/ui.js';
import {useAddSignal,useDispatchSignal} from "@/hooks/useSignal";

function Toolbar() {
	const strings = editor.strings;

	const container = new UIPanel();
	container.setId( 'toolbar' );

	// translate / rotate / scale
	const translateIcon = document.createElement( 'img' );
	translateIcon.title = strings.getKey( 'toolbar/translate' );
	translateIcon.src = '/static/images/translate.svg';

	const translate = new UIButton();
	translate.dom.className = 'Button selected';
	translate.dom.appendChild( translateIcon );
	translate.onClick(function () {
		useDispatchSignal("transformModeChanged",'translate');
	});
	container.add( translate );

	const rotateIcon = document.createElement( 'img' );
	rotateIcon.title = strings.getKey( 'toolbar/rotate' );
	rotateIcon.src = '/static/images/rotate.svg';

	const rotate = new UIButton();
	rotate.dom.appendChild( rotateIcon );
	rotate.onClick(function () {
		useDispatchSignal("transformModeChanged",'rotate');
	});
	container.add( rotate );

	const scaleIcon = document.createElement( 'img' );
	scaleIcon.title = strings.getKey( 'toolbar/scale' );
	scaleIcon.src = '/static/images/scale.svg';

	const scale = new UIButton();
	scale.dom.appendChild( scaleIcon );
	scale.onClick( function () {
		useDispatchSignal("transformModeChanged",'scale');
	} );
	container.add( scale );

	const local = new UICheckbox( false );
	local.dom.title = strings.getKey( 'toolbar/local' );
	local.onChange(function () {
		useDispatchSignal("spaceChanged",this.getValue() === true ? 'local' : 'world');
	});
	container.add( local );

	//
	useAddSignal("transformModeChanged",function ( mode ) {

		translate.dom.classList.remove( 'selected' );
		rotate.dom.classList.remove( 'selected' );
		scale.dom.classList.remove( 'selected' );

		switch ( mode ) {

			case 'translate': translate.dom.classList.add( 'selected' ); break;
			case 'rotate': rotate.dom.classList.add( 'selected' ); break;
			case 'scale': scale.dom.classList.add( 'selected' ); break;

		}

	})
	return container;
}

export { Toolbar };
