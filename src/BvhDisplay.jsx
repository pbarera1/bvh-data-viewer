import {useEffect, useRef, useState, useMemo} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {BVHLoader} from 'three/examples/jsm/loaders/BVHLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import Loading from './Loader';
import styled from 'styled-components';
import {throttle} from './utils';

const StyledSelector = styled.div`
    overflow: auto;
    justify-content: start;
    padding: 8px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: #1b1b1b;
    border-bottom: 1px solid #2a2a2a;

    .label {
        min-width: fit-content;
    }
    .button {
        min-width: fit-content;
        padding: 6px 24px;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
    }
`;

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

    const canvasRef = useRef(null);
    // Refs to three.js parts
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const clockRef = useRef(null);

    // BVH-specific refs
    const mixerRef = useRef(null);
    const skeletonHelperRef = useRef(null);
    const boneGroupRef = useRef(null);

    // setup three.js scene on mount
    useEffect(() => {
        const container = canvasRef.current;
        // set scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);

        // camera
        const camera = new THREE.PerspectiveCamera(
            50,
            container.clientWidth / container.clientHeight,
            0.1,
            1000,
        );
        camera.position.set(-10, 20, 70);
        camera.lookAt(0, 50, 0);

        // renderer
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // controls
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

        // axis
        scene.add(new THREE.GridHelper(2000, 40, 0x888888, 0x444444));
        scene.add(new THREE.AxesHelper(100));

        // hoop model
        const mtlLoader = new MTLLoader();
        mtlLoader.load('/3d-models/hoop.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('/3d-models/hoop.obj', (hoop) => {
                // set position add the scene
                hoop.position.set(0, 0, -70);
                hoop.rotation.x = -Math.PI / 2;
                hoop.scale.set(0.1, 0.1, 0.1);
                scene.add(hoop);
            });
        });

        // ball model
        mtlLoader.load('/3d-models/ball.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('/3d-models/ball.obj', (ball) => {
                // set position, add to scene
                ball.position.set(0, 1, -60);
                ball.rotation.x = -Math.PI / 2;
                ball.scale.set(0.1, 0.1, 0.1);
                scene.add(ball);
            });
        });

        // save refs for access outside useEffect
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;
        clockRef.current = clock;

        // resize handler
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            console.log('resizing canvas', w, h);
            renderer.setSize(w, h);
        };
        const throttledOnResize = throttle(onResize, 300);
        window.addEventListener('resize', throttledOnResize);

        // animate
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
            window.removeEventListener('resize', throttledOnResize);
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
                // skeleton
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

    // load BVH when bvhPath changes
    useEffect(() => {
        if (!sceneRef.current) return;
        // reset camera when new dataset loaded
        if (cameraRef.current) {
            cameraRef.current.position.set(-10, 20, 70);
            cameraRef.current.lookAt(0, 50, 0);
        }
        loadBVH(bvhPath);
    }, [bvhPath]);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
            }}>
            {/* toolbar */}
            <StyledSelector>
                <span className="label">Select Dataset:</span>
                {bvhOptions.map((opt) => (
                    <button
                        className="button"
                        key={opt.path}
                        onClick={() => setBvhPath(opt.path)}
                        style={{
                            background:
                                bvhPath === opt.path
                                    ? 'var(--dodgerblue)'
                                    : 'var(--gray-400)',
                        }}>
                        {bvhPath === opt.path && loading && (
                            <Loading
                                fill="#fff"
                                style={{
                                    position: 'absolute',
                                    left: '4px',
                                    width: '12px',
                                    height: '12px',
                                    margin: '0',
                                }}
                            />
                        )}
                        {opt.label}
                    </button>
                ))}
            </StyledSelector>
            {/* canvas for three.js */}
            <div ref={canvasRef} style={{width: '100%', height: '100%'}} />
        </div>
    );
};

export default BvhDisplay;
