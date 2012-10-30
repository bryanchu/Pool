Ball = {
    velocityY: 10,
    velocityX: 0
}

$(function() {   
    var camera, scene, renderer;
    var geometry, material, mesh;

    var container = $('#container')[0];

    init();
    animate();

    function init() {

        camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
        camera.position.z = 1000;

        scene = new THREE.Scene();

        var ball1 = THREE.ImageUtils.loadTexture("/img/pokeball.png");

        geometry = new THREE.SphereGeometry( 200, 200, 200 );
        material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x888888, map: ball1} );

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        // create a point light
        var pointLight = new THREE.DirectionalLight(0xFFFFFF);
        //create an ambient light
        var ambientLight = new THREE.AmbientLight(0x0000FF);

        // set its position
        pointLight.position.x = -500;
        pointLight.position.y = 200;
        pointLight.position.z = 1000;

        // add to the scene
        scene.add(pointLight);
        //scene.add(ambientLight);

        controls = new THREE.TrackballControls(camera, container);
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.1;
        controls.keys = [65, 83, 68];

        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        container.appendChild( renderer.domElement );

    }

    function animate() {

        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame( animate );

        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;

        mesh.position.x += Ball.velocityX;
        mesh.position.y += Ball.velocityY;
        Ball.velocityY -= 1;
        if (mesh.position.y < 0 - window.innerHeight) {
            Ball.velocityY = 0 - Ball.velocityY;
        }
        //console.log(mesh.position.y);
        controls.update();
        renderer.render( scene, camera );

    }
});