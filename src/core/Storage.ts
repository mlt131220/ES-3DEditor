function Storage() {
	//@ts-ignore
	const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

	if (indexedDB === undefined) {
		console.warn('IndexedDB不可用.');
		return {
			init: function () {},
			addTable: function () {},
			read: function () {},
			get: function () {},
			set: function () {},
			clearTable: function () {},
			clear: function () {},
		};
	}

	const name = 'es-editor';
	const version = 1;

	let database;

	return {
		init(callback) {
			const request = indexedDB.open(name, version);
			request.onupgradeneeded = (event: any) => {
				database = event.target?.result;
				this.addTable('basic', undefined);
				this.addTable('images', 'uuid'); // 贴图表
				this.addTable('models', 'uuid'); //模型表
				this.addTable('geometry', 'uuid'); //几何数据表
				this.addTable('drawing', undefined); // 图纸表
			};

			request.onsuccess = (event: any) => {
				database = event.target?.result;

				callback();
			};

			request.onerror = function (event) {
				console.error('IndexedDB Init:', event);
			};
		},

		addTable(tableName, key) {
			if (database.objectStoreNames.contains(tableName)) return;
			database.createObjectStore(tableName, {
				keyPath: key,
			});
		},

		add(table, data, callback = () => {}) {
			// 开启事务
			try {
				const request = database
					.transaction([table], 'readwrite')
					.objectStore(table)
					.put(data);

				// 数据写入成功
				request.onsuccess = function () {
					console.log('数据写入成功');
					callback();
				};

				// 数据写入失败
				request.onerror = function (event) {
					console.log('数据写入失败', event, data);
				};
			} catch (e) {
				console.log('indexDB->add error data:', table, data, e);
			}
		},

		read(table, keyPath, callback) {
			const transaction = database.transaction([table]);
			const objectStore = transaction.objectStore(table);
			const request = objectStore.get(keyPath);

			request.onerror = function () {
				console.log('事务失败');
			};

			request.onsuccess = function () {
				if (request.result) {
					callback(request.result);
				} else {
					callback(null);
				}
			};
		},

		get(callback) {
			const transaction = database.transaction(['basic'], 'readwrite');
			const objectStore = transaction.objectStore('basic');
			const request = objectStore.get(0);
			request.onsuccess = event => {
				const sceneInfo = event.target.result;
				if (!sceneInfo) {
					callback(sceneInfo);
					return;
				}

				const sceneJson = sceneInfo.scene;
				let modelTotal = sceneInfo.modelTotal;

				//还原模型
				const reduModel = objects => {
					objects.children.forEach((child, index) => {
						this.read('models', child.uuid, model => {
							objects.children[index] = model;

							//判断是否存在子级,存在则继续遍历
							if (model?.children) reduModel(model);

							modelTotal--;
							if (modelTotal === 0) {
								console.log('indexDB GET:', sceneInfo);
								callback(sceneInfo);
							}
						});
					});
				};

				//还原几何数据
				const reduGeometry = () => {
					if(!sceneJson.geometries) return;
					let geoLength = sceneJson.geometries.length || 0;

					sceneJson.geometries.forEach((geoUuid, index) => {
						this.read('geometry', geoUuid, geometry => {
							sceneJson.geometries[index] = geometry;
							geoLength--;
							if (geoLength === 0) {
								//还原模型
								reduModel(sceneJson.object);
							}
						});
					});
				};

				//从贴图开始还原结构(判断是否有贴图)
                if(sceneJson.images){
                    let imagesLength = sceneJson.images.length;
				    sceneJson.images.forEach((imgUuid, index) => {
					    this.read('images', imgUuid, img => {
						    sceneJson.images[index] = img;
						    imagesLength--;
						    if (imagesLength === 0) {
							    //还原几何数据
							    reduGeometry();
						    }
					    });
				    });
                }else{
                    //还原几何数据
					reduGeometry();
                }

			};
		},

		set: function (sceneInfo) {
			const start = performance.now();
			console.log('indexDb set data:', sceneInfo);

			const sceneJson = sceneInfo.scene;
			let modelTotal = 0;

			//存储贴图(判断是否有贴图)
			if (sceneJson.images) {
				sceneJson.images = sceneJson.images.map(img => {
					this.add('images', img);
					return img.uuid;
				});
			}

			//存储几何数据(判断是否有几何数据)
			if (sceneJson.geometries) {
				sceneJson.geometries = sceneJson.geometries.map(item => {
					this.add('geometry', item);
					return item.uuid;
				});
			}

			//存储模型
			const getSceneTraverseModelsAll = object3d => {
				if (object3d.children) {
					for (let i = 0; i < object3d.children.length; i++) {
						getSceneTraverseModelsAll(object3d.children[i]);
						object3d.children[i] = {
							uuid: object3d.children[i].uuid,
						};
					}
				}

				modelTotal++;

				this.add('models', object3d);
			};
			sceneJson.object.children = sceneJson.object.children?.map(object3d => {
				getSceneTraverseModelsAll(object3d);

				return { uuid: object3d.uuid };
			});

			sceneInfo.modelTotal = modelTotal;

			const transaction = database.transaction(['basic'], 'readwrite');
			const objectStore = transaction.objectStore('basic');
			const request = objectStore.put(sceneInfo, 0);
			request.onsuccess = function () {
				//@ts-ignore
				console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', '保存至IndexedDB->es-editor.' + (performance.now() - start).toFixed(2) + 'ms');
			};
		},

		// 图纸 set get
		getDrawing(callback){
			const transaction = database.transaction(['drawing'], 'readwrite');
			const objectStore = transaction.objectStore('drawing');
			const request = objectStore.get(0);
			request.onsuccess = event => {
				callback(event.target.result);
			}

			request.onerror = function () {
				console.log('图纸数据获取失败');
				callback(undefined);
			};
		},

		setDrawing: function (drawingInfo) {
			const transaction = database.transaction(['drawing'], 'readwrite');
			const objectStore = transaction.objectStore('drawing');
			const request = objectStore.put(drawingInfo, 0);

			request.onsuccess = function () {
				console.log('图纸数据写入成功');
			};

			// 数据写入失败
			request.onerror = function (event) {
				console.log('图纸数据写入失败', event);
			};
		},

		clearTable(table) {
			if (database === undefined) return;

			const transaction = database.transaction([table], 'readwrite');
			const objectStore = transaction.objectStore(table);
			const request = objectStore.clear();

			request.onsuccess = () => {
				//@ts-ignore
				console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', `清空 ${table}表`);
			};
		},

		clear: function () {
			this.clearTable('basic');
			this.clearTable('images');
			this.clearTable('models');
			this.clearTable('geometry');
			this.clearTable('drawing');
		},
	};
}

export { Storage };
