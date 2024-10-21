import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  createCameras,
  switchCamera,
  updateThirdPersonCamera,
  onWindowResize,
  updateFirstPersonCamera,
} from "./camera.js";
import { createCharacter, moveCharacter } from "./character.js";
import { showHint, updateHintPosition, resetHint } from "./hintSystem.js";

let scene,
  renderer,
  keys = {},
  mixer,
  walkAction,
  idleAction,
  activeAction,
  character;
let thirdPersonCamera, firstPersonCamera, currentCamera, controls;
let isFirstPerson = false;
let houseGroundLevel = 0; // Ground level of the house
const walls = [];
let houseUpperFloorLevel = 0;

let currentClueIndex = 0;
let timeLeft = 600;
let timerId;
let fog;

// Initialize the scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001829);

  // Add fog to the scene
  fog = new THREE.FogExp2(0x001829, 0.05);
  scene.fog = fog;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create the cameras
  const cameras = createCameras(renderer);
  thirdPersonCamera = cameras.thirdPersonCamera;
  firstPersonCamera = cameras.firstPersonCamera;
  controls = cameras.controls;

  currentCamera = thirdPersonCamera; // Start with third-person camera
  window.addEventListener("resize", () =>
    onWindowResize(currentCamera, renderer)
  );

  // Add basic lighting
  const ambientLight = new THREE.AmbientLight(0x152238, 0.2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Add multiple point lights for dramatic lighting
  const pointLight1 = new THREE.PointLight(0xff6b6b, 1, 10);
  pointLight1.position.set(4, houseGroundLevel + 6, 0);
  pointLight1.castShadow = true;
  scene.add(pointLight1);

  // Add flickering light near the blood splatter
  const flickeringLight = new THREE.PointLight(0xff0000, 1, 8);
  flickeringLight.position.set(4, houseGroundLevel + 5, 0);
  scene.add(flickeringLight);

  // Add moonlight effect
  const moonLight = new THREE.DirectionalLight(0x4d5c82, 0.3);
  moonLight.position.set(-5, 10, -7.5);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // Configure shadow properties
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 50;

  // Load the house model
  const loader = new GLTFLoader();
  loader.load("./assets/models/house/scene.gltf", (gltf) => {
    const house = gltf.scene;
    house.scale.set(0.2, 0.2, 0.2);

    // Calculate the house's ground level using bounding box
    const houseBox = new THREE.Box3().setFromObject(house);
    houseGroundLevel = houseBox.min.y; // Save ground level for later use
    houseUpperFloorLevel = houseGroundLevel + 4;

    // Traverse through the house model and log texture info
    house.traverse((node) => {
      if (node.isMesh) {
        const material = node.material;

        const box = new THREE.Box3().setFromObject(node);
        walls.push(box);

        // Apply the diffuse texture manually if it's not applied automatically
        if (material.map === null && material.userData.diffuseTexture) {
          const texture = textureLoader.load(
            `./assets/models/house/${material.userData.diffuseTexture}`
          );
          material.map = texture;
          material.needsUpdate = true;
        }
      }
    });

    scene.add(house);

    // Load the character model
    loader.load("./assets/models/iwi_male_character_02/scene.gltf", (gltf) => {
      character = createCharacter(gltf);
      scene.add(character);
      character.scale.set(0.5, 0.5, 0.5);

      character.position.set(5, houseGroundLevel + 4.7, 6);
      character.rotation.y = Math.PI;

      // Set up animations
      mixer = new THREE.AnimationMixer(character);
      const animations = gltf.animations;
      walkAction = mixer.clipAction(
        THREE.AnimationClip.findByName(animations, "Rig|walk")
      );
      idleAction = mixer.clipAction(
        THREE.AnimationClip.findByName(animations, "Rig|idle")
      );

      // Set idle as the default active action
      activeAction = idleAction;
      idleAction.play();

      // Start animation loop
      animate();
    });

    // Load the dead body model and position it
    loader.load("./assets/models/dead_body/scene.gltf", function (gltf) {
      const deadBody = gltf.scene;
      deadBody.scale.set(0.5, 0.5, 0.5); // Adjust size
      deadBody.position.set(-6, houseGroundLevel + 4.5, -5); // Set the dead body at the same ground level as the house
      scene.add(deadBody);
    });

    // Load and position the blood splatter model
    loader.load("./assets/models/blood_spattered/scene.gltf", (gltf) => {
      const bloodSplatter = gltf.scene;
      bloodSplatter.scale.set(0.05, 0.05, 0.05); // Adjust the scale as needed
      bloodSplatter.position.set(4, houseGroundLevel + 4.5, 0); // Position it in the scene
      scene.add(bloodSplatter);

      // Start animation loop
      animate();
    });

    // Load and position weapon
    loader.load(
      "./assets/models/nail_bat_--_nailed_nightmare/scene.gltf",
      (gltf) => {
        const weapon = gltf.scene;
        weapon.scale.set(0.7, 0.7, 0.7);
        weapon.position.set(8.5, houseGroundLevel + 4.45, -6.5);
        scene.add(weapon);
      }
    );

    // Load and position weapon
    loader.load(
      "./assets/models/used_canguro_shoes_____free/scene.gltf",
      (gltf) => {
        const shoe = gltf.scene;
        shoe.scale.set(0.02, 0.02, 0.02);
        shoe.position.set(-3.5, houseGroundLevel + 4.59, -5.7);
        scene.add(shoe);
      }
    );
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const isMoving = keys["w"] || keys["a"] || keys["s"] || keys["d"];

  // Switch between animations
  if (isMoving && activeAction !== walkAction) {
    switchAnimation(walkAction);
  } else if (!isMoving && activeAction !== idleAction) {
    switchAnimation(idleAction);
  }

  // Move the character
  moveCharacter(
    currentCamera,
    keys,
    character,
    isFirstPerson,
    houseGroundLevel,
    houseUpperFloorLevel
  );

  // Update the camera based on the mode
  if (isFirstPerson) {
    updateFirstPersonCamera(firstPersonCamera, character); // Update first-person camera
  } else {
    updateThirdPersonCamera(thirdPersonCamera, character); // Update third-person camera
  }

  if (mixer) mixer.update(0.016); // Update animations

  // Check if the player is close to the blood splatter
  const bloodSplatterPosition = new THREE.Vector3(4, houseGroundLevel + 4.5, 0); // Position of the blood splatter
  const distanceToBloodSplatter = character.position.distanceTo(
    bloodSplatterPosition
  );
  const showHintThreshold = 2; // Adjust the distance threshold as needed

  if (distanceToBloodSplatter < showHintThreshold) {
    showHint(
      scene,
      currentCamera,
      "This blood splatter is a clue. Where could the body be?"
    );
  }

  // Update hint position to always face the camera
  updateHintPosition(currentCamera);

  renderer.render(scene, currentCamera); // Render the scene from the active camera
}
/// Function to show the popup when the player fails to find the body (time's up)
function showFailPopup() {
  document.getElementById("gameOverPopupFail").style.display = "flex";
  disableGameControls(); // Disable controls when showing the fail popup
}

// Function to show the popup when the player finds the body
function showSuccessPopup() {
  document.getElementById("gameOverPopupSuccess").style.display = "flex";
  disableGameControls(); // Disable controls when showing the success popup
}

let isCorrectBody = false; // This variable will track whether the body is correct or not

function startTimer() {
  const timerDisplay = document.getElementById("timer");

  timerId = setInterval(() => {
    // Calculate minutes and seconds
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Format the time as MM:SS
    const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    timerDisplay.innerText = `Time Left: ${formattedTime}`;

    // Decrement the time left
    timeLeft--;

    // Check if the time has run out
    if (timeLeft < 0) {
      clearInterval(timerId);
      timerDisplay.innerText = "Time's Up!";
      showFailPopup(); // Show fail popup when time's up
      // You can also disable the game controls here
    }
  }, 1000); // Update every second
}

// Switch between animations
function switchAnimation(newAction) {
  activeAction.fadeOut(0.5); // Smooth transition
  newAction.reset().fadeIn(0.5).play(); // Fade into the new action
  activeAction = newAction; // Update the current action
}

// function showHint() {
//     // Create a new DOM element to display the hint/riddle
//     const hintElement = document.createElement('div');
//     hintElement.classList.add('hint');
//     hintElement.textContent = 'This blood splatter is a clue. Where could the body be?';

//     // Append the hint element to the page
//     document.body.appendChild(hintElement);

//     // Add a timer to remove the hint after a few seconds
//     setTimeout(() => {
//       document.body.removeChild(hintElement);
//     }, 5000); // Remove the hint after 5 seconds
//   }

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "v") {
    isFirstPerson = !isFirstPerson; // Toggle between first-person and third-person
    currentCamera = isFirstPerson ? firstPersonCamera : thirdPersonCamera; // Switch the camera
    console.log(
      `Switched to ${isFirstPerson ? "First-Person" : "Third-Person"} Camera`
    );
  }

  keys[key] = true; // Set the key as pressed
  console.log("Key Down:", key); // Log pressed key
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false; // Set the key as released
  console.log("Key Up:", event.key.toLowerCase()); // Log released key
});

// Start the application
init();
startTimer();
