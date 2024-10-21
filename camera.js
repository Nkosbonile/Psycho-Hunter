import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let isFirstPerson = false;
let firstPersonYaw = 0;  // Horizontal rotation (yaw)
let firstPersonPitch = 0;  // Vertical rotation (pitch)

let isMouseDown = false;  // Flag to track if mouse button is held down

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

    return { thirdPersonCamera, firstPersonCamera, controls };
}
// Function to switch between first-person and third-person views
export function switchCamera(thirdPersonCamera, firstPersonCamera) {
    isFirstPerson = !isFirstPerson; // Toggle between views
    return isFirstPerson ? firstPersonCamera : thirdPersonCamera;
}


export function updateThirdPersonCamera(camera, character) {
    const offset = new THREE.Vector3(0, 1.5, -2);  // Position behind the character (negative Z means behind)
    
    // Create a direction vector based on the character's current rotation
    const direction = new THREE.Vector3(0, 0, 1);  // The direction vector representing the forward direction
    direction.applyQuaternion(character.quaternion);  // Apply the character's current rotation to the direction vector

    // Calculate the camera position behind the character by adding the offset to the character's position
    const cameraPosition = character.position.clone().add(direction.multiplyScalar(-2)); // Adjust distance behind character
    
    // Set camera's new position and height
    camera.position.lerp(new THREE.Vector3(cameraPosition.x, character.position.y + 0.9, cameraPosition.z), 0.1);
    
    // Make the camera look at the character
    camera.lookAt(character.position.x, character.position.y + 1.5, character.position.z);
}


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
