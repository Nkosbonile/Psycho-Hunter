import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let isFirstPerson = false;
let firstPersonYaw = 0;  // Horizontal rotation (yaw)
let firstPersonPitch = 0;  // Vertical rotation (pitch)

let isMouseDown = false;  // Flag to track if mouse button is held down

// Function to create the cameras
export function createCameras(renderer) {
    const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    thirdPersonCamera.position.set(0, 1.5, 4); // Inside the house behind the character
    thirdPersonCamera.lookAt(0, 1.5, 0);

    const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
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

export function updateThirdPersonCamera(camera, character) {
    const cameraOffset = new THREE.Vector3(0, 1.5, 4);  // Offset for third-person camera
    const cameraPosition = cameraOffset.applyMatrix4(character.matrixWorld);  // Apply character's transformation to the offset
    camera.position.lerp(cameraPosition, 0.1);  // Smooth transition to new position
    camera.lookAt(character.position.x, character.position.y + 1.5, character.position.z);  // Keep looking at the character
  }

//   export function updateThirdPersonCamera(camera, character) {
//     const offset = new THREE.Vector3(0, 2, -5);  // Position behind and above the character
//     const characterPosition = character.position.clone();
    
//     // Set the camera position behind the character
//     camera.position.copy(characterPosition).add(offset);
    
//     // Make the camera look at the character
//     camera.lookAt(character.position);
// }


// Function to update first-person camera based on mouse movement
export function updateFirstPersonCamera(camera, character) {
    camera.position.copy(character.position); // Position the camera at the character's position
    camera.position.y += 1.5; // Adjust height to eye level (tweak as necessary)
    
    // Make the camera look in the same direction as the character
    const direction = new THREE.Vector3();
    character.getWorldDirection(direction);
    camera.quaternion.copy(character.quaternion); // Align camera rotation with character's
}

// Function to handle mouse movement for first-person view
function onMouseMove(event) {
    if (isFirstPerson && isMouseDown) {
        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Adjust yaw (horizontal rotation) and pitch (vertical rotation)
        firstPersonYaw -= deltaX * 0.002;  // Adjust sensitivity as needed
        firstPersonPitch -= deltaY * 0.002;

        // Limit pitch to avoid flipping over (looking too far up/down)
        const maxPitch = Math.PI / 2 - 0.1;  // Slightly below 90 degrees
        const minPitch = -Math.PI / 2 + 0.1; // Slightly above -90 degrees
        firstPersonPitch = Math.max(minPitch, Math.min(maxPitch, firstPersonPitch));
    }
}

// Function to handle mouse button press
function onMouseDown(event) {
    isMouseDown = true;
}

// Function to handle mouse button release
function onMouseUp(event) {
    isMouseDown = false;
}

// Function to handle window resize
export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add event listeners for mouse movements and button press/release
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
