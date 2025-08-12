import {useEffect, useRef, useState, useMemo} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {BVHLoader} from 'three/examples/jsm/loaders/BVHLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import Loading from './Loader';

const BvhDisplay = (props) => {
    const [loading, setLoading] = useState(false);
    const [bvhPath, setBvhPath] = useState('/bvh-data/crossover.bvh');
    const bvhOptions = [
        {label: 'Crossover - Shoot', path: '/bvh-data/crossover.bvh'},
        {label: 'Through Legs', path: '/bvh-data/through-legs.bvh'},
        {label: 'Dribbble Forward', path: '/bvh-data/forward-dribble.bvh'},
        {label: 'Dribbble Back', path: '/bvh-data/backward-dribble.bvh'},
        {label: 'Dribbble Side', path: '/bvh-data/sideways-dribble.bvh'},
    ];

    const mountRef = useRef(null);
    // Refs to engine bits we need across handlers
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const clockRef = useRef(null);

    // BVH-specific refs so we can dispose/swap
    const mixerRef = useRef(null);
    const skeletonHelperRef = useRef(null);
    const boneGroupRef = useRef(null);

    // one-time scene setup
    useEffect(() => {
        const container = mountRef.current;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);

        const camera = new THREE.PerspectiveCamera(
            50,
            container.clientWidth / container.clientHeight,
            0.1,
            1000,
        );
        camera.position.set(-50, 20, 70);
        camera.lookAt(0, 50, 0);

        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 50, 0);
        controls.enableDamping = true;

        const clock = new THREE.Clock();

        // lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
        hemiLight.position.set(0, 200, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 5);
        dirLight.position.set(0, 200, 100);
        scene.add(dirLight);

        // floor + helpers
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            depthWrite: false,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        scene.add(new THREE.GridHelper(2000, 40, 0x888888, 0x444444));
        scene.add(new THREE.AxesHelper(100));

        // Load hoop (unchanged)
        const mtlLoader = new MTLLoader();
        mtlLoader.load('/3d-models/hoop.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('/3d-models/hoop.obj', (hoop) => {
                hoop.position.set(0, 0, -70);
                hoop.rotation.x = -Math.PI / 2;
                hoop.scale.set(0.1, 0.1, 0.1);
                scene.add(hoop);
            });
        });

        // Load ball (unchanged visual)
        mtlLoader.load('/3d-models/ball.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('/3d-models/.obj', (ball) => {
                ball.position.set(0, 1, -60);
                ball.rotation.x = -Math.PI / 2;
                ball.scale.set(0.1, 0.1, 0.1);
                scene.add(ball);
            });
        });

        // save refs
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;
        clockRef.current = clock;

        // resize
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        let raf;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const delta = clock.getDelta();
            if (mixerRef.current) mixerRef.current.update(delta);
            controls.update();
            renderer.render(scene, camera);
        };
        tick();

        // cleanup
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            controls.dispose();
            renderer.dispose();
            floorGeometry.dispose();
            floorMaterial.dispose();
            container.removeChild(renderer.domElement);
            scene.clear();
        };
    }, []);

    // function to dispose prior BVH
    const disposeBVH = () => {
        const scene = sceneRef.current;
        if (!scene) return;

        // stop/clear mixer
        if (mixerRef.current) {
            mixerRef.current.stopAllAction();
            mixerRef.current.uncacheRoot(skeletonHelperRef.current);
            mixerRef.current = null;
        }
        // remove skeleton helper
        if (skeletonHelperRef.current) {
            skeletonHelperRef.current.geometry?.dispose?.();
            if (Array.isArray(skeletonHelperRef.current.material)) {
                skeletonHelperRef.current.material.forEach((m) => m.dispose?.());
            } else {
                skeletonHelperRef.current.material?.dispose?.();
            }
            scene.remove(skeletonHelperRef.current);
            skeletonHelperRef.current = null;
        }
        // remove bone group
        if (boneGroupRef.current) {
            scene.remove(boneGroupRef.current);
            boneGroupRef.current = null;
        }
    };

    // function to load a BVH path into the existing scene
    const loadBVH = (path) => {
        setLoading(true);
        const scene = sceneRef.current;
        const controls = controlsRef.current;
        if (!scene) return;

        // clear old BVH
        disposeBVH();

        const loader = new BVHLoader();
        loader.load(
            path,
            (result) => {
                setLoading(false);
                const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
                skeletonHelper.skeleton = result.skeleton;
                scene.add(skeletonHelper);
                skeletonHelperRef.current = skeletonHelper;

                // recenter controls target
                const box = new THREE.Box3().setFromObject(skeletonHelper);
                const center = box.getCenter(new THREE.Vector3());
                controls.target.copy(center);
                controls.update();

                // play
                const mixer = new THREE.AnimationMixer(skeletonHelper);
                mixer.clipAction(result.clip).play();
                mixerRef.current = mixer;

                const group = new THREE.Group();
                group.add(result.skeleton.bones[0]);
                scene.add(group);
                boneGroupRef.current = group;
            },
            (xhr) => console.log(`BVH ${(xhr.loaded / xhr.total) * 100}% loaded`),
            (err) => {
                setLoading(false);
                console.error('BVH load error:', err);
            },
        );
    };

    // (re)load BVH whenever bvhPath changes
    useEffect(() => {
        if (!sceneRef.current) return;
        loadBVH(bvhPath);
    }, [bvhPath]);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',

                display: 'grid',
                gridTemplateRows: 'auto 1fr',
            }}>
            {/* simple toolbar */}
            <div
                style={{
                    padding: '8px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    background: '#1b1b1b',
                    borderBottom: '1px solid #2a2a2a',
                }}>
                <span style={{color: '#ddd', fontFamily: 'system-ui'}}>
                    Select BVH Dataset:
                </span>
                {bvhOptions.map((opt) => (
                    <button
                        key={opt.path}
                        onClick={() => setBvhPath(opt.path)}
                        style={{
                            padding: '6px 18px',
                            width: '180px',
                            background: bvhPath === opt.path ? '#2e7df6' : '#2a2a2a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            position: 'relative',
                        }}>
                        {bvhPath === opt.path && loading && (
                            <Loading
                                fill="#fff"
                                style={{
                                    position: 'absolute',
                                    left: '6px',
                                    width: '12px',
                                    height: '12px',
                                    margin: '0',
                                }}
                            />
                        )}
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* canvas mount */}
            <div ref={mountRef} style={{width: '100%', height: '100%'}} />
        </div>
    );
};

export default BvhDisplay;
