window['requestAnimFrame'] = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Module = { TOTAL_MEMORY: 100*1024*1024 };

(function() {
    
    var projector, renderer, scene, light, camera, controls, wiper, wiperShape, wiperTransform,
        initScene, render, main, updatePhysics, wiperAmmo, wiperPos = 0,
        createBox, initControls, now, lastbox = 0, boxes = [], leftWiperPressed = false,
        fieldWidth = 550, fieldHeight = 850,
        COLORENUM = {Red: 0xFF0000,
                    Orange: 0xFF8600,
                    Blue: 0x1F7CFF,
                    Brown: 0x8B2500,
                    Gold: 0xFFB90F};
    
    initScene = function() {
        var collisionConfiguration, dispatcher, overlappingPairCache, solver, // Ammo world
            ground, groundShape, groundTransform, groundMass, localInertia, motionState, rbInfo, groundAmmo;
        
        
        // Projector
        projector = new THREE.Projector();
        
        
        // Renderer
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById( 'container' ).appendChild( renderer.domElement );
        
        
        // Scene
        scene = new THREE.Scene();
        
        // Light
        light = new THREE.DirectionalLight( 0xFFFFFF );
        light.position.set( 0, 700, 220 );
        light.target.position.copy( scene.position );
        light.castShadow = true;
        light.shadowCameraLeft = -25;
        light.shadowCameraTop = -25;
        light.shadowCameraRight = 25;
        light.shadowCameraBottom = 25;
        light.shadowBias = -.0001;
        scene.add( light );
        
        
        // Ammo world
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        overlappingPairCache = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        scene.world = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
        scene.world.setGravity(new Ammo.btVector3(0, -42, 50));
        
        
        // Camera
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        camera.position.set( 0, 800, 300 );
        camera.lookAt( scene.position );
        scene.add( camera );

        //trackball controls
        controls = new THREE.TrackballControls(camera, container);
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.1;
        controls.keys = [65, 83, 68];

        //create ground
        createWall(fieldWidth, fieldHeight, 2, THREE.ImageUtils.loadTexture("/img/background.png"), -Math.PI / 2, 0, 0, 0, -20, 0);
        // createWall(fieldWidth, fieldHeight, 2, 0xFFFFff, -Math.PI / 2, 0, 0, 0, -20, 0);


        //import blender mesh
        var loader = new THREE.JSONLoader();

        var baseURL = "meshes/";
        loader.load({color: COLORENUM.Red}, baseURL + "newTest.js", createBlender);
        loader.load({color: COLORENUM.Orange}, baseURL + "topSickle.js", createBlender);
        loader.load({color: COLORENUM.Orange}, baseURL + "rightSickle.js", createBlender);
        loader.load({color: COLORENUM.Red, meshType: "Lambert"}, baseURL + "rightWall.js", createBlender);
        loader.load({color: COLORENUM.Red, meshType: "Lambert"}, baseURL + "leftWall.js", createBlender);
        loader.load({color: COLORENUM.Blue}, baseURL + "leftTopBlue.js", createBlender);
        loader.load({color: COLORENUM.Blue}, baseURL + "leftTopBlueFat.js", createBlender);
        loader.load({color: COLORENUM.Brown, meshType: "Lamber"}, baseURL + "staryuBase.js", createBlender);
        loader.load({color: COLORENUM.Gold}, baseURL + "staryuMiddle.js", createBlender);
        loader.load({color: COLORENUM.Red}, baseURL + "staryuGem.js", createBlender);

        function createBlender(geometry, config) {
            console.log(config);
            geometry.mergeVertices();
            var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
            var material = new Meshtype({specular: 0x888888, color: config.color});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
            var mesh = new THREE.Mesh( geometry, material );
            mesh.scale.set(50, 50, 50);
            scene.add(mesh);
        }

        var wiperEnd = 20;
        wiperGeometry = new THREE.CubeGeometry(180, 60, 60, 1);
        wiperGeometry.vertices[0].x -= wiperEnd;//bottom near
        wiperGeometry.vertices[0].z -= wiperEnd;
        wiperGeometry.vertices[1].x -= wiperEnd;//top far
        wiperGeometry.vertices[1].z += wiperEnd;
        wiperGeometry.vertices[2].x -= wiperEnd;
        wiperGeometry.vertices[2].z -= wiperEnd;//bottom near
        wiperGeometry.vertices[3].x -= wiperEnd;
        wiperGeometry.vertices[3].z += wiperEnd;//bottom far
        // wiperGeometry.vertices[0].multiplyScalar(.5);
        // wiperGeometry.vertices[1].multiplyScalar(.5);
        // wiperGeometry.vertices[2].multiplyScalar(.5);
        // wiperGeometry.vertices[3].multiplyScalar(.5);
        var matrix = new THREE.Matrix4();
        matrix.set(   1,    0,  0,  0,
                      0,     1,  0,  0,
                      0,     0,  1,  0,
                      0,     0,  0,  1  );  
        wiperGeometry.applyMatrix(matrix);

        // wiperGeometry.mergeVertices();
        // var modifier = new THREE.SubdivisionModifier(.2);
        // modifier.modify(wiperGeometry);

        // var wiperGeometry = new THREE.CylinderGeometry(60, 60, 180, 10, 10, false);
        // var matrix = new THREE.Matrix4();
        // matrix.set(   4,    0,  0,  0,
        //               0,     4,  0,  0,
        //               0,     0,  1,  0,
        //               0,     0,  0,  1  );
        // wiperGeometry.applyMatrix(matrix);

        wiper = new THREE.Mesh(
            // new THREE.WiperGeometry( 15, 15, 100, 100, 20 ),
            wiperGeometry,
            new THREE.MeshPhongMaterial({ specular: 0x888888, color: 0xFFFFff })
            // new THREE.MeshBasicMaterial(0x564323)
        );
        wiper.receiveShadow = true;
        wiper.useQuaternion = true;
        scene.add( wiper );

        //wiper physics
        var wiperTransformQuat = new Ammo.btQuaternion();
        wiperTransformQuat.setEuler(0, 0, 0);
        

        wiperTransform = new Ammo.btTransform();
        wiperTransform.setRotation(wiperTransformQuat);
        wiperTransform.setOrigin(new Ammo.btVector3(0, 0, 300));

        var wiperLocalInertia = new Ammo.btVector3(0, 0, 0);        

        wiperShape = new Ammo.btBoxShape(new Ammo.btVector3(60, 60, 60));
        wiperShape.calculateLocalInertia(0, wiperLocalInertia);

        var wiperMotionState = new Ammo.btDefaultMotionState(wiperTransform);
        var wiperRbInfo = new Ammo.btRigidBodyConstructionInfo(0, wiperMotionState, wiperShape, wiperLocalInertia);
        wiperAmmo = new Ammo.btRigidBody(wiperRbInfo);
        scene.world.addRigidBody(wiperAmmo);

        wiperAmmo.mesh = wiper;
        boxes.push(wiperAmmo);

        initControls();
        // createBox();
    };

    function createWall(width, height, depth, img, rotationX, rotationY, rotationZ, origX, origY, origZ) {
        //mesh
        var ground = new THREE.Mesh(
            new THREE.CubeGeometry( width, height, depth ),
            typeof img == "number" ? new THREE.MeshBasicMaterial({ color: img }) :  new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: img })
        );
        ground.receiveShadow = true;
        ground.position.x = origX;
        ground.position.y = origY;
        ground.position.z = origZ;
        ground.rotation.x = rotationX;
        ground.rotation.y = rotationY;
        ground.rotation.z = rotationZ;
        scene.add( ground );
        
        //physics
        groundShape = new Ammo.btBoxShape(new Ammo.btVector3( width / 2, depth / 2, height / 2 ));
        groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3( origX, origY, origZ ));
        
        groundMass = 0;
        localInertia = new Ammo.btVector3(0, 0, 0);
        motionState = new Ammo.btDefaultMotionState( groundTransform );
        rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, motionState, groundShape, localInertia );
        groundAmmo = new Ammo.btRigidBody( rbInfo );
        scene.world.addRigidBody( groundAmmo );

        return groundAmmo;
    }

    initControls = function() {
        document.addEventListener('keydown', function(e) {
            e.keyCode == 37 && (leftWiperPressed = true);
        });
    }
    
    createBox = function() {
        var box, position_x, position_z,
            mass, startTransform, localInertia, boxShape, motionState, rbInfo, boxAmmo;
        
        position_x = -66;
        position_z = -400;

        // Create 3D box model
        box = new THREE.Mesh(
            new THREE.SphereGeometry( 20, 20, 20),
            new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: THREE.ImageUtils.loadTexture("/img/pokeball.png") })
        );
        //box.material.color.setRGB( Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100 );
        box.castShadow = true;
        box.receiveShadow = true;
        box.useQuaternion = true;
        scene.add( box );
        
        new TWEEN.Tween(box.material).to({opacity: 1}, 500).start();
        
        // Create box physics model
        mass = 3 * 3 * 3;
        startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        startTransform.setOrigin(new Ammo.btVector3( position_x, 150, position_z ));
        
        localInertia = new Ammo.btVector3(0, 0, 0);
        
        boxShape = new Ammo.btSphereShape(20);
        boxShape.calculateLocalInertia( mass, localInertia );
        
        motionState = new Ammo.btDefaultMotionState( startTransform );
        rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, boxShape, localInertia );
        boxAmmo = new Ammo.btRigidBody( rbInfo );
        scene.world.addRigidBody( boxAmmo );
        
        boxAmmo.mesh = box;
        boxes.push( boxAmmo );
    };
    
    updatePhysics = function() {
        scene.world.stepSimulation( 1 / 60, 5 );
        var i, transform = new Ammo.btTransform(), origin, rotation;
        
        for ( i = 0; i < boxes.length; i++ ) {
            boxes[i].getMotionState().getWorldTransform( transform );
            
            origin = transform.getOrigin();
            boxes[i].mesh.position.x = origin.x();
            boxes[i].mesh.position.y = origin.y();
            boxes[i].mesh.position.z = origin.z();
            // console.log(boxes[i].mesh.position);
            
            rotation = transform.getRotation();
            // console.log(rotation.y());
            boxes[i].mesh.quaternion.x = rotation.x();
            boxes[i].mesh.quaternion.y = rotation.y();
            boxes[i].mesh.quaternion.z = rotation.z();
            boxes[i].mesh.quaternion.w = rotation.w();
        };

        if (leftWiperPressed) {
            var wiperRotationQuat = new Ammo.btQuaternion();
            wiperRotationQuat.setEuler(Math.PI / 2, 0, 0);
            // wiperPos += .02;

            var wiperTransformChange = new Ammo.btTransform();
            wiperTransformChange.setRotation(wiperRotationQuat);
            wiperTransformChange.setOrigin(new Ammo.btVector3(0, 0, 300));
            wiperAmmo.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));

            var wiperMeshRotation = wiperTransformChange.getRotation();
            wiperAmmo.mesh.quaternion.x = wiperMeshRotation.x();
            wiperAmmo.mesh.quaternion.y = wiperMeshRotation.y();
            wiperAmmo.mesh.quaternion.z = wiperMeshRotation.z();
            wiperAmmo.mesh.quaternion.w = wiperMeshRotation.w();
        }
        // console.log(wiperAmmo.mesh.quaternion.x);
        // console.log(wiperAmmo.mesh.quaternion.y);
        // console.log(wiperAmmo.mesh.quaternion.z);
        // console.log(wiperAmmo.mesh.quaternion.w);

    };
    
    render = function render() {
        renderer.render(scene, camera);
    };
    
    main = function main() {
        
        // //Create a new box every second
        // now = new Date().getTime();
        // if ( now - lastbox > 2000 && boxes.length < 20) {
        //     createBox();
        //     lastbox = now;
        // }
        
        // Run physics
        updatePhysics();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };
    
    window.onload = function() {
        initScene();
        TWEEN.start();
        requestAnimFrame(main);
    }
    
})();