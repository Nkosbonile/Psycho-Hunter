import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let isFirstPerson = false;
let yawRotation = 0;  // Horizontal rotation
let pitchRotation = 0;  // Vertical rotation
let isTransitioning = false;
let transitionStartTime = 0;
const TRANSITION_DURATION = 500; // ms
let transitionStartPos = new THREE.Vector3();
let transitionEndPos = new THREE.Vector3();

//let isMouseDown = false;  // Flag to track if mouse button is held down

// Function to create the cameras
export function createCameras(renderer) {
    const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    thirdPersonCamera.position.set(0, 0.8, 5); // Position it behind the character
    thirdPersonCamera.lookAt(0, 0.5, 0);

    const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    firstPersonCamera.position.set(0, 1.5, 0); // First-person view from head height

    const controls = new OrbitControls(thirdPersonCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;

    // Setup pointer lock
    renderer.domElement.addEventListener('click', () => {
        if (isFirstPerson && !document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        }
    });


    return { thirdPersonCamera, firstPersonCamera, controls };
}
// Function to switch between first-person and third-person views
export function switchCamera(thirdPersonCamera, firstPersonCamera, character) {
    if (isTransitioning) return isFirstPerson ? firstPersonCamera : thirdPersonCamera;

    isTransitioning = true;
    transitionStartTime = Date.now();
    const currentCamera = isFirstPerson ? firstPersonCamera : thirdPersonCamera;
    transitionStartPos.copy(currentCamera.position);

    // Calculate end position
    if (isFirstPerson) {
        // Switching to third person
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion);
        transitionEndPos.copy(character.position)
            .add(direction.multiplyScalar(-2))
            .add(new THREE.Vector3(0, 0.9, 0));
    } else {
        // Switching to first person
        transitionEndPos.copy(character.position).add(new THREE.Vector3(0, 1.5, 0));
    }

    isFirstPerson = !isFirstPerson;
    return isFirstPerson ? firstPersonCamera : thirdPersonCamera;
}


export function updateThirdPersonCamera(camera, character) {
    if (isTransitioning) {
        const elapsed = Date.now() - transitionStartTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
        
        // Smooth cubic easing
        const t = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(transitionStartPos, transitionEndPos, t);
        
        if (progress >= 1) {
            isTransitioning = false;
        }
    } else {
        const offset = new THREE.Vector3(0, 1.5, -2);
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion);
        const cameraPosition = character.position.clone().add(direction.multiplyScalar(-2));
        camera.position.lerp(new THREE.Vector3(cameraPosition.x, character.position.y + 0.9, cameraPosition.z), 0.1);
    }
    
    camera.lookAt(character.position.x, character.position.y + 1.5, character.position.z);
}


// Function to update first-person camera based on mouse movement
export function updateFirstPersonCamera(camera, character) {
    if (isTransitioning) {
        const elapsed = Date.now() - transitionStartTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
        
        const t = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(transitionStartPos, transitionEndPos, t);
        
        if (progress >= 1) {
            isTransitioning = false;
        }
    } else {
        camera.position.copy(character.position);
        camera.position.y += 1.5;
    }

    // Apply rotations
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRotation;
    camera.rotation.x = pitchRotation;
}


// Function to handle mouse movement for first-person view
function onMouseMove(event) {
    if (isFirstPerson && document.pointerLockElement) {
        const sensitivity = 0.002;
        yawRotation -= event.movementX * sensitivity;
        pitchRotation -= event.movementY * sensitivity;
        
        // Clamp vertical rotation to prevent over-rotation
        pitchRotation = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitchRotation));
    }
}

// Handle pointer lock changes
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement && isFirstPerson) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
