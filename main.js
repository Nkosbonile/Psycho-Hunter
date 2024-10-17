import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a2a); // Dark blue for night
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 5, 15); // Adjusted camera position
camera.lookAt(0, 0, 0); // Looking at the center of the scene

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.update();

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshPhongMaterial({
  color: 0x333333, // Darker ground for night
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(groundMesh);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(5, 10, 5);
scene.add(sunLight);

// Candle lights inside the house
const candleLight1 = new THREE.PointLight(0xffcc99, 0.8, 5, 2); // Warm light
candleLight1.position.set(2, 2, -3); // Adjust position inside the house
scene.add(candleLight1);

const candleLight2 = new THREE.PointLight(0xffcc99, 0.8, 5, 2); // Warm light
candleLight2.position.set(-2, 2, -3); // Adjust position inside the house
scene.add(candleLight2);

// Load Model (House)
let house;
let houseBoundingBox;
let doorPosition = new THREE.Vector3(0, 0, 2); // Approximate door position
let insideHouse = false;
let promptVisible = false;

const loader = new GLTFLoader().setPath("models/");
loader.load(
  "scene.gltf",
  (gltf) => {
    house = gltf.scene;
    house.position.set(0, 0, 0);
    house.scale.set(0.3, 0.2, 0.2);
    scene.add(house);

    // Create bounding box for the house
    houseBoundingBox = new THREE.Box3().setFromObject(house);
    console.log("House model loaded:", houseBoundingBox);
  },
  undefined,
  (error) => {
    console.error("An error occurred while loading the model:", error);
  }
);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create the "Enter the House" prompt (HTML button)
const enterPrompt = document.createElement("button");
enterPrompt.textContent = "Enter the house";
enterPrompt.style.position = "absolute";
enterPrompt.style.top = "50%";
enterPrompt.style.left = "50%";
enterPrompt.style.transform = "translate(-50%, -50%)";
enterPrompt.style.display = "none"; // Hidden initially
document.body.appendChild(enterPrompt);

// Variables for keyboard control
const moveSpeed = 0.1;
const keysPressed = {};

// Handle keyboard events
document.addEventListener("keydown", (event) => {
  keysPressed[event.code] = true;
});
document.addEventListener("keyup", (event) => {
  keysPressed[event.code] = false;
});

// Move camera based on keyboard inputs (works inside and outside the house)
function updateCameraPosition() {
  if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) {
    camera.position.z -= moveSpeed;
  }
  if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) {
    camera.position.z += moveSpeed;
  }
  if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
    camera.position.x -= moveSpeed;
  }
  if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
    camera.position.x += moveSpeed;
  }

  controls.update();
}

// Function to adjust camera when inside the house
function teleportCameraInside() {
  // Update camera position inside the house
  camera.position.set(0, 2, -3); // Adjust the camera position to be inside the house
  camera.lookAt(new THREE.Vector3(0, 1, 0)); // Camera looks at a point inside the house

  insideHouse = true; // Mark that we are inside the house
}

// Event listener for entering the house when the button is clicked
enterPrompt.addEventListener("click", () => {
  enterPrompt.style.display = "none"; // Hide the prompt after clicking
  teleportCameraInside(); // Move the camera inside the house
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  updateCameraPosition();
  renderer.render(scene, camera);
}

// Start Animation
animate();
