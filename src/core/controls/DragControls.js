import {
	EventDispatcher,
	Matrix4,
	Plane,
	Raycaster,
	Vector2,
	Vector3
} from 'three';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _pointer = new Vector2();
const _offset = new Vector3();
const _intersection = new Vector3();
const _worldPosition = new Vector3();
const _inverseMatrix = new Matrix4();

class DragControls extends EventDispatcher {
	constructor( _objects, _camera, _domElement ) {
		super();

		_domElement.style.touchAction = 'none'; // disable touch scroll

		let _selected = null, _hovered = null;

		const _intersections = [];

		//

		let isMove = false;

		const scope = this;

		function activate() {
			_domElement.addEventListener( 'pointermove', onPointerMove );
			_domElement.addEventListener( 'pointerdown', onPointerDown );
			_domElement.addEventListener( 'pointerup', onPointerCancel );
			_domElement.addEventListener( 'pointerleave', onPointerCancel );
		}

		function deactivate() {
			_domElement.removeEventListener( 'pointermove', onPointerMove );
			_domElement.removeEventListener( 'pointerdown', onPointerDown );
			_domElement.removeEventListener( 'pointerup', onPointerCancel );
			_domElement.removeEventListener( 'pointerleave', onPointerCancel );

			_domElement.style.cursor = '';
		}

		function dispose() {
			deactivate();
		}

		function setObjects( objects ) {
			_objects = objects;
		}

		function getObjects() {
			return _objects;
		}

		function getRaycaster() {
			return _raycaster;
		}

		function onPointerMove( event ) {

			if ( !scope.enabled || !scope.enabledMove) return;

			isMove = true;

			updatePointer( event );

			_raycaster.setFromCamera( _pointer, _camera );

			if ( _selected ) {

				if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

					_selected.position.copy( _intersection.sub( _offset ).applyMatrix4( _inverseMatrix ) );

				}

				scope.dispatchEvent( { type: 'drag', object: _selected } );

				return;

			}

			// hover support

			if ( event.pointerType === 'mouse' || event.pointerType === 'pen' ) {

				_intersections.length = 0;

				_raycaster.setFromCamera( _pointer, _camera );
				_raycaster.intersectObjects( _objects, true, _intersections );

				if ( _intersections.length > 0 ) {

					const object = _intersections[ 0 ].object;

					_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( object.matrixWorld ) );

					if ( _hovered !== object && _hovered !== null ) {

						scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

						_domElement.style.cursor = 'auto';
						_hovered = null;

					}

					if ( _hovered !== object ) {

						scope.dispatchEvent( { type: 'hoveron', object: object } );

						_domElement.style.cursor = 'pointer';
						_hovered = object;

					}

				} else {

					if ( _hovered !== null ) {

						scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

						_domElement.style.cursor = 'auto';
						_hovered = null;

					}

				}

			}

		}

		function onPointerDown( event ) {
			if (scope.enabled === false) return;

			updatePointer(event);

			_intersections.length = 0;

			_raycaster.setFromCamera( _pointer, _camera );
			let objects = _objects;
			if(window.viewer.modules.transformControls){
				if(window.viewer.modules.transformControls.object && window.viewer.modules.transformControls._gizmo){
					// 如果有transformControls，就把transformControls的gizmo(仅箭头)也加进来
					objects = objects.concat(Object.values(window.viewer.modules.transformControls._gizmo.picker));
				}
			}

			_raycaster.intersectObjects( objects, true, _intersections );

			if (_intersections.length > 0) {
				_selected = (scope.transformGroup === true) ? _objects[ 0 ] : _intersections[0].object;

				if(scope.enabledMove) {
					_plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(_selected.matrixWorld));
					if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
						_inverseMatrix.copy(_selected.parent.matrixWorld).invert();
						_offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
					}

					_domElement.style.cursor = 'move';
				}
				scope.dispatchEvent( { type: 'dragstart', object: _selected,e:event } );
			}

			isMove = false;
		}

		function onPointerCancel(event) {
			if ( scope.enabled === false ) return;

			if ( _selected ) {
				scope.dispatchEvent( { type: 'dragend', object: _selected,e:event } );
				_selected = null;
			}else if(!isMove){
				// 添加点击空白处的事件
				scope.dispatchEvent( { type: 'clickblank',e:event } );
			}

			_domElement.style.cursor = _hovered ? 'pointer' : 'auto';
		}

		function updatePointer( event ) {
			const rect = _domElement.getBoundingClientRect();

			_pointer.x = ( event.clientX - rect.left ) / rect.width * 2 - 1;
			_pointer.y = - ( event.clientY - rect.top ) / rect.height * 2 + 1;
		}

		activate();

		// API

		this.enabled = true;
		this.enabledMove = true;
		this.transformGroup = false;

		this.activate = activate;
		this.deactivate = deactivate;
		this.dispose = dispose;
		this.setObjects = setObjects;
		this.getObjects = getObjects;
		this.getRaycaster = getRaycaster;

	}

}

export { DragControls };
