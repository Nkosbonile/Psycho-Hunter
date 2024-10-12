import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, moveCamera, onWindowResize } from './camera.js'; // Import camera functions

// Set up the scene
const scene = new THREE.Scene();
const clock = new THREE.Clock();

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Load the textures
const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load('wood.jpeg');
const tileTexture = textureLoader.load('tile.jpeg');
const doorTexture = textureLoader.load('door.jpg');
const windowTexture = textureLoader.load('window.jpg');
const grassTexture = textureLoader.load('grass.jpeg');
const roofTexture = textureLoader.load('oldroof.jpg'); // Roof texture

// Create the materials
const houseMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.5,
    metalness: 0.1,
});
const doorMaterial = new THREE.MeshStandardMaterial({
    map: doorTexture,
});
const windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
});
const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
});
const tileMaterial = new THREE.MeshStandardMaterial({
    map: tileTexture,
});
const roofMaterial = new THREE.MeshStandardMaterial({
    map: roofTexture,
    roughness: 0.6,
    metalness: 0.1,
});

// House dimensions
const houseWidth = 10;
const houseHeight = 4;
const houseDepth = 10;
const wallThickness = 0.1;

// Create the walls of the house (open top)
const wallGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, wallThickness);
const wall1 = new THREE.Mesh(wallGeometry, houseMaterial);
wall1.position.set(0, houseHeight / 2, -houseDepth / 2); // Back wall

const wall2 = new THREE.Mesh(wallGeometry, houseMaterial);
wall2.rotation.y = Math.PI;
wall2.position.set(0, houseHeight / 2, houseDepth / 2); // Front wall

const wall3 = new THREE.Mesh(wallGeometry, houseMaterial);
wall3.rotation.y = Math.PI / 2;
wall3.position.set(-houseWidth / 2, houseHeight / 2, 0); // Left wall

const wall4 = new THREE.Mesh(wallGeometry, houseMaterial);
wall4.rotation.y = -Math.PI / 2;
wall4.position.set(houseWidth / 2, houseHeight / 2, 0); // Right wall

// Add the walls to the scene
scene.add(wall1, wall2, wall3, wall4);

// Create the roof for the house
const roofGeometry = new THREE.ConeGeometry(houseWidth / 1.2, 3.5, 4); // Bigger roof
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(0, houseHeight + 1.75, 0);
roof.rotation.y = Math.PI / 4; // Align with the house
scene.add(roof);

// Create a grass plane around the house
const grassGeometry = new THREE.PlaneGeometry(20, 20);
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.01;
scene.add(grass);

// Create a tile floor inside the house
const tileGeometry = new THREE.PlaneGeometry(houseWidth, houseDepth);
const tile = new THREE.Mesh(tileGeometry, tileMaterial);
tile.rotation.x = -Math.PI / 2;
tile.position.y = 0;
scene.add(tile);

// Create a door
const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(0, 1, houseDepth / 2 + 0.1);
scene.add(door);

// Create windows
const windowWidth = 1.5;
const windowHeight = 1.5;
const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.1);

const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
leftWindow.position.set(-2, windowHeight / 2 + 1.5, houseDepth / 2 + 0.1);
scene.add(leftWindow);

const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
rightWindow.position.set(2, windowHeight / 2 + 1.5, houseDepth / 2 + 0.1);
scene.add(rightWindow);

// Create kitchen items inside the house
// Create a kitchen counter
const counterGeometry = new THREE.BoxGeometry(6, 0.5, 2);
const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const counter = new THREE.Mesh(counterGeometry, counterMaterial);
counter.position.set(0, 0.25, -4); // Position it at the back of the house
scene.add(counter);

// Create kitchen cabinets
const cabinetGeometry = new THREE.BoxGeometry(1.5, 2, 0.5);
const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
const leftCabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
leftCabinet.position.set(-3, 1, -4);
scene.add(leftCabinet);

const rightCabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
rightCabinet.position.set(3, 1, -4);
scene.add(rightCabinet);

// Create a stove
const stoveGeometry = new THREE.BoxGeometry(1, 1, 0.5);
const stoveMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const stove = new THREE.Mesh(stoveGeometry, stoveMaterial);
stove.position.set(0, 0.5, -3);
scene.add(stove);

// Create a fridge
const fridgeGeometry = new THREE.BoxGeometry(1, 2, 0.5);
const fridgeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
fridge.position.set(2.5, 1, -4);
scene.add(fridge);

// Create a sink
const sinkGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
const sinkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B8B83 });
const sink = new THREE.Mesh(sinkGeometry, sinkMaterial);
sink.position.set(-2.5, 0.25, -4);
scene.add(sink);


// Create the table as a cube with a removable top
const tableBaseGeometry = new THREE.BoxGeometry(2, 0.1, 2); // Width, Height, Depth for the base
const tableBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for the base
const tableBase = new THREE.Mesh(tableBaseGeometry, tableBaseMaterial);
tableBase.position.set(0, 0.05, 0); // Position it in the center of the house
scene.add(tableBase);

// Create the table top as a separate cube
const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 2); // Width, Height, Depth for the top
const tableTopMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for the top
const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
tableTop.position.set(0, 0.15, 0); // Position it on top of the base
scene.add(tableTop);


//light
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Control variables

const movementSpeed = 0.2; // Movement speed for the camera
let doorOpen = false; // Track door state

// Create the camera and controls
const { camera, controls } = createCamera(renderer);

// Raycaster and mouse for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Function to handle door interaction
function handleDoorClick() {
  if (!doorOpen) {
      doorOpen = true;
      door.position.z += 0.5; // Open the door

      // Move the camera inside the house
      camera.position.set(0, 1.5, -3);
      camera.lookAt(0, 1.5, -4);

      // Mark that the user has entered the house
      hasEnteredHouse = true;
  }
}

let tableTopRemoved = false; // Track if the table top is removed

// Function to handle table top removal
function handleTableClick() {
    if (!tableTopRemoved) {
        tableTopRemoved = true;
        // Move the table top upwards to simulate removal
        gsap.to(tableTop.position, { y: 0.5, duration: 0.5 }); // Move up to y=0.5
    } else {
        tableTopRemoved = false;
        // Move the table top back down to simulate putting it back on
        gsap.to(tableTop.position, { y: 0.15, duration: 0.5 }); // Move back to y=0.15
    }
}

// Function to detect mouse clicks
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([door, tableBase, tableTop]); // Check for clicks on door and table
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject === door) {
            handleDoorClick();
        } else if (clickedObject === tableBase || clickedObject === tableTop) {
            handleTableClick();
        }
    }
}

window.addEventListener('click', (event) => {
  console.log("Mouse clicked!");
  onMouseClick(event);
});

document.getElementById('moveUp').addEventListener('click', () => {
  moveCamera(camera, 'up', movementSpeed); // Use moveCamera function
});

document.getElementById('moveDown').addEventListener('click', () => {
  moveCamera(camera, 'down', movementSpeed); // Use moveCamera function
});

document.getElementById('moveLeft').addEventListener('click', () => {
  moveCamera(camera, 'left', movementSpeed); // Use moveCamera function
});

document.getElementById('moveRight').addEventListener('click', () => {
  moveCamera(camera, 'right', movementSpeed); // Use moveCamera function
});

// Get the hint message element
let hasEnteredHouse = false;

// Show the custom alert modal
function showCustomAlert(message) {
  const customAlert = document.getElementById('customAlert');
  const customAlertMessage = document.getElementById('customAlertMessage');
  customAlertMessage.textContent = message;
  customAlert.style.display = 'block';
}

// Close the custom alert when the OK button is clicked
document.getElementById('closeAlert').addEventListener('click', () => {
  document.getElementById('customAlert').style.display = 'none';
});

// Riddle hint button logic
document.getElementById('showHint').addEventListener('click', () => {
  if (hasEnteredHouse) {
      const riddleHintMessage = document.getElementById('riddleHintMessage');
      riddleHintMessage.classList.add('show'); // Add class to show the hint message
      setTimeout(() => {
          riddleHintMessage.classList.remove('show'); // Remove class after 10 seconds
      }, 10000);
  } else {
      showCustomAlert("You need to enter the house to get a hint!");
  }
});

function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
}

// Start the render loop
render();

// Update renderer and camera aspect on window resize
window.addEventListener('resize', () => {
  onWindowResize(camera, renderer); // Use onWindowResize function
});