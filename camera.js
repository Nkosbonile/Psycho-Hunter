import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let isFirstPerson = false;
let firstPersonYaw = 0;  // Horizontal rotation (yaw)
let firstPersonPitch = 0;  // Vertical rotation (pitch)

let isMouseDown = false;  // Flag to track if mouse button is held down

// Function to create the cameras
export function createCameras(renderer) {
    const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    thirdPersonCamera.position.set(0, 1.5, 10); // Position it behind the character
    thirdPersonCamera.lookAt(0, 1.5, 0);

    const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    firstPersonCamera.position.set(0, 1.5, 0); // First-person view from head height

    const controls = new OrbitControls(thirdPersonCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;

    return { thirdPersonCamera, firstPersonCamera, controls };
}

// Function to switch between first-person and third-person views
export function switchCamera(thirdPersonCamera, firstPersonCamera) {
    isFirstPerson = !isFirstPerson; // Toggle between views
    return isFirstPerson ? firstPersonCamera : thirdPersonCamera;
}

// Function to update first-person camera based on mouse movement
export function updateFirstPersonCamera(camera, characterPosition) {
    // Keep the camera at the character's head level
    camera.position.set(characterPosition.x, characterPosition.y + 1.5, characterPosition.z);

    // Apply mouse-based yaw and pitch
    camera.rotation.set(firstPersonPitch, firstPersonYaw, 0);  // Ensure roll (z-axis) is always 0 to prevent tilting
}

// Function to handle mouse movement for first-person view
function onMouseMove(event) {
    if (isFirstPerson && isMouseDown) {
        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || 0;

        // Adjust yaw (horizontal rotation) and pitch (vertical rotation)
        firstPersonYaw -= deltaX * 0.002;  // Adjust sensitivity as needed
        firstPersonPitch -= deltaY * 0.002;

        // Limit pitch to avoid flipping over (looking too far up/down)
        const maxPitch = Math.PI / 2 - 0.1;  // Slightly below 90 degrees
        const minPitch = -Math.PI / 2 + 0.1; // Slightly above -90 degrees
        firstPersonPitch = Math.max(minPitch, Math.min(maxPitch, firstPersonPitch));
    }
}

// Mouse event listeners for first-person camera
document.addEventListener('mousedown', () => {
    if (isFirstPerson) isMouseDown = true;
});
document.addEventListener('mouseup', () => {
    isMouseDown = false;
});
document.addEventListener('mousemove', onMouseMove);

export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
