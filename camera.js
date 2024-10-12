// camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Function to create the camera and controls
export function createCamera(renderer) {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 10); // Start camera facing front of the house
    camera.lookAt(0, 1.5, 0); // Look at the front of the house

    // Set up OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;

    return { camera, controls };
}

// Function to move the camera
export function moveCamera(camera, direction, speed) {
    switch (direction) {
        case 'up':
            camera.position.z -= speed;
            break;
        case 'down':
            camera.position.z += speed;
            break;
        case 'left':
            camera.position.x -= speed;
            break;
        case 'right':
            camera.position.x += speed;
            break;
        default:
            break;
    }
}

// Function to update camera aspect on resize
export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
