//Bryan Chu | Pokemon Pinball in WEBGL
//TODO: finish refactoring everything
//      moving background
//      color changing
//      voltorb bouncing
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

function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}

var Module = { TOTAL_MEMORY: 100*1024*1024 };
Pinball = {};
//SINGLETONS
Pinball.GlobalControl = function() {

}();
Pinball.ScoreManager = function() {

}();
Pinball.AudioManager = function() {

}();
Pinball.Pinball = function() {

}();
//NON-SINGLETONS
Pinball.AmmoThreeObject = function(config) {

};
Pinball.Wall = function(config) {

};
Pinball.CurvedWall = function(config) {

};
Pinball.Ball = function(config) {

};
(function() {
    var projector, renderer, scene, light, camera, controls, wiperLeft, wiperRight, wiperShape, wiperTransform, startX = 205, startZ = 330,
        initScene, render, main, updatePhysics, wiperAmmoLeft, wiperAmmoRight, wiperPos = 0, leftWiperAngle = 0, rightWiperAngle = 0,
        createBall, initControls, now, lastbox = 0, leftWiperPressed = false, rightWiperPressed = false, flipperSound = new Audio("sounds/flipper.mp3"), launchSound = new Audio("sounds/launch.mp3"), themeSound = new Audio("sounds/theme.mp3"), bounceSound = new Audio("sounds/boing.mp3"),
        fieldWidth = 550, fieldHeight = 875, wiperSpeed = .4, wiperLimit = .8, animMeshes = {}, waitingAJAXCalls, ballAmmo, leftBumper, rightBumper,
        rightWiperX = 0, bothWiperY = 0, bothWiperZ= 377, leftWiperX = -85, rightAmmoUp = false, leftAmmoUp = false, wiperRotation = .6,
        leftForce = false, rightForce = false, leftHolding = false, rightHolding = false, firstSpace = true, defaultYRot = Math.PI / 2, defaultWallWidth = 100,
        COLORENUM = {Red: 0xFF0000,
                    RedHighlight: 0xFF5252,
                    Orange: 0xFF8600,
                    Blue: 0x1F7CFF,
                    BlueHighlight: 0x6EAAFF,
                    Brown: 0x8B2500,
                    Gold: 0xFFB90F,
                    Pink: 0xFF52CB,
                    Black: 0x000000,
                    White: 0xFFFFFF,
                    Yellow: 0xFAFF6B,
                    Green: 0x00DE1A},
        BOUNCYOBJECTS = {},
        BOUNCYPOINTERS = {};
        // BOUNCYPOINTERS = {leftBumper: null,
        //                  rightBumper: null,
        //                  topVoltorb: null,
        //                  leftVoltorb: null,
        //                  rightVoltorb: null,
        //                  leftDiglet: null,
        //                  rightDiglet: null
        //                  };
    var testColor = null;
    initScene = function() {
        var collisionConfiguration, dispatcher, overlappingPairCache, solver, // Ammo world
            ground, groundShape, groundTransform, groundMass, localInertia, motionState, rbInfo, groundAmmo;
        var score = document.getElementById('score');
        //Check for Chrome bc firefox textures suck
        (navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && alert("Please use Chrome for optimal WebGL.");

        themeSound.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
        themeSound.play();

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
        sceneCube = new THREE.Scene();

        // Ammo world
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        overlappingPairCache = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        scene.world = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
        scene.world.setGravity(new Ammo.btVector3(0, -42, 200));

        //flippers
        var wiperWidth = 70, wiperHeight = 70;
        wiperAmmoRight= createWall({width: wiperWidth,
                                    height: wiperHeight,
                                    depth: 1,
                                    img: null,
                                    rotationX: wiperRotation,
                                    rotationY: Math.PI / 2,
                                    rotationZ: 0,
                                    origX: rightWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000});
        wiperAmmoLeft = createWall({width: wiperWidth,
                                    height: wiperHeight,
                                    depth: 1,
                                    img: null,
                                    rotationX: -wiperRotation,
                                    rotationY: Math.PI / 2,
                                    rotationZ: 0,
                                    origX: leftWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000});
        //the ball
        ballAmmo = createPokeball();

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
            50000
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

        function loadMesh(config, url) {
            return loader.load(config, baseURL + url, createBlender);
        }

        //Create Voltorbs.
        createBall(0, "img/voltorb.gif", -35, 0, -105, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);
        createBall(0, "img/voltorb.gif", -85, 0, -155, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);
        createBall(0, "img/voltorb.gif", -20, 0, -185, -Math.PI / 2, -Math.PI / 2, -Math.PI / 3, 22, false, false);
        //Create diglet ammos.
        createBall(0, null, -190, 0, 135, 0, 0, 0, 22, true);
        createBall(0, null, 100, 0, 140, 0, 0, 0, 22, true);

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

        //TODO: fix ammo mesh rotation correlation.
        //Create the ground image.
        createWall({width: fieldHeight,
                    height: fieldWidth,
                    depth: 2,
                    img: THREE.ImageUtils.loadTexture("img/abstractExplosion.jpg"),//"/img/gradientTest.jpg"),//"/img/background.png"),//THREE.ImageUtils.loadTexture("/img/DottedCross.jpg"),//null,//
                    rotationX: 0, 
                    rotationY: 0,
                    rotationZ: 0,
                    origX: 0,
                    origY: -20,
                    origZ: 0,
                    meshOnly: true});
        //Create the ground ammo.
        createWall({width: fieldWidth * 2,
                    height: fieldHeight,
                    depth: 2,
                    img: null,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    origX: 0,
                    origY: -20,
                    origZ: 0});
        //bottom starting wall
        createWall({width: defaultWallWidth,
                    height: 100,
                    depth: 1,
                    img: testColor,
                    rotationX: 0,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 200,
                    origY: 0,
                    origZ: 440});
        //wall under staryu
        createWall({width: defaultWallWidth,
                    height: 65,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 4,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -108,
                    origY: 0,
                    origZ: -42});
        //smaller wall
        createWall({width: defaultWallWidth,
                    height: 30,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 4,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -153,
                    origY: 0,
                    origZ: 37});
        //straight vertical wall on staryu island
        createWall({width: defaultWallWidth,
                    height: 35,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -135,
                    origY: 0,
                    origZ: -210});
        //straight extension of staryu island
        createWall({width: defaultWallWidth,
                    height: 70,
                    depth: 1,
                    img: testColor,
                    rotationX: -Math.PI / 4,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -110,
                    origY: 0,
                    origZ: -90});
        //left-side left vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 45,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -85,
                    origY: 0,
                    origZ: -248});
        //right-side left vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 50,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -70,
                    origY: 0,
                    origZ: -255});
        //left-side right vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 45,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -25,
                    origY: 0,
                    origZ: -270});
        //right-side right vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 45,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -5,
                    origY: 0,
                    origZ: -270});
        //right orange sickle bottom surface
        createWall({width: defaultWallWidth,
                    height: 140,
                    depth: 1,
                    img: testColor,
                    rotationX: -.9,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 115,
                    origY: 0,
                    origZ: -255});
        //left bellsprout wall
        createWall({width: defaultWallWidth,
                    height: 200,
                    depth: 1,
                    img: testColor,
                    rotationX: -1.6,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 40,
                    origY: 0,
                    origZ: -180});
        //left bellsprout wall extension
        createWall({width: defaultWallWidth,
                    height: 50,
                    depth: 1,
                    img: testColor,
                    rotationX: 1.4,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 35,
                    origY: 0,
                    origZ: -58});
        //bellsprout lowest wall
        createWall({width: defaultWallWidth,
                    height: 45,
                    depth: 1,
                    img: testColor,
                    rotationX: -.8,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 70,
                    origY: 0,
                    origZ: 35});
        //bottom left vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 70,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -202,
                    origY: 0,
                    origZ: 255});
        //bottom right vertical blue wall
        createWall({width: defaultWallWidth,
                    height: 70,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 117,
                    origY: 0,
                    origZ: 255});
        //bottom left slanted blue wall
        createWall({width: defaultWallWidth,
                    height: 110,
                    depth: 1,
                    img: testColor,
                    rotationX: -3.75,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -160,
                    origY: 0,
                    origZ: 325});
        //bottom left slanted blue wall
        createWall({width: defaultWallWidth,
                    height: 110,
                    depth: 1,
                    img: testColor,
                    rotationX: 3.75,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 70,
                    origY: 0,
                    origZ: 325});
        //left side left triangle
        createWall({width: defaultWallWidth,
                    height: 70,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -165,
                    origY: 0,
                    origZ: 245});
        //right side right triangle
        createWall({width: defaultWallWidth,
                    height: 70,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 85,
                    origY: 0,
                    origZ: 245});
        //bouncy wall left triangle
        createWall({width: defaultWallWidth,
                    height: 90,
                    depth: 1,
                    img: testColor,
                    rotationX: -1.2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -145,
                    origY: 0,
                    origZ: 255,
                    id: "leftBumper"});
        //bouncy wall right triangle
        createWall({width: defaultWallWidth,
                    height: 90,
                    depth: 1,
                    img: testColor,
                    rotationX: 1.2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 65,
                    origY: 0,
                    origZ: 255,
                    id: "rightBumper"});
        //wall left of starting position
        createWall({width: defaultWallWidth,
                    height: 90,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 185,
                    origY: 0,
                    origZ: 400});
        //left bottom wall
        createWall({width: defaultWallWidth,
                    height: 200,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: -258,
                    origY: 0,
                    origZ: 300});
        //right bottom wall
        createWall({width: defaultWallWidth,
                    height: 200,
                    depth: 1,
                    img: testColor,
                    rotationX: Math.PI / 2,
                    rotationY: defaultYRot,
                    rotationZ: 0,
                    origX: 165,
                    origY: 0,
                    origZ: 300});
        // top red semicircle
        createCurvedWall({
            reps: 25,
            startAngle: -Math.PI / 2,
            endAngle: 1 * Math.PI / 2,
            centerX: -20,
            centerZ: -148,//160,
            radius: 245
        });
        //left upper wall
        createCurvedWall({
            reps: 10,
            startAngle: 1.1,
            endAngle: 2.2,
            centerX: 145,
            centerZ: -125,
            radius: 400
        });
        //right upper wall
        createCurvedWall({
            reps: 10,
            startAngle: -2.1,
            endAngle: -1.2,
            centerX: -235,
            centerZ: -125,
            radius: 400
        });
        //left side of small left island
        createCurvedWall({
            reps: 8,
            startAngle: 1.3,
            endAngle: 2.2,
            centerX: 20,
            centerZ: -80,
            radius: 230
        });
        //right side of small left island
        createCurvedWall({
            reps: 8,
            startAngle: 1.4,
            endAngle: 2.4,
            centerX: 10,
            centerZ: -120,
            radius: 210
        });
        //left side of staryu island
        createCurvedWall({
            reps: 8,
            startAngle: 1.15,
            endAngle: 2.1,
            centerX: 60,
            centerZ: -120,
            radius: 220
        });
        //inner curve of staryu island
        createCurvedWall({
            reps: 6,
            startAngle: 1.1,
            endAngle: 2.2,
            centerX: -75,
            centerZ: -150,
            radius: 70
        });
        //top orange sickle
        createCurvedWall({
            reps: 12,
            startAngle: -.6,
            endAngle: .6,
            centerX: -45,
            centerZ: -130,
            radius: 206
        });
        //left lower wall
        createCurvedWall({
            reps: 10,
            startAngle: .3,
            endAngle: Math.PI / 2,
            centerX: -200,
            centerZ: 220,
            radius: 50
        });
        //right lower wall
        createCurvedWall({
            reps: 10,
            startAngle: -.3,
            endAngle: -Math.PI / 2,
            centerX: 108,
            centerZ: 220,
            radius: 50
        });

        initControls();

        function storeMesh(config, url, name) {
            loader.load(config, baseURL + url, function(geometry, config) {
                waitingAJAXCalls -= 1;
                animMeshes[name] = createBlender(geometry, config);
                initAnim();
            });
        }

        var urls = [
          'img/grey.png',
          'img/grey.png',
          'img/grey.png',
          'img/grey.png',
          'img/grey.png',
          'img/grey.png'
        ],
        cubeMap = THREE.ImageUtils.loadTextureCube(urls);
        cubeMap.format = THREE.RGBFormat;
        var material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            envMap: cubeMap,
            side: THREE.BackSide
        });

        var shader = THREE.ShaderUtils.lib[ "cube" ];
        shader.uniforms[ "tCube" ].texture = cubeMap;

        var skybox = new THREE.Mesh( new THREE.CubeGeometry( 10000, 10000, 10000 ), material );
    
        scene.add(skybox);
    };
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function createCurvedWall(config) {
        var rotAngle;
        for (var i = 0; i < config.reps; i++) {
            rotAngle = config.startAngle + (((config.endAngle - config.startAngle) / config.reps) * i);
            // newRotX = Math.atan(Math.tan(rotAngle) / config.stretch);
            // console.log(newRotX);
            createWall({width: defaultWallWidth,
                        height: (config.endAngle - config.startAngle) / config.reps * config.radius,//500,
                        depth: 1,
                        img: testColor,
                        rotationX: rotAngle,
                        rotationY: defaultYRot,
                        rotationZ: 0,
                        origX: config.centerX - (Math.sin(rotAngle) * config.radius),
                        origY: 0,
                        origZ: config.centerZ - (Math.cos(rotAngle) * config.radius)
            });
        }
    }

    function createWall(config) {
        //if (img) {
        if (config.img) {
            var ground = new THREE.Mesh(
                new THREE.CubeGeometry( config.height, config.width, config.depth ),
                typeof config.img == "number" ? new THREE.MeshBasicMaterial({ color: config.img }) : new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: config.img })
            );
            ground.receiveShadow = true;
            ground.useQuaternion = false;
            ground.position.x = config.origX;
            ground.position.y = config.origY;
            ground.position.z = config.origZ;
            ground.rotation.x = config.rotationY - Math.PI / 2;//0
            ground.rotation.y = config.rotationX;//correct
            ground.rotation.z = config.rotationZ;
            scene.add( ground );
        }
        //console.log(config.origX);console.log(config.origZ);console.log(config);
        // console.log(height);
        //physics
        if (!config.meshOnly) {
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
            //bounciness check
            if (config.id) {
                BOUNCYPOINTERS[groundAmmo.a] = groundAmmo;
            }
            // console.log(groundAmmo.a);
            groundAmmo.id = config.id;
            return groundAmmo;
        }
    };

    initControls = function() {
        document.addEventListener('keydown', function(e) {
            if (e.keyCode == 37) {
                !leftHolding && flipperSound.play();
                setTimeout(function() {
                    if (leftHolding) {
                        var wiperRotationQuat = new Ammo.btQuaternion();
                        var wiperTransformChange = new Ammo.btTransform();
                        wiperRotationQuat.setEuler(.1, Math.PI / 2, 0);
                        wiperTransformChange.setRotation(wiperRotationQuat);
                        wiperTransformChange.setOrigin(new Ammo.btVector3(leftWiperX + 5, bothWiperY, bothWiperZ - 15));
                        wiperAmmoLeft.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
                    }
                }, 100);

                leftWiperPressed = true;
                leftForce = !leftHolding;
                leftHolding = true;
            } else if (e.keyCode == 39) {
                !rightHolding && flipperSound.play();
                setTimeout(function() {
                    if (rightHolding) {
                        var wiperRotationQuat = new Ammo.btQuaternion();
                        var wiperTransformChange = new Ammo.btTransform();
                        wiperRotationQuat.setEuler(-.1, Math.PI / 2, 0);
                        wiperTransformChange.setRotation(wiperRotationQuat);
                        wiperTransformChange.setOrigin(new Ammo.btVector3(rightWiperX + 5, bothWiperY, bothWiperZ - 15));
                        wiperAmmoRight.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
                    }
                }, 100);

                rightWiperPressed = true;
                rightForce = !rightHolding;
                rightHolding = true;
            } else if (e.keyCode == 32 && firstSpace) {
                launchSound.play();
                // firstSpace = false;
                ballAmmo.applyCentralImpulse(new Ammo.btVector3(0, 0, -200000));
            }
        });
        document.addEventListener('keyup', function(e) {
            if (e.keyCode == 37) {
                leftWiperPressed = false;
                leftHolding = false;

                var wiperRotationQuat = new Ammo.btQuaternion();
                var wiperTransformChange = new Ammo.btTransform();
                wiperRotationQuat.setEuler(-wiperRotation, Math.PI / 2, 0);
                wiperTransformChange.setRotation(wiperRotationQuat);
                wiperTransformChange.setOrigin(new Ammo.btVector3(leftWiperX, bothWiperY, bothWiperZ));
                wiperAmmoLeft.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            } else if (e.keyCode == 39) {
                rightWiperPressed = false;
                rightHolding = false;

                var wiperRotationQuat = new Ammo.btQuaternion();
                var wiperTransformChange = new Ammo.btTransform();
                wiperRotationQuat.setEuler(wiperRotation, Math.PI / 2, 0);
                wiperTransformChange.setRotation(wiperRotationQuat);
                wiperTransformChange.setOrigin(new Ammo.btVector3(rightWiperX, bothWiperY, bothWiperZ));
                wiperAmmoRight.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            }
        });
    };

    var xLimitRight = -30, xOrigRight = 15, zOrig = 345,
        xLimitLeft = -50, xOrigLeft = -110;

    function createForce(left) {
        score.innerHTML = parseInt(score.innerHTML) + 200;
        var distX, distY, vector,
            posX = ballAmmo.mesh.position.x,
            posZ = ballAmmo.mesh.position.z;
        if (left && checkZone(true)) {
            vector = new Ammo.btVector3((zOrig - posZ) * ((xOrigLeft - posX) / 40) * 1000, 0, -100000 * (((posZ - zOrig) / 30) + .6) * (((posX - xOrigLeft) / 40) + .8));
            ballAmmo.applyCentralImpulse(vector);
        } else if (checkZone(false)) {
            vector = new Ammo.btVector3((zOrig - posZ) * ((xOrigRight - posX) / 40) * 1000, 0, -100000 * (((posZ - zOrig) / 30) + .6) * (((xOrigRight - posX) / 40) + .8));
            ballAmmo.applyCentralImpulse(vector);
        }
    };

    function bounce(object) {
        var vector;
        score.innerHTML = parseInt(score.innerHTML) + 150;
        bounceSound.play();
        switch (object.id) {
            case "leftBumper":
                vector = new Ammo.btVector3(30000, 0, -30000);
                break;
            case "rightBumper":
                vector = new Ammo.btVector3(-30000, 0, -30000);
                break;
            default:
                console.log("Bad things.")
        }
        ballAmmo.applyCentralImpulse(vector);
    };

    function checkZone(left) {
        var posX = ballAmmo.mesh.position.x,
            posZ = ballAmmo.mesh.position.z
            leftFulcrumX = -110,
            rightFulcrumX = 25;
            
        if (left && posX < xLimitLeft && posX > leftFulcrumX) {
            if (posZ > zOrig) {
                return posZ < zOrig + (posX - leftFulcrumX);
            } else {
                return posZ > zOrig - (posX - leftFulcrumX) * .8;
            }
            return ballAmmo.mesh.position.x
        } else if (posX < rightFulcrumX && posX > xLimitRight) {
            if (posZ > zOrig) {
                return posZ < zOrig + (rightFulcrumX - posX);
            } else {
                return posZ > zOrig - (rightFulcrumX - posX) * .8;
            }
        }
    }

    createPokeball = function() {
        var ball = createBall(100, "img/pokeball.png", startX, 0, 130, 0, 0, 0, 13, true, 2);
        ball.setSleepingThresholds(0, 0);
        return ball;
    }
    
    createBall = function(mass, mapURL, startX, startY, startZ, rotX, rotY, rotZ, size, useQuat, rest) {
        var ball, position_x, position_z, ballAmmo,
            mass, startTransform, localInertia, boxShape, motionState, rbInfo;

        // Create 3D ball model
        if (mapURL) {
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
        }
                
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
        var transform = new Ammo.btTransform(), origin, rotation;
        scene.world.stepSimulation( 1 / 60, 5 );
        var numManifolds = scene.world.getDispatcher().getNumManifolds();
        for (var i = 0; i < numManifolds; i++) {
            var contactManifold = scene.world.getDispatcher().getManifoldByIndexInternal(i);
            var obA = contactManifold.getBody0();
            var obB = contactManifold.getBody1();
            var obCollision = BOUNCYPOINTERS[obA] || BOUNCYPOINTERS[obB];
            if (obCollision) {
                if (contactManifold.getContactPoint(0).getDistance() < 1) {
                    bounce(obCollision);
                }
            }
        }
        // console.log("-----------");
        if (leftForce) {
            createForce(true);
            leftForce = false;
        } else if (rightForce) {
            createForce(false);
            rightForce = false;
        }
        
        ballAmmo.getMotionState().getWorldTransform(transform);
        if (transform.getOrigin().z() > fieldHeight) {
            Ammo.destroy(ballAmmo);
            scene.remove(ballAmmo.mesh);
            ballAmmo = createPokeball();
            firstSpace = true;
        }
        origin = transform.getOrigin();
        ballAmmo.mesh.position.x = origin.x();
        ballAmmo.mesh.position.y = origin.y();
        ballAmmo.mesh.position.z = origin.z();
        
        rotation = transform.getRotation();
        ballAmmo.mesh.quaternion.x = rotation.x();
        ballAmmo.mesh.quaternion.y = rotation.y();
        ballAmmo.mesh.quaternion.z = rotation.z();
        ballAmmo.mesh.quaternion.w = rotation.w();
        //rotate the flippers (meshes only)
        if (leftWiperPressed && leftWiperAngle < wiperLimit) {
            leftWiperAngle += wiperSpeed;
            wiperAmmoLeft.dummyMesh.rotation.y += wiperSpeed;
        } else if (!leftWiperPressed && leftWiperAngle > 0) {
            leftWiperAngle -= wiperSpeed;
            wiperAmmoLeft.dummyMesh.rotation.y -= wiperSpeed;
        }
        if (rightWiperPressed && rightWiperAngle < wiperLimit) {
            rightWiperAngle += wiperSpeed;
            wiperAmmoRight.dummyMesh.rotation.y -= wiperSpeed;
        } else if (!rightWiperPressed && rightWiperAngle > 0) {
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

            requestAnimFrame(main);
        }
    }
    
    render = function render() {
        renderer.render(scene, camera);
        // renderer.render(sceneCube, camera);
    };
    
    main = function main() {
        updatePhysics();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };
    
    window.onload = initScene;
})();