//Bryan Chu | Pokemon Pinball in WEBGL
//TODO: finish refactoring everything
//      color changing
//      voltorb bouncing
(navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && alert("Please use Chrome for optimal WebGL.");

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
PB = {};
//SINGLETONS
PB.GlobalControl = function() {
    var collisionConfiguration, dispatcher, overlappingPairCache, solver, ground, groundShape, groundTransform, groundMass, localInertia, motionState, rbInfo, groundAmmo,//Ammo private variables
        renderer, light, camera, controls, wiperTransform, wiperLeft, wiperRight,//mesh private variables
        waitingAJAXCalls,//miscellaneous private variables
        leftWiperAngle = 0, rightWiperAngle = 0, fieldWidth = 550, fieldHeight = 875, wiperSpeed = .4, wiperLimit = .8, rightWiperX = 0, bothWiperY = 0, bothWiperZ= 377, leftWiperX = -85, wiperRotation = .6,
        leftWiperPressed = false, rightWiperPressed = false, leftForce = false, rightForce = false, leftHolding = false, rightHolding = false, firstSpace = true,
        animMeshes = {},
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
                    Green: 0x00DE1A};
    var self = {};
    self.BOUNCYPOINTERS = {};
    self.BOUNCYOBJECTS = {};
    self.initScene = function() {
        PB.ScoreManager.scoreEl = document.getElementById('score');

        PB.AudioManager.sounds.themeSound.addEventListener('ended', function() {
            this.currentTime = 0;
            this.themeSound.play();
        }, false);
        PB.AudioManager.play("themeSound");
        
        // Renderer
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById( 'container' ).appendChild( renderer.domElement );
        
        // Scene
        self.scene = new THREE.Scene();

        // Ammo world
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        overlappingPairCache = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        self.scene.world = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
        self.scene.world.setGravity(new Ammo.btVector3(0, -42, 250));

        //flippers
        var wiperWidth = 70, wiperHeight = 70;
        wiperRight= new PB.Wall({width: wiperWidth,
                                    height: wiperHeight,
                                    depth: 1,
                                    img: null,
                                    rotationX: wiperRotation,
                                    rotationY: Math.PI / 2,
                                    rotationZ: 0,
                                    origX: rightWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000,
                                    id: "rightWiper"});
        wiperLeft = new PB.Wall({width: wiperWidth,
                                    height: wiperHeight,
                                    depth: 1,
                                    img: null,
                                    rotationX: -wiperRotation,
                                    rotationY: Math.PI / 2,
                                    rotationZ: 0,
                                    origX: leftWiperX,
                                    origY: bothWiperY,
                                    origZ: bothWiperZ,
                                    rest: 1000,
                                    id: "leftWiper"});
        //the ball
        self.pokeball =  new PB.Pinball();

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
        light.target.position.copy( self.scene.position );
        light.castShadow = true;
        light.shadowCameraLeft = -25;
        light.shadowCameraTop = -25;
        light.shadowCameraRight = 25;
        light.shadowCameraBottom = 25;
        light.shadowBias = -.0001;
        self.scene.add( light );
        
        // Camera
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            1,
            50000
        );
        camera.position.set( 0, 800, 300 );
        camera.lookAt( self.scene.position );
        self.scene.add( camera );

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

        //Create Voltorbs
        new PB.Ball({
            mass: 0,
            mapURL: "img/voltorb.gif",
            origX: -85,
            origY: 0,
            origZ: -155,
            rotationX: -Math.PI / 2,
            rotationY: 0,
            rotationZ: -Math.PI / 3,
            size: 22,
            useQuat : false,
            rest: false,
            id: "leftVoltorb",
            isBouncy: true
        });
        new PB.Ball({
            mass: 0,
            mapURL: "img/voltorb.gif",
            origX: -20,
            origY: 0,
            origZ: -185,
            rotationX: -Math.PI / 2,
            rotationY: 0,
            rotationZ: -Math.PI / 3,
            size: 22,
            useQuat : false,
            rest: false,
            id: "rightVoltorb",
            isBouncy: true
        });
        new PB.Ball({
            mass: 0,
            mapURL: "img/voltorb.gif",
            origX: -35,
            origY: 0,
            origZ: -105,
            rotationX: -Math.PI / 2,
            rotationY: 0,
            rotationZ: -Math.PI / 3,
            size: 22,
            useQuat : false,
            rest: false,
            id: "bottomVoltorb",
            isBouncy: true
        });
        //Create diglet ammos.
        new PB.Ball({
            mass: 0,
            mapURL: null,
            origX: -190,
            origY: 0,
            origZ: 135,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            size: 22,
            useQuat : true
        });
        new PB.Ball({
            mass: 0,
            mapURL: null,
            origX: 100,
            origY: 0,
            origZ: 145,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            size: 22,
            useQuat : true
        });
        function createBlender(geometry, config) {
            geometry.mergeVertices();
            var Meshtype = config.meshType == "Lambert" ? THREE.MeshLambertMaterial : (config.meshType == "Basic" ? THREE.MeshBasicMaterial : THREE.MeshPhongMaterial);
            var material = new Meshtype({specular: 0x888888, color: config.color});// map: THREE.ImageUtils.loadTexture("/img/redTest.png")});
            var mesh = new THREE.Mesh( geometry, material );
            mesh.useQuaternion = true;//config.useQuat;
            mesh.scale.set(50, 50, 50);
            PB.GlobalControl.scene.add(mesh);
            return mesh;
        }

        //TODO: fix ammo mesh rotation correlation.
        //Create the ground image.
        new PB.Wall({width: fieldHeight,
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
        new PB.Wall({width: fieldWidth * 2,
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
        new PB.Wall({height: 100,
                    rotationX: 0,
                    origX: 200,
                    origZ: 440});
        //wall under staryu
        new PB.Wall({height: 65,
                    rotationX: Math.PI / 4,
                    origX: -108,
                    origZ: -42});
        //smaller wall
        new PB.Wall({height: 30,
                    rotationX: Math.PI / 4,
                    origX: -153,
                    origZ: 37});
        //straight vertical wall on staryu island
        new PB.Wall({height: 35,
                    rotationX: Math.PI / 2,
                    origX: -135,
                    origZ: -210});
        //straight extension of staryu island
        new PB.Wall({height: 70,
                    rotationX: -Math.PI / 4,
                    origX: -110,
                    origZ: -90});
        //left-side left vertical blue wall
        new PB.Wall({height: 45,
                    rotationX: Math.PI / 2,
                    origX: -85,
                    origZ: -248});
        //right-side left vertical blue wall
        new PB.Wall({height: 50,
                    rotationX: Math.PI / 2,
                    origX: -70,
                    origZ: -255});
        //left-side right vertical blue wall
        new PB.Wall({height: 45,
                    rotationX: Math.PI / 2,
                    origX: -25,
                    origZ: -270});
        //right-side right vertical blue wall
        new PB.Wall({height: 45,
                    rotationX: Math.PI / 2,
                    origX: -5,
                    origZ: -270});
        //right orange sickle bottom surface
        new PB.Wall({height: 140,
                    rotationX: -.9,
                    origX: 115,
                    origZ: -255});
        //left bellsprout wall
        new PB.Wall({height: 200,
                    rotationX: -1.6,
                    origX: 40,
                    origZ: -180});
        //left bellsprout wall extension
        new PB.Wall({height: 50,
                    rotationX: 1.4,
                    origX: 35,
                    origZ: -58});
        //bellsprout lowest wall
        new PB.Wall({height: 45,
                    rotationX: -.8,
                    origX: 70,
                    origZ: 35});
        //bottom left vertical blue wall
        new PB.Wall({height: 70,
                    rotationX: Math.PI / 2,
                    origX: -202,
                    origZ: 255});
        //bottom right vertical blue wall
        new PB.Wall({height: 70,
                    rotationX: Math.PI / 2,
                    origX: 117,
                    origZ: 255});
        //bottom left slanted blue wall
        new PB.Wall({height: 110,
                    rotationX: -3.75,
                    origX: -160,
                    origZ: 325});
        //bottom left slanted blue wall
        new PB.Wall({height: 110,
                    rotationX: 3.75,
                    origX: 70,
                    origZ: 325});
        //left side left triangle
        new PB.Wall({height: 70,
                    rotationX: Math.PI / 2,
                    origX: -165,
                    origZ: 245});
        //right side right triangle
        new PB.Wall({height: 70,
                    rotationX: Math.PI / 2,
                    origX: 85,
                    origZ: 245});
        //bouncy wall left triangle
        new PB.Wall({height: 90,
                    rotationX: -1.2,
                    origX: -145,
                    origZ: 255,
                    id: "leftBumper",
                    isBouncy: true});
        //bouncy wall right triangle
        new PB.Wall({height: 90,
                    rotationX: 1.2,
                    origX: 65,
                    origZ: 255,
                    id: "rightBumper",
                    isBouncy: true});
        //wall left of starting position
        new PB.Wall({height: 90,
                    rotationX: Math.PI / 2,
                    origX: 185,
                    origZ: 400});
        //left bottom wall
        new PB.Wall({height: 200,
                    rotationX: Math.PI / 2,
                    origX: -258,
                    origZ: 300});
        //right bottom wall
        new PB.Wall({height: 200,
                    rotationX: Math.PI / 2,
                    origX: 165,
                    origZ: 300});
        //left fallout wall
        new PB.Wall({height: 200,
                    rotationX: -.6,
                    origX: -190,
                    origZ: 380});
        //right fallout wall
        new PB.Wall({height: 200,
                    rotationX: .6,
                    origX: 100,
                    origZ: 380});
        //top tiny wall for preventing stuck
        new PB.Wall({height: 10,
                    rotationX: 0,
                    origX: -20,
                    origZ: -295});
        //left diglet escape prevention
        new PB.Wall({height: 20,
                    rotationX: Math.PI / 2,
                    origX: -200,
                    origZ: 115});
        //right diglet escape prevention
        new PB.Wall({height: 20,
                    rotationX: Math.PI / 2,
                    origX: 100,
                    origZ: 115});
        //left bottom bumper wall
        new PB.Wall({height: 40,
                    rotationX: -.7,
                    origX: -150,
                    origZ: 290});
        //right bottom bumper wall
        new PB.Wall({height: 40,
                    rotationX: .7,
                    origX: 70,
                    origZ: 290});
        //inner bellsprout right wall
        new PB.CurvedWall({
            reps: 8,
            startAngle: -2.3,
            endAngle: -.8,
            centerX: -100,
            centerZ: -100,
            radius: 200
        });
        // top red semicircle
        new PB.CurvedWall({
            reps: 25,
            startAngle: -Math.PI / 2,
            endAngle: 1 * Math.PI / 2,
            centerX: -20,
            centerZ: -148,//160,
            radius: 245
        });
        //left upper wall
        new PB.CurvedWall({
            reps: 10,
            startAngle: 1.1,
            endAngle: 2.2,
            centerX: 145,
            centerZ: -125,
            radius: 400
        });
        //right upper wall
        new PB.CurvedWall({
            reps: 10,
            startAngle: -2.1,
            endAngle: -1.2,
            centerX: -235,
            centerZ: -125,
            radius: 400
        });
        //left side of small left island
        new PB.CurvedWall({
            reps: 8,
            startAngle: 1.3,
            endAngle: 2.2,
            centerX: 20,
            centerZ: -80,
            radius: 230
        });
        //right side of small left island
        new PB.CurvedWall({
            reps: 8,
            startAngle: 1.4,
            endAngle: 2.4,
            centerX: 10,
            centerZ: -120,
            radius: 210
        });
        //left side of staryu island
        new PB.CurvedWall({
            reps: 8,
            startAngle: 1.15,
            endAngle: 2.1,
            centerX: 60,
            centerZ: -120,
            radius: 220
        });
        //inner curve of staryu island
        new PB.CurvedWall({
            reps: 6,
            startAngle: 1.1,
            endAngle: 2.2,
            centerX: -75,
            centerZ: -150,
            radius: 70
        });
        //top orange sickle
        new PB.CurvedWall({
            reps: 12,
            startAngle: -.6,
            endAngle: .6,
            centerX: -45,
            centerZ: -130,
            radius: 206
        });
        //left lower wall
        new PB.CurvedWall({
            reps: 10,
            startAngle: .3,
            endAngle: Math.PI / 2,
            centerX: -200,
            centerZ: 220,
            radius: 50
        });
        //right lower wall
        new PB.CurvedWall({
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
    
        self.scene.add(skybox);
    };

    function render() {
        renderer.render(self.scene, camera);
    };

    function main() {
        updatePhysics();
        controls.update();
        render();
        window.requestAnimFrame(main);
    };

    function updatePhysics() {
        var scene = PB.GlobalControl.scene;
        var pokeball = PB.GlobalControl.pokeball;
        var transform = new Ammo.btTransform(), origin, rotation;
        scene.world.stepSimulation( 1 / 60, 5 );
        var numManifolds = scene.world.getDispatcher().getNumManifolds();
        for (var i = 0; i < numManifolds; i++) {
            var contactManifold = scene.world.getDispatcher().getManifoldByIndexInternal(i);
            var obA = contactManifold.getBody0();
            var obB = contactManifold.getBody1();
            var obCollision = self.BOUNCYPOINTERS[obA] || self.BOUNCYPOINTERS[obB];
            if (obCollision) {
                if (contactManifold.getContactPoint(0).getDistance() < .3) {
                    obCollision.wrapper.createForce();
                }
            }
        }

        if (leftForce) {
            wiperLeft.createForce();
            leftForce = false;
        } else if (rightForce) {
            wiperRight.createForce();
            rightForce = false;
        }
        
        pokeball.ammo.getMotionState().getWorldTransform(transform);
        if (transform.getOrigin().z() > fieldHeight) {
            pokeball.remove();
            PB.GlobalControl.pokeball = new PB.Pinball();
            firstSpace = true;
        }
        origin = transform.getOrigin();
        pokeball.mesh.position.x = origin.x();
        pokeball.mesh.position.y = origin.y();
        pokeball.mesh.position.z = origin.z();
        
        rotation = transform.getRotation();
        pokeball.mesh.quaternion.x = rotation.x();
        pokeball.mesh.quaternion.y = rotation.y();
        pokeball.mesh.quaternion.z = rotation.z();
        pokeball.mesh.quaternion.w = rotation.w();
        //rotate the flippers (meshes only)
        if (leftWiperPressed && leftWiperAngle < wiperLimit) {
            leftWiperAngle += wiperSpeed;
            wiperLeft.dummyMesh.rotation.y += wiperSpeed;
        } else if (!leftWiperPressed && leftWiperAngle > 0) {
            leftWiperAngle -= wiperSpeed;
            wiperLeft.dummyMesh.rotation.y -= wiperSpeed;
        }
        if (rightWiperPressed && rightWiperAngle < wiperLimit) {
            rightWiperAngle += wiperSpeed;
            wiperRight.dummyMesh.rotation.y -= wiperSpeed;
        } else if (!rightWiperPressed && rightWiperAngle > 0) {
            rightWiperAngle -= wiperSpeed;
            wiperRight.dummyMesh.rotation.y += wiperSpeed;
        }
    };

    function initAnim() {
        if (!waitingAJAXCalls) {
            wiperLeft.mesh = animMeshes.leftWiper;
            var dummyLeft = new THREE.Object3D();
            var xOffset = 110;
            var zOffset = -380;
            wiperLeft.mesh.position.x = xOffset;
            wiperLeft.mesh.position.z = zOffset;
            dummyLeft.position.x = -xOffset;
            dummyLeft.position.z = -zOffset;
            dummyLeft.add(wiperLeft.mesh);
            wiperLeft.dummyMesh = dummyLeft;
            PB.GlobalControl.scene.add(dummyLeft);

            wiperRight.mesh = animMeshes.rightWiper;
            var dummyRight = new THREE.Object3D();
            xOffset = -30;
            zOffset = -380;
            wiperRight.mesh.position.x = xOffset;
            wiperRight.mesh.position.z = zOffset;
            dummyRight.position.x = -xOffset;
            dummyRight.position.z = -zOffset;
            dummyRight.add(wiperRight.mesh);
            wiperRight.dummyMesh = dummyRight;
            PB.GlobalControl.scene.add(dummyRight);

            document.getElementById('loadScreen').style.visibility = 'hidden';
            document.getElementById('score').style.visibility = 'visible';

            requestAnimFrame(main);
        }
    };

    function initControls() {
        document.addEventListener('keydown', function(e) {
            if (e.keyCode == 37) {
                !leftHolding && PB.AudioManager.play("flipperSound");
                setTimeout(function() {
                    if (leftHolding) {
                        var wiperRotationQuat = new Ammo.btQuaternion();
                        var wiperTransformChange = new Ammo.btTransform();
                        wiperRotationQuat.setEuler(.1, Math.PI / 2, 0);
                        wiperTransformChange.setRotation(wiperRotationQuat);
                        wiperTransformChange.setOrigin(new Ammo.btVector3(leftWiperX + 5, bothWiperY, bothWiperZ - 15));
                        wiperLeft.ammo.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
                    }
                }, 100);

                leftWiperPressed = true;
                leftForce = !leftHolding;
                leftHolding = true;
            } else if (e.keyCode == 39) {
                !rightHolding && PB.AudioManager.play("flipperSound");
                setTimeout(function() {
                    if (rightHolding) {
                        var wiperRotationQuat = new Ammo.btQuaternion();
                        var wiperTransformChange = new Ammo.btTransform();
                        wiperRotationQuat.setEuler(-.1, Math.PI / 2, 0);
                        wiperTransformChange.setRotation(wiperRotationQuat);
                        wiperTransformChange.setOrigin(new Ammo.btVector3(rightWiperX + 5, bothWiperY, bothWiperZ - 15));
                        wiperRight.ammo.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
                    }
                }, 100);

                rightWiperPressed = true;
                rightForce = !rightHolding;
                rightHolding = true;
            } else if (e.keyCode == 32 && firstSpace) {
                PB.AudioManager.play("launchSound");
                firstSpace = false;
                PB.GlobalControl.pokeball.ammo.applyCentralImpulse(new Ammo.btVector3(0, 0, -200000));
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
                wiperLeft.ammo.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            } else if (e.keyCode == 39) {
                rightWiperPressed = false;
                rightHolding = false;

                var wiperRotationQuat = new Ammo.btQuaternion();
                var wiperTransformChange = new Ammo.btTransform();
                wiperRotationQuat.setEuler(wiperRotation, Math.PI / 2, 0);
                wiperTransformChange.setRotation(wiperRotationQuat);
                wiperTransformChange.setOrigin(new Ammo.btVector3(rightWiperX, bothWiperY, bothWiperZ));
                wiperRight.ammo.setMotionState(new Ammo.btDefaultMotionState(wiperTransformChange));
            }
        });
    };
    return self;
}();
PB.ScoreManager = function() {
    var self = {};
    self.add = function(val) {
        var score = this.scoreEl;
        score && (score.innerHTML = parseInt(score.innerHTML) + val);
    };
    return self;
}();
PB.AudioManager = function() {
    var self = {};
    self.sounds = {
        flipperSound : new Audio("sounds/flipper.mp3"), 
        launchSound : new Audio("sounds/launch.mp3"), 
        themeSound : new Audio("sounds/theme.mp3"), 
        bounceSound : new Audio("sounds/boing.mp3")
    }
    self.play = function(soundName) {
        self.sounds[soundName].play();
    };
    return self;
}();
//CLASSES
PB.AmmoThreeObject = function(config) {
    this.config = config;
};
PB.AmmoThreeObject.prototype.addBouncy = function(object) {
    PB.GlobalControl.BOUNCYPOINTERS[object.a] = object;
}
PB.AmmoThreeObject.prototype.assignValues = function() {
    this.mesh.receiveShadow = true;
    this.mesh.useQuaternion = false;
    this.mesh.position.x = this.config.origX;
    this.mesh.position.y = this.config.origY;
    this.mesh.position.z = this.config.origZ;
    this.mesh.rotation.x = this.config.rotationY - Math.PI / 2;//0
    this.mesh.rotation.y = this.config.rotationX;//correct
    this.mesh.rotation.z = this.config.rotationZ;
};
PB.AmmoThreeObject.prototype.remove = function() {
    PB.GlobalControl.scene.remove(this.mesh);
    Ammo.destroy(this.ammo);
};
PB.AmmoThreeObject.prototype.createForce = function() {
    var vector;
    var d = PB.WiperData;
    var pokeball = PB.GlobalControl.pokeball;
    var posX = pokeball.mesh.position.x,
        posZ = pokeball.mesh.position.z;
    var baseHit = 70000,
        baseBounce = 30000;
    switch (this.ammo.id) {
        case "leftBumper":
            PB.AudioManager.play("bounceSound");
            PB.ScoreManager.add(150);
            posZ < 300 && (vector = new Ammo.btVector3(baseBounce, 0, -baseBounce));
            break;
        case "rightBumper":
            PB.AudioManager.play("bounceSound");
            PB.ScoreManager.add(150);
            posZ < 300 && (vector = new Ammo.btVector3(-baseBounce, 0, -baseBounce));
            break;
        case "leftWiper":
            var distX, distY;
            if (this.checkZone(true)) {
                vector = new Ammo.btVector3((d.zOrig - posZ) * ((d.xOrigLeft - posX) / 40) * 1000, 0, -baseHit * (((posZ - d.zOrig) / 30) + .6) * (((posX - d.xOrigLeft) / 40) + .8));
                PB.ScoreManager.add(200);
            }
            break;
        case "rightWiper":
            var distX, distY;
            if (this.checkZone(false)) {
                vector = new Ammo.btVector3((d.zOrig - posZ) * ((d.xOrigRight - posX) / 40) * 1000, 0, -baseHit * (((posZ - d.zOrig) / 30) + .6) * (((d.xOrigRight - posX) / 40) + .8));
                PB.ScoreManager.add(200);
            }
            break;
        case "leftVoltorb":
        case "rightVoltorb":
        case "bottomVoltorb":
            PB.AudioManager.play("bounceSound");
            var diffZ = this.mesh.position.z - pokeball.mesh.position.z,
                diffX = pokeball.mesh.position.x - this.mesh.position.x;
            var angle = Math.atan(diffZ / diffX);
            (diffX < 0) && (angle += Math.PI);
            console.log(angle);
            vector = new Ammo.btVector3(baseBounce * Math.cos(angle), 0, -baseBounce * Math.sin(angle));
            PB.ScoreManager.add(250);
            break;
        default:
            console.log("Bad things.")
    }
    vector && PB.GlobalControl.pokeball.ammo.applyCentralImpulse(vector);
};
PB.Wall = function(config) {
    PB.AmmoThreeObject.call(this, config);
    var scene = PB.GlobalControl.scene;
    //defaults (explicitly check undefined b/c !0 == true and null == undefined (not necessary for all but might as well be consistent))
    (config.rotationY === undefined) && (config.rotationY = Math.PI / 2);
    (config.rotationZ === undefined) && (config.rotationZ = 0);
    (config.width === undefined) && (config.width = 100);
    (config.depth === undefined) && (config.depth = 1);
    (config.origY === undefined) && (config.origY = 0);
    (config.img === undefined) && (config.img = PB.Wall.testColor);
    //mesh
    if (config.img) {
        this.mesh = new THREE.Mesh(
            new THREE.CubeGeometry( config.height, config.width, config.depth ),
            typeof config.img == "number" ? new THREE.MeshBasicMaterial({ color: config.img }) : new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888,  map: config.img })
        );
        this.assignValues();
        this.mesh.useQuaternion = false;
        PB.GlobalControl.scene.add( this.mesh );
    }
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
        config.isBouncy && this.addBouncy(groundAmmo);
        groundAmmo.id = config.id;
        this.ammo = groundAmmo;
        groundAmmo.wrapper = this;
    }
};
PB.Wall.prototype = new PB.AmmoThreeObject();
PB.Wall.prototype.checkZone = function(left) {
    var posX = PB.GlobalControl.pokeball.mesh.position.x,
        posZ = PB.GlobalControl.pokeball.mesh.position.z
        leftFulcrumX = -110,
        rightFulcrumX = 25;
    var d = PB.WiperData;
        
    if (left && posX < d.xLimitLeft && posX > leftFulcrumX) {
        if (posZ > d.zOrig) {
            return posZ < d.zOrig + (posX - leftFulcrumX);
        } else {
            return posZ > d.zOrig - (posX - leftFulcrumX) * .2;
        }
    } else if (!left && posX < rightFulcrumX && posX > d.xLimitRight) {
        if (posZ > d.zOrig) {
            return posZ < d.zOrig + (rightFulcrumX - posX);
        } else {
            return posZ > d.zOrig - (rightFulcrumX - posX) * .2;
        }
    }
}
PB.Wall.testColor = null;
PB.CurvedWall = function(config) {
    var rotAngle;
    for (var i = 0; i < config.reps; i++) {
        rotAngle = config.startAngle + (((config.endAngle - config.startAngle) / config.reps) * i);
        new PB.Wall({height: (config.endAngle - config.startAngle) / config.reps * config.radius,
                    img: PB.Wall.testColor,
                    rotationX: rotAngle,
                    origX: config.centerX - (Math.sin(rotAngle) * config.radius),
                    origZ: config.centerZ - (Math.cos(rotAngle) * config.radius)
        });
    }
};
PB.Ball = function(config) {
    var ball, position_x, position_z, pokeball, scene = PB.GlobalControl.scene,
        startTransform, localInertia, boxShape, motionState, rbInfo;

    PB.AmmoThreeObject.call(this, config);
    this.radius = config.size;
    // Create 3D ball model
    if (config.mapURL) {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry( config.size, config.size, config.size),
            new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x888888, map: THREE.ImageUtils.loadTexture(config.mapURL) })
        );

        this.assignValues();
        this.mesh.useQuaternion = config.useQuat;
        PB.GlobalControl.scene.add( this.mesh );
    }
            
    // Create ball physics model
    startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3( config.origX, config.origY, config.origZ ));
    
    localInertia = new Ammo.btVector3(0, 0, 0);
    
    boxShape = new Ammo.btSphereShape(config.size);
    boxShape.calculateLocalInertia( config.mass, localInertia );
    
    motionState = new Ammo.btDefaultMotionState( startTransform );
    rbInfo = new Ammo.btRigidBodyConstructionInfo( config.mass, motionState, boxShape, localInertia );
    rbInfo.m_restitution = config.rest;
    pokeball = new Ammo.btRigidBody( rbInfo );
    scene.world.addRigidBody( pokeball );
    config.isBouncy && this.addBouncy(pokeball);
    pokeball.mesh = this.mesh;
    this.ammo = pokeball;
    this.ammo.id = config.id;
    this.ammo.wrapper = this;
};
PB.Ball.prototype = new PB.AmmoThreeObject();
PB.Pinball = function() {//There can only be one
    var startX = 205, startZ = 330;
    PB.Ball.call(this, {
        mass: 100,
        mapURL: "img/pokeball.png",
        origX: startX,
        origY: 0,
        origZ: startZ,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        size: 13,
        useQuat: true,
        rest: 2
    });
    this.ammo.setSleepingThresholds(0, 0);
};
PB.Pinball.prototype = new PB.AmmoThreeObject();
PB.WiperData = {
    xLimitRight : -35, 
    xOrigRight : 15, 
    zOrig : 345,
    xLimitLeft : -50, 
    xOrigLeft : -110
};

window.onload = PB.GlobalControl.initScene;
