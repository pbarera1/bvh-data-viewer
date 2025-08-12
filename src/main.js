import {BVHLoader} from 'three/examples/jsm/loaders/BVHLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'; // For retargeting
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';

let scene, camera, renderer, clock, skeletonHelper, model, mixer, controls;

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.set(-50, 20, 70);
    camera.lookAt(0, 50, 0);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 200, 0);
    hemiLight.intensity = 2; // Increase the intensity
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 200, 100);
    dirLight.intensity = 5; // Increase the intensity
    scene.add(dirLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x555555,
        depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Make it horizontal
    floor.position.y = 0;
    scene.add(floor);

    // Grid lines
    const gridHelper = new THREE.GridHelper(2000, 40, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Axis
    scene.add(new THREE.AxesHelper(100));

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 50, 0);
    controls.update();

    // Clock
    clock = new THREE.Clock();

    // Load BVH file
    const loader = new BVHLoader();
    loader.load(
        '/bball.bvh',
        function (result) {
            skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
            skeletonHelper.skeleton = result.skeleton;
            scene.add(skeletonHelper);

            // Calculate the bounding box of the skeleton to find its center
            const box = new THREE.Box3().setFromObject(skeletonHelper);
            const center = box.getCenter(new THREE.Vector3());

            // Center the camera on the skeleton and zoom in
            controls.target.copy(center);
            controls.update();

            // The BVHLoader returns THREE.AnimationClip(s)
            mixer = new THREE.AnimationMixer(skeletonHelper);
            mixer.clipAction(result.clip).play();

            const boneContainer = new THREE.Group();
            boneContainer.add(result.skeleton.bones[0]);
            scene.add(boneContainer);
        },
        function (xhr) {
            console.log(`BVH ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        function (error) {
            console.error('Error loading BVH', error);
        },
    );

    // Load the MTL the obj file for hoop
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
        '/hoop.mtl',
        function (materials) {
            // After the materials are loaded, preload them
            materials.preload();

            // Create an OBJLoader and set the materials
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);

            // load the OBJ file
            objLoader.load(
                '/hoop.obj',
                function (hoop) {
                    // Position, scale, and add to the scene
                    hoop.position.set(0, 0, -70);
                    hoop.rotation.x = -Math.PI / 2;
                    hoop.scale.set(0.1, 0.1, 0.1);
                    scene.add(hoop);
                },
                function (xhr) {
                    console.log(`OBJ ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                function (error) {
                    console.error('An error occurred loading the OBJ file:', error);
                },
            );
        },
        function (xhr) {
            console.log(`MTL ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        function (error) {
            console.error('An error occurred loading the MTL file:', error);
        },
    );

    // Load the MTL the obj file for ball
    mtlLoader.load(
        '/ball.mtl',
        function (materials) {
            // After the materials are loaded, preload them
            materials.preload();

            // Create an OBJLoader and set the materials
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);

            // load the OBJ file
            objLoader.load(
                '/ball.obj',
                function (ball) {
                    // Position, scale, and add to the scene
                    ball.position.set(0, 1, -60);
                    ball.rotation.x = -Math.PI / 2;
                    ball.scale.set(0.1, 0.1, 0.1);
                    scene.add(ball);
                },
                function (xhr) {
                    console.log(`OBJ ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                function (error) {
                    console.error('An error occurred loading the OBJ file:', error);
                },
            );
        },
        function (xhr) {
            console.log(`MTL ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        function (error) {
            console.error('An error occurred loading the MTL file:', error);
        },
    );

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
}
