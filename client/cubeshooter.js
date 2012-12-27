$(function () {
    //PHYSICS SECTION
    //ammo.js
    // try changing physical properties
    var mygravity = -10;
    var mytargetmass = 1;
    var myprojectilemass = 100;

    var NUM = 25;
    var NUMRANGE = [];
    for (var i = 0; i <= NUM; i++)
    NUMRANGE[i] = i + 1;
    // Bullet-interfacing code
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    var dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    dynamicsWorld.setGravity(new Ammo.btVector3(0, mygravity, 0));

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(1000, 50, 1000));

    var bodies = [];

    var groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -50, 0));

    function addStaticBody(shape, trans) {
        var mass = 0;
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(trans);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, shape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    }

    addStaticBody(groundShape, groundTransform);

    var boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));

    NUMRANGE.forEach(function(i) {
        var startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        if (i == 1) var mass = myprojectilemass;
        else
        mass = mytargetmass;
        var localInertia = new Ammo.btVector3(0, 0, 0);
        boxShape.calculateLocalInertia(mass, localInertia);

        var myMotionState = new Ammo.btDefaultMotionState(startTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, boxShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    });

    function fire() {
        var body = bodies[1];

        var origin = body.getWorldTransform().getOrigin();
        origin.setX(camera.position.x);
        origin.setY(camera.position.y);
        origin.setZ(camera.position.z);
        body.setLinearVelocity(new Ammo.btVector3(-camera.position.x * 2, -camera.position.y * 1.5, -camera.position.z * 2));
        body.activate();
    }

    var quat = new Ammo.btQuaternion(0, 0, 0);

    function stack() {
        NUMRANGE.forEach(function(i) {
            bodies[i].getWorldTransform().setIdentity();
            bodies[i].getWorldTransform().setRotation(quat);
            bodies[i].setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            bodies[i].setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            var origin = bodies[i].getWorldTransform().getOrigin();

            origin.setX((Math.random() - 0.5) * 2);
            origin.setY(4 + i * 2.5);
            origin.setZ((Math.random() - 0.5) * 1);

            bodies[i].activate();
        });
    }

    function wall() {
        NUMRANGE.forEach(function(i) {
            bodies[i].getWorldTransform().setIdentity();
            bodies[i].getWorldTransform().setRotation(quat);
            bodies[i].setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            bodies[i].setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            var origin = bodies[i].getWorldTransform().getOrigin();

            origin.setX((2.01 * (i % 5) - NUM / 5) + 2.5);
            origin.setY(2 + Math.floor(2 * (NUM - i) / 5));
            origin.setZ(0);

            bodies[i].activate();
            if (i == 1) {
                origin.setX(500);
                origin.setY(0);
                origin.setZ(500);
                bodies[i].activate();
            }
        });
    }

    function boom() {
        NUMRANGE.forEach(function(i) {
            bodies[i].getWorldTransform().setIdentity();
            bodies[i].getWorldTransform().setRotation(quat);
            bodies[i].setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            bodies[i].setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            var origin = bodies[i].getWorldTransform().getOrigin();

            origin.setX(Math.random());
            origin.setY(Math.random());
            origin.setZ(Math.random());

            bodies[i].activate();
            if (i == 1) {
                origin.setX(500);
                origin.setY(0);
                origin.setZ(500);
                bodies[i].activate();
            }
        });
    }
    wall();

    var transform = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking


    function readBulletObject(i, pos, quat) {
        var body = bodies[i];
        body.getMotionState().getWorldTransform(transform);
        var origin = transform.getOrigin();
        pos[0] = origin.x();
        pos[1] = origin.y();
        pos[2] = origin.z();
        var rotation = transform.getRotation();
        quat.x = rotation.x();
        quat.y = rotation.y();
        quat.z = rotation.z();
        quat.w = rotation.w();
    }

    function noneActive() {
        var num = 0;
        NUMRANGE.forEach(function(i) {
            var body = bodies[i];
            num += body.isActive();
        });
        return num == 0;
    }

    // Main demo code
    var boxes = [];

    function simulatePhysics(dt) {
        dynamicsWorld.stepSimulation(dt, 1);
        // Read bullet data into JS objects
        for (var i = 0; i <= NUM; i++) {
            var quaternion = new THREE.Quaternion;
            var position = [0, 0, 0];
            readBulletObject(i + 1, position, quaternion);
            boxes[i].position.x = position[0];
            boxes[i].position.y = position[1];
            boxes[i].position.z = position[2];
            boxes[i].quaternion = quaternion;
            boxes[i].useQuaternion = true;
        }
    }

    function restart() {
        stack();
    }

    function checkRestart() {
        if (noneActive()) restart();
    }

    //WebGL section
    //THREE.js

    var shots = 3;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var container, stats;
    var camera, scene, renderer, objects;
    var pointlight;
    var dt;
    var lastUpdate;
    var stacking = false;

    var targetRotation = 0;
    var targetRotationOnMouseDown = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();

    function init() {
        lastUpdate = new Date().getTime();
        container = document.createElement("div");
        document.body.appendChild(container);

        scene = new THREE.Scene();

        addCamera();
        addLights();
        addGrid();
        for (var i = 0; i <= NUM; i++)
        createCube(i);

        scene.fog = new THREE.Fog(0xffff99, 1, 90);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0xffff99), 1);

        container.appendChild(renderer.domElement);

        setEventListeners();

    }


    function addCamera() {
        camera = new THREE.TrackballCamera({

            fov: 60,
            aspect: window.innerWidth / window.innerHeight,
            near: 1,
            far: 1e3,

            rotateSpeed: 1.0,
            zoomSpeed: 1.2,
            panSpeed: 0.8,

            noZoom: false,
            noPan: false,

            staticMoving: true,
            dynamicDampingFactor: 0.3,

            keys: [65, 83, 68]

        });
        camera.position.x = -5;
        camera.position.y = 6;
        camera.position.z = 11.5;

        camera.target.position.y = 5.0;
    }

    function createCube(i) {
        var material = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });
        var geometry = new THREE.CubeGeometry(2, 2, 2);
        boxes[i] = new THREE.Mesh(geometry, material);
        boxes[i].position.x = 0;
        boxes[i].position.y = (i * 10) + 5;
        boxes[i].position.z = 0;
        scene.addObject(boxes[i]);
    }

    function addGrid() {
        var geometry = new THREE.PlaneGeometry(100, 100);

        var xm = [];
        xm.push(new THREE.MeshBasicMaterial({
            "color": 0x372834
        }));
        xm.push(new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            wireframe: true
        }));

        geometry = new THREE.PlaneGeometry(400, 400, 100, 100);

        var ground = new THREE.Mesh(geometry, xm);

        ground.position.set(0, 0, 0);
        ground.rotation.x = -1.57;

        scene.addObject(ground);
    }


    function addLights() {
        var pointLight = new THREE.PointLight(0xffaa00);
        pointLight.position.x = -10;
        pointLight.position.y = 10;
        pointLight.position.z = 10;
        scene.addLight(pointLight);
    }

    function setEventListeners() {

        document.addEventListener('dblclick', onDocumentMouseDown, false);
    }

    function onDocumentMouseDown(event) {
        if(shots == 0){
            //stack();
            wall();
            shots = 3;
        }
        else{  
            fire();
            shots--;
        }
        //boom();
    }

    function animate() {
        requestAnimationFrame(animate);
        render();

    }

    function render() {

        var now = new Date().getTime();
        dt = (now - lastUpdate) / 1000;
        lastUpdate = now;
        simulatePhysics(dt);
        if (stacking) checkRestart();

        // Resize client if necessary
        if (w !== window.innerWidth || h !== window.innerHeight) {
            renderer.setSize(window.innerWidth, window.innerHeight);
            // set old sizes for comparison again
            w = window.innerWidth, h = window.innerHeight;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
    }
});