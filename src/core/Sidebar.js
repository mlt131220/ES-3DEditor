import { UITabbedPanel, UISpan } from './libs/ui.js';

import { SidebarScript } from './Sidebar.Script.js';
import { SidebarAnimation } from './Sidebar.Animation.js';

function Sidebar( editor ) {

	const strings = editor.strings;

	const container = new UITabbedPanel();
	container.setId( 'sidebar' );

	const scene = new UISpan().add(
		new SidebarAnimation( editor ),
		new SidebarScript( editor )
	);
	const settings = new SidebarSettings( editor );

	//container.addTab( 'scene', strings.getKey( 'sidebar/scene' ), scene );
	container.select( 'scene' );

	return container;

}

export { Sidebar };
