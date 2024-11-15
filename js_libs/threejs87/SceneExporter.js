/**
 * @author alteredq / http://alteredqualia.com/
 */
THREE.SceneExporter = function () { };

THREE.SceneExporter.prototype = {

    constructor: THREE.SceneExporter,

    parse: function (scene) {

        var position = Vector3String(scene.position);
        var rotation = Vector3String(scene.rotation);
        var scale = Vector3String(scene.scale);

        var nobjects = 0;
        var ngeometries = 0;
        var nmaterials = 0;
        var ntextures = 0;

        var objectsArray = [];
        var geometriesArray = [];
        var materialsArray = [];
        var texturesArray = [];
        var fogsArray = [];

        var geometriesMap = {};
        var materialsMap = {};
        var texturesMap = {};

        // extract objects, geometries, materials, textures

        var checkTexture = function (map) {

            if (!map) return;

            if (!(map.id in texturesMap)) {

                texturesMap[map.id] = true;
                texturesArray.push(TextureString(map));
                ntextures += 1;
            }

        };

        var linesArray = [];

        /**
         * This does the core translation
         *
         * @param object
         * @param pad
         * @param whocalls
         */
        function createObjectsList(object, pad, whocalls) {

            for (var i = 0; i < object.children.length; i++) {

                var node = object.children[i];

                if ((node.name === 'rayLine' ||
                    node.name === 'mylightAvatar' ||
                    node.name === 'mylightOrbit' ||
                    node.name === 'SteveShieldMesh' ||
                    node.name === 'Steve' ||
                    node.name === 'SteveMesh' || node.name === 'avatarPitchObject' ||
                    node.name === 'orbitCamera' || node.name === 'myAxisHelper' ||
                    node.name === 'myGridHelper' || node.name === 'myTransformControls'
                    || node['category_name'] === 'lightHelper'
                    || node['category_name'] === 'lightTargetSpot'
                    || node.name === 'Camera3Dmodel'
                    || node.name === 'Camera3DmodelMesh'
                    || typeof node['category_name'] === 'undefined') && node.name !== 'avatarCamera')
                    continue;


                if (node instanceof THREE.Mesh && node['category_name'] !== "pawn")
                    continue;

                if (node instanceof THREE.Mesh && node['category_name'] === "pawn") {

                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;

                } else if (node instanceof THREE.Mesh) {

                    linesArray.push(MeshString(node, pad));
                    nobjects += 1;

                    if (!(node.geometry.id in geometriesMap)) {
                        geometriesMap[node.geometry.id] = true;
                        geometriesArray.push(GeometryString(node.geometry));
                        ngeometries += 1;
                    }

                    if (!(node.material.id in materialsMap)) {

                        materialsMap[node.material.id] = true;
                        materialsArray.push(MaterialString(node.material));
                        nmaterials += 1;

                        checkTexture(node.material.map);
                        checkTexture(node.material.envMap);
                        checkTexture(node.material.lightMap);
                        checkTexture(node.material.specularMap);
                        checkTexture(node.material.bumpMap);
                        checkTexture(node.material.normalMap);

                    }

                } else if (node instanceof THREE.Light) {


                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;


                } else if (node instanceof THREE.Camera || node instanceof THREE.CameraHelper) {
                    node['category_name'] = "camera";
                    linesArray.push(ObjectString(node, pad));

                    // linesArray.push( CameraString( node, pad ) );
                    // nobjects += 1;
                    continue;
                } else if (node instanceof THREE.Object3D) {

                    // Everything is Object3D !
                    // What remains here is the (Groups) = 3d models obj to load


                    if (node.name === "bbox" || node.name === "xline" || node.name === "yline" ||
                        node.name === "zline" || node.name === 'SteveOld')
                        continue;


                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;
                }

                if (node.children.length > 0) {
                    linesArray.push(PaddingString(pad + 1) + '\t\t"children" : {');
                }

                createObjectsList(node, pad + 2, pad + 2);

                if (node.children.length > 0) {
                    linesArray.push(PaddingString(pad + 1) + "\t\t}");
                }

                linesArray.push(PaddingString(pad) + "\t\t}"
                    // + ( i < object.children.length - 1 ? ",\n" : "" )
                );

            }

        }

        // ignite the loop
        createObjectsList(scene, 0, "pad 0");

        var objects = linesArray.join("\n");

        // extract fog if exists
        if (scene.fog) {
            fogsArray.push(FogString(scene.fog));
        }


        // generate sections
        var geometries = generateMultiLineString(geometriesArray, ",\n\n\t");
        var materials = generateMultiLineString(materialsArray, ",\n\n\t");
        var textures = generateMultiLineString(texturesArray, ",\n\n\t");
        var fogs = generateMultiLineString(fogsArray, ",\n\n\t");

        // generate defaults

        var activeCamera = null;

        scene.traverse(function (node) {
            if (node instanceof THREE.Camera && node.userData.active) {
                activeCamera = node;
            }
        });


        function ObjectString(o, n) {

            let ignoredKeys = ['matrixAutoUpdate', 'matrixWorldNeedsUpdate', 'visible', 'castShadow', 'receiveShadow', 'frustumCulled', 'renderOrder', 'draggable', 'class', 'isGroup']

            // ALL 3D ASSETS
            if (o.name != 'avatarCamera'
                && !o['category_name'].includes('lightSun')
                && !o['category_name'].includes('lightTargetSpot')
                && !o['category_name'].includes('lightLamp')
                && !o['category_name'].includes('lightSpot')
                && !o['category_name'].includes('lightAmbient')
                && !o['category_name'].includes('pawn'))
            {

                let quatR = new THREE.Quaternion();
                let eulerR = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR.setFromEuler(eulerR);

                let entryObject = {};

                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }
                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR._x, quatR._y, quatR._z];

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);


                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];
            }
            else if (o['category_name'] === "lightSun") {

                let quatR_light = new THREE.Quaternion();
                let eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR_light._x, quatR_light._y, quatR_light._z, quatR_light._w];
                entryObject.targetposition = [o.target.position.x, o.target.position.y, o.target.position.z];
                entryObject.lightcolor = [parseFloat(o.color.r).toFixed(3), parseFloat(o.color.g).toFixed(3), parseFloat(o.color.b).toFixed(3)];
                entryObject.lightintensity = o.intensity;
                entryObject.shadowCameraBottom =  o.shadowCameraBottom;

                delete entryObject.intensity;

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);

                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];

            }
            else if (o['category_name'] === "lightLamp") {

                let quatR_light = new THREE.Quaternion();
                let eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR_light._x, quatR_light._y, quatR_light._z, quatR_light._w];
                entryObject.lightcolor = [parseFloat(o.color.r).toFixed(3), parseFloat(o.color.g).toFixed(3), parseFloat(o.color.b).toFixed(3)];
                entryObject.lightdecay = o.decay;
                delete entryObject.decay;
                entryObject.lightdistance = o.distance;
                delete entryObject.distance;
                entryObject.shadowRadius = o.shadow.radius;
                delete entryObject.shadow;
                entryObject.lightintensity = o.intensity;
                delete entryObject.intensity;

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);
                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];

            }
            else if (o['category_name'] === "lightSpot") {

                let quatR_light = new THREE.Quaternion();
                let eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR_light._x, quatR_light._y, quatR_light._z, quatR_light._w];
                entryObject.targetposition = [o.target.position.x, o.target.position.y, o.target.position.z];
                entryObject.lightcolor = [parseFloat(o.color.r).toFixed(3), parseFloat(o.color.g).toFixed(3), parseFloat(o.color.b).toFixed(3)];
                entryObject.lightintensity = o.intensity;
                delete entryObject.intensity;
                entryObject.lightdecay = o.decay;
                delete entryObject.decay;
                entryObject.lightdistance = o.distance;
                delete entryObject.distance;
                entryObject.lightangle = o.angle;
                delete entryObject.angle;
                entryObject.lightpenumbra = o.penumbra;
                delete entryObject.penumbra;
                // entryObject.lighttargetobjectname = o.target.name;

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);
                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];

            }
            else if (o['category_name'] === "lightAmbient") {

                let quatR_light = new THREE.Quaternion();
                let eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR_light._x, quatR_light._y, quatR_light._z, quatR_light._w];
                entryObject.lightcolor = [parseFloat(o.color.r).toFixed(3), parseFloat(o.color.g).toFixed(3), parseFloat(o.color.b).toFixed(3)];
                entryObject.lightintensity = o.intensity;
                delete entryObject.intensity;

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);
                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];


            }
            else if (o['category_name'] === "pawn") {

                let quatR_light = new THREE.Quaternion();
                let eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.rotation.x, o.rotation.y, o.rotation.z];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatR_light._x, quatR_light._y, quatR_light._z, quatR_light._w];

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);
                var output = ['\t\t' + ',' + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? ',' : '') ];

            }
            else if (o.name === 'avatarCamera') {

                let quatCombined = new THREE.Quaternion();
                let camEulerCombined = new THREE.Euler(- o.children[0].rotation._x, (Math.PI - o.rotation.y) % (2 * Math.PI), 0, 'YXZ');
                quatCombined.setFromEuler(camEulerCombined);

                // Player is only around y
                let quatR_player = new THREE.Quaternion();
                let eulerR_player = new THREE.Euler(0, (Math.PI - o.rotation._y) % (2 * Math.PI), 0, 'YXZ');
                quatR_player.setFromEuler(eulerR_player);


                // Camera is only around x
                let quatR_camera = new THREE.Quaternion();
                let eulerR_camera = new THREE.Euler(-o.children[0].rotation._x, 0, 0, 'YXZ');
                quatR_camera.setFromEuler(eulerR_camera);

                let entryObject = {};
                for (let entry in Object.keys(o)) {
                    if(typeof (Object.values(o)[entry]) !== 'object') {
                        if (!ignoredKeys.includes(Object.keys(o)[entry])) {
                            entryObject[Object.keys(o)[entry]] = Object.values(o)[entry];
                        }
                    }
                }

                entryObject.position = [o.position.x, o.position.y, o.position.z];
                entryObject.rotation = [o.children[0].rotation._x, o.rotation.y, 0];
                entryObject.scale = [o.scale.x, o.scale.y, o.scale.z];
                entryObject.quaternion = [quatCombined._x.toFixed(4), quatCombined._y.toFixed(4), quatCombined._z.toFixed(4), quatCombined._w.toFixed(4)];
                entryObject.quaternion_player = [quatR_player._x.toFixed(4), quatR_player._y.toFixed(4), quatR_player._z.toFixed(4), quatR_player._w.toFixed(4)];
                entryObject.quaternion_camera = [quatR_camera._x.toFixed(4), quatR_camera._y.toFixed(4), quatR_camera._z.toFixed(4), quatR_camera._w.toFixed(4)];

                entryObject.category_name = 'avatarYawObject';

                let stringObj = JSON.stringify(entryObject);
                stringObj = stringObj.slice(0, -1);
                var output = ['\t\t'  + LabelString(getObjectName(o)) + ' : ' + stringObj + (o.children.length ? '' : '') + '}'  ];

            }

            return generateMultiLineString(output, '\n\t\t', n);
        }

        function mradians2degrees(x) {

            var out = x - (x / (2 * Math.PI) >> 0) * 2 * Math.PI;

            return out;
        }

        function MeshString(o, n) {

            var output = [

                '\t\t' + LabelString(getObjectName(o)) + ' : {',
                '	"geometry" : ' + LabelString(getGeometryName(o.geometry)) + ',',
                '	"material" : ' + LabelString(getMaterialName(o.material)) + ',',
                '	"position" : ' + Vector3String(o.position) + ',',
                '	"rotation" : ' + Vector3String(o.rotation) + ',',
                '	"scale"	   : ' + Vector3String(o.scale) + ',',
                '	"visible"  : ' + o.visible + (o.children.length ? ',' : '')

            ];

            return generateMultiLineString(output, '\n\t\t', n);
        }

        function GeometryString(g) {

            if (g instanceof THREE.SphereGeometry) {

                var output = [

                    '\t' + LabelString(getGeometryName(g)) + ': {',
                    '	"type"    : "sphere",',
                    '	"radius"  : ' + g.parameters.radius + ',',
                    '	"widthSegments"  : ' + g.parameters.widthSegments + ',',
                    '	"heightSegments" : ' + g.parameters.heightSegments,
                    '}'

                ];

            } else if (g instanceof THREE.BoxGeometry) {

                var output = [

                    '\t' + LabelString(getGeometryName(g)) + ': {',
                    '	"type"    : "cube",',
                    '	"width"  : ' + g.parameters.width + ',',
                    '	"height"  : ' + g.parameters.height + ',',
                    '	"depth"  : ' + g.parameters.depth + ',',
                    '	"widthSegments"  : ' + g.widthSegments + ',',
                    '	"heightSegments" : ' + g.heightSegments + ',',
                    '	"depthSegments" : ' + g.depthSegments,
                    '}'

                ];

            } else if (g instanceof THREE.PlaneGeometry) {

                var output = [

                    '\t' + LabelString(getGeometryName(g)) + ': {',
                    '	"type"    : "plane",',
                    '	"width"  : ' + g.parameters.width + ',',
                    '	"height"  : ' + g.parameters.height + ',',
                    '	"widthSegments"  : ' + g.parameters.widthSegments + ',',
                    '	"heightSegments" : ' + g.parameters.heightSegments,
                    '}'

                ];

            } else if (g instanceof THREE.Geometry) {

                if (g.sourceType === "ascii" || g.sourceType === "ctm" || g.sourceType === "stl" || g.sourceType === "vtk") {

                    var output = [

                        '\t' + LabelString(getGeometryName(g)) + ': {',
                        '	"type" : ' + LabelString(g.sourceType) + ',',
                        '	"url"  : ' + LabelString(g.sourceFile),
                        '}'

                    ];

                } else {

                    var output = [];

                }

            } else {

                var output = [];

            }

            return generateMultiLineString(output, '\n\t\t');

        }

        function MaterialString(m) {

            if (m instanceof THREE.MeshBasicMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshBasicMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' + m.color.getHex() + ',',

                    m.map ? '		"map" : ' + LabelString(getTextureName(m.map)) + ',' : '',
                    m.envMap ? '		"envMap" : ' + LabelString(getTextureName(m.envMap)) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString(getTextureName(m.specularMap)) + ',' : '',
                    m.lightMap ? '		"lightMap" : ' + LabelString(getTextureName(m.lightMap)) + ',' : '',

                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' + m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];


            } else if (m instanceof THREE.MeshLambertMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshLambertMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' + m.color.getHex() + ',',
                    //'		"ambient"  : ' 	+ m.ambient.getHex() + ',',
                    //'		"emissive"  : ' + m.emissive.getHex() + ',',

                    m.map ? '		"map" : ' + LabelString(getTextureName(m.map)) + ',' : '',
                    m.envMap ? '		"envMap" : ' + LabelString(getTextureName(m.envMap)) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString(getTextureName(m.specularMap)) + ',' : '',
                    m.lightMap ? '		"lightMap" : ' + LabelString(getTextureName(m.lightMap)) + ',' : '',

                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' + m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if (m instanceof THREE.MeshPhongMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshPhongMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' + m.color.getHex() + ',',
                    //'		"ambient"  : ' 	+ m.ambient.getHex() + ',',
                    //'		"emissive"  : ' + m.emissive.getHex() + ',',
                    '		"specular"  : ' + m.specular.getHex() + ',',
                    '		"shininess" : ' + m.shininess + ',',

                    m.map ? '		"map" : ' + LabelString(getTextureName(m.map)) + ',' : '',
                    m.envMap ? '		"envMap" : ' + LabelString(getTextureName(m.envMap)) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString(getTextureName(m.specularMap)) + ',' : '',
                    m.lightMap ? '		"lightMap" : ' + LabelString(getTextureName(m.lightMap)) + ',' : '',
                    m.normalMap ? '		"normalMap" : ' + LabelString(getTextureName(m.normalMap)) + ',' : '',
                    m.bumpMap ? '		"bumpMap" : ' + LabelString(getTextureName(m.bumpMap)) + ',' : '',

                    '		"bumpScale"  : ' + m.bumpScale + ',',
                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' + m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if (m instanceof THREE.MeshDepthMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshDepthMaterial",',
                    '	"parameters"  : {',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' + m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if (m instanceof THREE.MeshNormalMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshNormalMaterial",',
                    '	"parameters"  : {',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' + m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if (m instanceof THREE.MeshFaceMaterial) {

                var output = [

                    '\t' + LabelString(getMaterialName(m)) + ': {',
                    '	"type"    : "MeshFaceMaterial",',
                    '	"parameters"  : {}',
                    '}'

                ];

            }

            return generateMultiLineString(output, '\n\t\t');

        }

        function TextureString(t) {

            // here would be also an option to use data URI
            // with embedded image from "t.image.src"
            // (that's a side effect of using FileReader to load images)

            var output = [

                '\t' + LabelString(getTextureName(t)) + ': {',
                '	"url"    : "' + t.sourceFile + '",',
                '	"repeat" : ' + Vector2String(t.repeat) + ',',
                '	"offset" : ' + Vector2String(t.offset) + ',',
                '	"magFilter" : ' + NumConstantString(t.magFilter) + ',',
                '	"minFilter" : ' + NumConstantString(t.minFilter) + ',',
                '	"anisotropy" : ' + t.anisotropy,
                '}'

            ];

            return generateMultiLineString(output, '\n\t\t');

        }

        //

        function FogString(f) {

            if (f instanceof THREE.Fog) {

                var output = [

                    '\t' + LabelString(getFogName(f)) + ': {',
                    '	"type"  : "linear",',
                    '	"color" : ' + ColorString(f.color) + ',',
                    '	"near"  : ' + f.near + ',',
                    '	"far"   : ' + f.far,
                    '}'

                ];

            } else if (f instanceof THREE.FogExp2) {

                var output = [

                    '\t' + LabelString(getFogName(f)) + ': {',
                    '	"type"    : "exp2",',
                    '	"color"   : ' + ColorString(f.color) + ',',
                    '	"density" : ' + f.density,
                    '}'

                ];

            } else {

                var output = [];

            }

            return generateMultiLineString(output, '\n\t\t');

        }

        if (objects.substr(objects.length - 2, 1) == ',')
            objects = objects.substr(0, objects.length - 2) + '\n';


        // Create fog string to avoid large gaps in the string
        let fogString = '';
        // if(envir.scene.fogCategory) {
        //     // fogString ='' +
        //     // '"fogCategory" : "' + (envir.scene.fogCategory ? envir.scene.fogCategory : 'none') + '",';
        //     // '"fogcolor" : "#' + (envir.scene.fog.color ? envir.scene.fog.color.getHexString() : '000000') + '",' +
        //     // '"fogfar" : "' + (envir.scene.fog.far ? envir.scene.fog.far : '1000000') + '",' +
        //     // '"fognear" : "' + (envir.scene.fog.near ? envir.scene.fog.near : '1000000') + '",' +
        //     // '"fogdensity" : "' + (envir.scene.fog.density ? envir.scene.fog.density : '0.00000001') + '",';
            
        // }

        var output = [
            '{',
            '	"metadata": {',
            '		"formatVersion" : 4.0,',
            '		"type"		: "scene",',
            '		"generatedBy"	: "SceneExporter.js",',
            '		"timestamp"	: '+ Date.now()  +',',
            '		"ClearColor" : "#' + (envir.scene.background.isColor ? envir.scene.background.getHexString() : '000000') + '",',
            '		"toneMappingExposure" : "' + envir.renderer.toneMappingExposure + '",',
            '		"enableGeneralChat" : "' + (!!envir.scene.enableGeneralChat) + '",',
            '		"fogCategory" : "' + (envir.scene.fogCategory ? envir.scene.fogCategory : 0) + '",',
            '       "fogcolor" : "' + (envir.scene.fogcolor ? envir.scene.fogcolor : '#FFFFFF') + '",',
            '       "fogfar" : "' + (envir.scene.fogfar ? envir.scene.fogfar : '1000') + '",' ,
            '       "fognear" : "' + (envir.scene.fognear ? envir.scene.fognear : '0') + '",', 
            '       "fogdensity" : "' + (envir.scene.fogdensity ? envir.scene.fogdensity : '0.00000001') + '",',
            '		"enableAvatar" : "' + (!!envir.scene.enableAvatar) + '",',
            '		"disableMovement" : "' + (!!envir.scene.disableMovement) + '",',
            '		"backgroundPresetOption" : "' + (envir.scene.preset_selection ? envir.scene.preset_selection : 'None') + '",',
            '		"backgroundStyleOption" : "' + (envir.scene.bcg_selection ? envir.scene.bcg_selection : '0') + '",',
            '		"backgroundImagePath" : "' + (envir.scene.img_bcg_path ? envir.scene.img_bcg_path : '0') + '",',
            '		"objects"       : ' + nobjects + //+  ',',
            '	},',
            '	"urlBaseType": "relativeToScene",',
            '	"objects" :',
            '	{',
            objects,
            '	}',    // Original line:   '	},',
            '}'
        ].join('\n');

        return output; //JSON.parse( output );
    }

}
