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
        createBall, initControls, now, lastbox = 0, boxes = [], leftWiperPressed = false,
        fieldWidth = 550, fieldHeight = 850,
        COLORENUM = {Red: 0xFF0000,
                    Orange: 0xFF8600,
                    Blue: 0x1F7CFF,
                    Brown: 0x8B2500,
                    Gold: 0xFFB90F,
                    Pink: 0xFF52CB,
                    Black: 0x000000,
                    White: 0xFFFFFF,
                    Yellow: 0xFAFF6B,
                    Green: 0x00DE1A};
    
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
            5000
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

        //Create the ground.
        createWall(fieldWidth, fieldHeight, 2, THREE.ImageUtils.loadTexture("/img/background.png"), -Math.PI / 2, 0, 0, 0, -20, 0);

        //Load the meshes.
        var loader = new THREE.JSONLoader();
        var baseURL = "meshes/";
        loadMesh({color: COLORENUM.Red}, "newTest.js");
        loadMesh({color: COLORENUM.Orange}, "topSickle.js");
        loadMesh({color: COLORENUM.Orange}, "rightSickle.js");
        loadMesh({color: COLORENUM.Red, meshType: "Lambert"}, "rightWall.js");
        loadMesh({color: COLORENUM.Red, meshType: "Lambert"}, "leftWall.js");
        loadMesh({color: COLORENUM.Blue}, "leftTopBlue.js");
        loadMesh({color: COLORENUM.Blue}, "leftTopBlueFat.js");
        loadMesh({color: COLORENUM.Brown}, "staryuBase.js");
        loadMesh({color: COLORENUM.Gold}, "staryuMiddle.js");
        loadMesh({color: COLORENUM.Red}, "staryuGem.js");
        loadMesh({color: COLORENUM.Brown}, "smallStaryuBase.js");
        loadMesh({color: COLORENUM.Gold}, "smallStaryuMiddle.js");
        loadMesh({color: COLORENUM.Red}, "smallStaryuGem.js");
        loadMesh({color: COLORENUM.Gold, meshType: "Lambert"}, "digletLeft.js");
        loadMesh({color: COLORENUM.Pink}, "digletLeftNose.js");
        loadMesh({color: COLORENUM.Black}, "digletLeftEyes.js");
        loadMesh({color: COLORENUM.Gold, meshType: "Lambert"}, "digletRight.js");
        loadMesh({color: COLORENUM.Pink}, "digletRightNose.js");
        loadMesh({color: COLORENUM.Black}, "digletRightEyes.js");
        loadMesh({color: COLORENUM.Black}, "digletLeftEyesOthers.js");
        loadMesh({color: COLORENUM.Gold, meshType: "Lambert"}, "digletRightOthers.js");
        loadMesh({color: COLORENUM.Black}, "digletRightEyesOthers.js");
        loadMesh({color: COLORENUM.Pink}, "digletRightNoseOthers.js");
        loadMesh({color: COLORENUM.Blue}, "bumper.js");
        loadMesh({color: COLORENUM.Blue, meshType: "Lambert"}, "blueSides.js");
        loadMesh({color: COLORENUM.White}, "flippers.js");
        loadMesh({color: COLORENUM.Blue}, "pills.js");
        loadMesh({color: COLORENUM.Blue}, "bellsproutHouse.js");
        loadMesh({color: COLORENUM.Yellow}, "bellsprout.js");
        loadMesh({color: COLORENUM.Black}, "bellsproutEyes.js");
        loadMesh({color: COLORENUM.Pink}, "bellsproutMouth.js");
        loadMesh({color: COLORENUM.Green, meshType: "Lambert"}, "leaves.js");


        loadMesh({color: COLORENUM.Black}, "text.js");

        function loadMesh(config, url) {
            loader.load(config, baseURL + url, createBlender);
        }

        //Create Voltorbs.
        createBall(0, "img/voltorb.gif", -35, 0, -105, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);
        createBall(0, "img/voltorb.gif", -85, 0, -155, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);
        createBall(0, "img/voltorb.gif", -20, 0, -185, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);

        function createBlender(geometry, config) {
            geometry.mergeVertices();
            var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
            var material = new Meshtype({specular: 0x888888, color: config.color});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
            var mesh = new THREE.Mesh( geometry, material );
            mesh.scale.set(50, 50, 50);
            scene.add(mesh);
            return mesh;
        }



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

        // wiperAmmo.mesh = wiper;
        // boxes.push(wiperAmmo);

        initControls();
        // boxes.push(createBall(9, "/img/pokeball.png", 0, 0, 0, 20));
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
    
    createBall = function(mass, mapURL, startX, startY, startZ, rotX, rotY, rotZ, size, useQuat) {
        var ball, position_x, position_z,
            mass, startTransform, localInertia, boxShape, motionState, rbInfo, boxAmmo;

        // Create 3D ball model
        ball = new THREE.Mesh(
            new THREE.SphereGeometry( size, size, size),
            new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: THREE.ImageUtils.loadTexture(mapURL) })
        );

        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.useQuaternion = useQuat;
        ball.position.x = startX;
        ball.position.y = startY;
        ball.position.z = startZ;
        ball.rotation.x = rotX;
        ball.rotation.y = rotY;
        ball.rotation.z = rotZ;

        scene.add( ball );
        
        new TWEEN.Tween(ball.material).to({opacity: 1}, 500).start();
        
        // Create ball physics model
        startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        startTransform.setOrigin(new Ammo.btVector3( startX, startY, startZ ));
        
        localInertia = new Ammo.btVector3(0, 0, 0);
        
        boxShape = new Ammo.btSphereShape(size);
        boxShape.calculateLocalInertia( mass, localInertia );
        
        motionState = new Ammo.btDefaultMotionState( startTransform );
        rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, boxShape, localInertia );
        boxAmmo = new Ammo.btRigidBody( rbInfo );
        scene.world.addRigidBody( boxAmmo );
        
        boxAmmo.mesh = ball;
        return boxAmmo;
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
        //     createBall();
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