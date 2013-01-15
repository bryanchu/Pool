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
    
    var projector, renderer, scene, light, camera, controls, wiperLeft, wiperRight, wiperShape, wiperTransform,
        initScene, render, main, updatePhysics, wiperAmmoLeft, wiperAmmoRight, wiperPos = 0, leftWiperAngle = 0, rightWiperAngle = 0,
        createBall, initControls, now, lastbox = 0, boxes = [], leftWiperPressed = false, rightWiperPressed = false,
        fieldWidth = 550, fieldHeight = 875, wiperSpeed = .4, wiperLimit = .8, animMeshes = {}, waitingAJAXCalls, ballAmmo,
        rightWiperX = 20, bothWiperY = 0, bothWiperZ = 430, leftWiperX = -70, rightAmmoUp = false, leftAmmoUp = false,
        leftForce = false, rightForce = false, leftHolding = false, rightHolding = false,
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

        // Ammo world
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        overlappingPairCache = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        scene.world = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
        scene.world.setGravity(new Ammo.btVector3(0, -420, 100));

        // height depth width
        
        wiperAmmoRight= createWall({width: 100,
                                    height: 60,
                                    depth: 1,
                                    img: null,
                                    rotationX: 10,
                                    rotationY: 0,
                                    rotationZ: 0,
                                    origX: rightWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000});
        wiperAmmoLeft = createWall({width: 100,
                                    height: 60,
                                    depth: 1,
                                    img: null,
                                    rotationX: -10,
                                    rotationY: 0,
                                    rotationZ: 0,
                                    origX: leftWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000});

        //Make critical AJAX calls early
        var baseURL = "meshes/";
        var loader = new THREE.JSONLoader();
        waitingAJAXCalls = 2;
        storeMesh({color: COLORENUM.White, useQuat: true}, "flipperLeft.js", "leftWiper");
        storeMesh({color: COLORENUM.White, useQuat: true}, "flipperRight.js", "rightWiper");

        //Load the meshes.
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
        loadMesh({color: COLORENUM.Blue}, "pills.js");
        loadMesh({color: COLORENUM.Blue}, "bellsproutHouse.js");
        loadMesh({color: COLORENUM.Yellow}, "bellsprout.js");
        loadMesh({color: COLORENUM.Black}, "bellsproutEyes.js");
        loadMesh({color: COLORENUM.Pink}, "bellsproutMouth.js");
        loadMesh({color: COLORENUM.Green, meshType: "Lambert"}, "leaves.js");

        loadMesh({color: COLORENUM.Black}, "text.js");
        
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
        controls.dynamicDampingFactor = 0.1;
        controls.staticMoving = true;
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.keys = [65, 83, 68];

        //Create the ground.
        //width, height, depth, img, rotationX, rotationY, rotationZ, origX, origY, origZ, rest
        createWall({width: fieldWidth,
                    height: fieldHeight,
                    depth: 2,
                    img: THREE.ImageUtils.loadTexture("/img/background.png"),
                    rotationX: -Math.PI / 2,
                    rotationY: 0,
                    rotationZ: 0,
                    origX: 0,
                    origY: -20});
        
        function loadMesh(config, url) {
            return loader.load(config, baseURL + url, createBlender);
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
            mesh.useQuaternion = true;//config.useQuat;
            mesh.scale.set(50, 50, 50);
            scene.add(mesh);
            return mesh;
        }

        //wiper physics
        // var wiperTransformQuat = new Ammo.btQuaternion();
        // wiperTransformQuat.setEuler(10, 0, 0);
        

        // wiperTransform = new Ammo.btTransform();
        // wiperTransform.setRotation(wiperTransformQuat);
        // wiperTransform.setOrigin(new Ammo.btVector3(20, 0, 440));

        // var wiperLocalInertia = new Ammo.btVector3(0, 0, 0);        

        // wiperShape = new Ammo.btBoxShape(new Ammo.btVector3(60, 60, 60));
        // wiperShape.calculateLocalInertia(0, wiperLocalInertia);

        // var wiperMotionState = new Ammo.btDefaultMotionState(wiperTransform);
        // var wiperRbInfo = new Ammo.btRigidBodyConstructionInfo(0, wiperMotionState, wiperShape, wiperLocalInertia);
        // wiperAmmoLeft = new Ammo.btRigidBody(wiperRbInfo);
        // scene.world.addRigidBody(wiperAmmoLeft);

        // wiperAmmoRight= new Ammo.btRigidBody(wiperRbInfo);
        // scene.world.addRigidBody(wiperAmmoRight);



        initControls();

        function storeMesh(config, url, name) {
            loader.load(config, baseURL + url, function(geometry, config) {
                waitingAJAXCalls -= 1;
                animMeshes[name] = createBlender(geometry, config);
                initAnim();
            });
        }

        ballAmmo = createBall(100, "img/pokeball.png", -100, 10, 200, 0, 0, 0, 13, true, 2);
    };

    function createWall(config) {
        //if (img) {
        if (config.img) {
            var ground = new THREE.Mesh(
                new THREE.CubeGeometry( config.width, config.height, config.depth ),
                typeof config.img == "number" ? new THREE.MeshBasicMaterial({ color: config.img }) : new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: config.img })
            );
            ground.receiveShadow = true;
            ground.position.x = config.origX;
            ground.position.y = config.origY;
            ground.position.z = config.origZ;
            ground.rotation.x = config.rotationX;
            ground.rotation.y = config.rotationY;
            ground.rotation.z = config.rotationZ;
            scene.add( ground );
        }
        
        //physics
        var transformQuat = new Ammo.btQuaternion();
        transformQuat.setEuler(config.rotationX, config.rotationY, config.rotationZ);
        var groundShape = new Ammo.btBoxShape(new Ammo.btVector3( config.height / 2, config.depth / 2, config.width / 2 ));
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3( config.origX, config.origY, config.origZ ));
        groundTransform.setRotation(transformQuat);
        
        var groundMass = 0;
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var motionState = new Ammo.btDefaultMotionState( groundTransform );
        var rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, motionState, groundShape, localInertia );
        rbInfo.m_restitution = config.rest;
        var groundAmmo = new Ammo.btRigidBody( rbInfo );
        scene.world.addRigidBody( groundAmmo );

        return groundAmmo;
    };

    initControls = function() {
        document.addEventListener('keydown', function(e) {
            console.log(leftForce);
            if (e.keyCode == 37) {
                leftWiperPressed = true;
                leftForce = !leftHolding;
                leftHolding = true;
            } else if (e.keyCode == 39) {
                rightWiperPressed = true;
                rightForce = !rightHolding;
                rightHolding = true;
            }
        });
        document.addEventListener('keyup', function(e) {
            if (e.keyCode == 37) {
                leftWiperPressed = false;
                leftHolding = false;
            } else if (e.keyCode == 39) {
                rightWiperPressed = false;
                rightHolding = false;
            }
        });
    };

    var xLimitRight = -30, xOrigRight = 15, zOrig,
        xLimitLeft = -44, xOrigLeft = -100;

    function createForce(left) {
        var distX, distY, vector,
            posX = ballAmmo.mesh.position.x,
            posY = ballAmmo.mesh.position.y,
            posZ = ballAmmo.mesh.position.z;
        if (left && checkZone(true)) {
            vector = new Ammo.btVector3((zOrigLeft - posZ) * ((xOrigLeft - posX) / 40) * 1000, 0, -100000 * (((posZ - zOrig) / 30) + .6) * (((xOrigLeft - posX) / 40) + .8));
            ballAmmo.applyCentralImpulse(vector);
        } else if (checkZone(false)) {
            vector = new Ammo.btVector3((zOrigRight - posZ) * ((xOrigRight - posX) / 40) * 1000, 0, -100000 * (((posZ - zOrig) / 30) + .6) * (((xOrigRight - posX) / 40) + .8));
            console.log(vector.getX());
            console.log(vector.getY());
            console.log(vector.getZ());
            ballAmmo.applyCentralImpulse(vector);
        }
    };

    function checkZone(left) {
        if (left) {

        } else {

        }
        return true;
    }
    
    createBall = function(mass, mapURL, startX, startY, startZ, rotX, rotY, rotZ, size, useQuat, rest) {
        var ball, position_x, position_z, ballAmmo,
            mass, startTransform, localInertia, boxShape, motionState, rbInfo;

        // Create 3D ball model
        ball = new THREE.Mesh(
            new THREE.SphereGeometry( size, size, size),
            new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888, map: THREE.ImageUtils.loadTexture(mapURL) })
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
        rbInfo.m_restitution = rest;
        ballAmmo = new Ammo.btRigidBody( rbInfo );
        scene.world.addRigidBody( ballAmmo );
        
        ballAmmo.mesh = ball;
        return ballAmmo;
    };
    
    updatePhysics = function() {
        scene.world.stepSimulation( 1 / 60, 5 );
        if (leftForce) {
            createForce(true);
            leftForce = false;
        } else if (rightForce) {
            createForce(false);
            rightForce = false;
        }
        var i, transform = new Ammo.btTransform(), origin, rotation;
        
        ballAmmo.getMotionState().getWorldTransform( transform );
        
        origin = transform.getOrigin();

        ballAmmo.mesh.position.x = origin.x();
        ballAmmo.mesh.position.y = origin.y();
        ballAmmo.mesh.position.z = origin.z();
        // console.log(boxes[i].mesh.position);
        
        rotation = transform.getRotation();
        // console.log(rotation.y());
        ballAmmo.mesh.quaternion.x = rotation.x();
        ballAmmo.mesh.quaternion.y = rotation.y();
        ballAmmo.mesh.quaternion.z = rotation.z();
        ballAmmo.mesh.quaternion.w = rotation.w();
        
        if (leftWiperPressed && leftWiperAngle < wiperLimit) {
 

            // var wiperMeshRotation = wiperTransformChange.getRotation();
            // wiperAmmoLeft.mesh.quaternion.x = wiperMeshRotation.x();
            // wiperAmmoLeft.mesh.quaternion.y = wiperMeshRotation.y();
            // wiperAmmoLeft.mesh.quaternion.z = wiperMeshRotation.z();
            // wiperAmmoLeft.mesh.quaternion.w = wiperMeshRotation.w();
            leftWiperAngle += wiperSpeed;
            wiperAmmoLeft.dummyMesh.rotation.y += wiperSpeed;

            // origin = wiperTransformChange.getOrigin();
            // wiperAmmoLeft.mesh.position.x = origin.x();
            // wiperAmmoLeft.mesh.position.y = origin.y();
            // wiperAmmoLeft.mesh.position.z = origin.z();
        } else if (!leftWiperPressed && leftWiperAngle > 0) {
            // var wiperRotationQuat = new Ammo.btQuaternion();
            // var wiperTransformChange = new Ammo.btTransform();

            // wiperRotationQuat.setEuler(leftWiperAngle -= wiperSpeed, 0, 0);

            // wiperTransformChange.setRotation(wiperRotationQuat);
            // var offset = -1.7;
            // var yshift = -1000 * (Math.sin(leftWiperAngle * Math.PI / 2 / 3.1 + offset) - Math.sin(offset));
            // wiperTransformChange.setOrigin(new Ammo.btVector3(-400 * Math.sin(leftWiperAngle), 0, yshift));
            // wiperAmmoLeft.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            leftWiperAngle -= wiperSpeed;
            wiperAmmoLeft.dummyMesh.rotation.y -= wiperSpeed;
        }

        if (rightWiperPressed && rightWiperAngle < wiperLimit) {
            
            // // if (!rightAmmoUp) {
            //     var wiperRotationQuat = new Ammo.btQuaternion();
            //     var wiperTransformChange = new Ammo.btTransform();

            //     wiperRotationQuat.setEuler(rightWiperAngle + .5, 0, 0);

            //     wiperTransformChange.setRotation(wiperRotationQuat);
            //     // var offset = 1.7;
            //     // var yshift = 1000 * (Math.sin(leftWiperAngle * Math.PI / 2 / 3.1 + offset) - Math.sin(offset));
            //     // wiperTransformChange.setOrigin(new Ammo.btVector3(-400 * Math.sin(rightWiperAngle), 0, yshift));
            //     wiperTransformChange.setOrigin(new Ammo.btVector3(15, bothWiperY, bothWiperZ - 30));
            //     wiperAmmoRight.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            //     rightAmmoUp = true;
            // // }
            rightWiperAngle += wiperSpeed;
            wiperAmmoRight.dummyMesh.rotation.y -= wiperSpeed;
        } else if (!rightWiperPressed && rightWiperAngle > 0) {
            // var wiperRotationQuat = new Ammo.btQuaternion();
            // var wiperTransformChange = new Ammo.btTransform();

            // wiperRotationQuat.setEuler(0, 0, 0);

            // wiperTransformChange.setRotation(wiperRotationQuat);
            // var offset = -1.7;
            // var yshift = -1000 * (Math.sin(leftWiperAngle * Math.PI / 2 / 3.1 + offset) - Math.sin(offset));
            // wiperTransformChange.setOrigin(new Ammo.btVector3(-400 * Math.sin(leftWiperAngle), 0, yshift));
            // wiperAmmoLeft.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));

            rightWiperAngle -= wiperSpeed;
            wiperAmmoRight.dummyMesh.rotation.y += wiperSpeed;
        }
    };

    function initAnim() {
        if (!waitingAJAXCalls) {
            wiperAmmoLeft.mesh = animMeshes.leftWiper;
            var dummyLeft = new THREE.Object3D();
            var xOffset = 110;
            var zOffset = -380;
            wiperAmmoLeft.mesh.position.x = xOffset;
            wiperAmmoLeft.mesh.position.z = zOffset;
            dummyLeft.position.x = -xOffset;
            dummyLeft.position.z = -zOffset;
            dummyLeft.add(wiperAmmoLeft.mesh);
            wiperAmmoLeft.dummyMesh = dummyLeft;
            scene.add(dummyLeft);

            wiperAmmoRight.mesh = animMeshes.rightWiper;
            var dummyRight = new THREE.Object3D();
            xOffset = -30;
            zOffset = -380;
            wiperAmmoRight.mesh.position.x = xOffset;
            wiperAmmoRight.mesh.position.z = zOffset;
            dummyRight.position.x = -xOffset;
            dummyRight.position.z = -zOffset;
            dummyRight.add(wiperAmmoRight.mesh);
            wiperAmmoRight.dummyMesh = dummyRight;
            scene.add(dummyRight);

            TWEEN.start();
            requestAnimFrame(main);
        }
    }

    // function rotateAroundWorldAxis(object, axis, radians) {
    //     arotWorldMatrix = new THREE.Matrix4();
    //     rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    //     rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
    //     object.matrix = rotWorldMatrix;

    //     object.rotation.setEulerFromRotationMatrix(object.matrix);
    // }
    
    render = function render() {
        renderer.render(scene, camera);
    };
    
    main = function main() {
        
        // //Create a new box every second
        // now = new Date().getTime();
        // if ( now - lastbox > 2000 && boxes.length < 20) {
        
        //     lastbox = now;
        // }
        
        // Run physics
        updatePhysics();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };
    
    window.onload = initScene;
})();