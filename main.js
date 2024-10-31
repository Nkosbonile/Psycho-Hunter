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
let timeLeft = 2000;
let timerId;
let fog;
let bloodSplatter, weapon, shoe, deadBody;

let cluesSolved = 0;
let weaponClueEnabled = false;
let shoeClueEnabled = false;

let characterLight; // Declare a variable for the character's light

// Initialize the scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001829);

  // Add fog to the scene
  fog = new THREE.FogExp2(0x001829, 0.4);
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
    loader.load("./assets/models/dead_body/scene.gltf", (gltf) => {
      deadBody = gltf.scene;
      deadBody.scale.set(0.5, 0.5, 0.5); // Adjust size
      deadBody.position.set(-6, houseGroundLevel + 4.5, -5); // Set the dead body at the same ground level as the house
      scene.add(deadBody);
      deadBody.visible = false; // Initially hide the dead body
    });

    // Load and position the blood splatter model
    loader.load("./assets/models/blood_spattered/scene.gltf", (gltf) => {
      bloodSplatter = gltf.scene;
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
        weapon = gltf.scene;
        weapon.scale.set(0.7, 0.7, 0.7);
        weapon.position.set(8.4, houseGroundLevel + 4.5, -5.5);
        scene.add(weapon);
        weapon.visible = false;
      }
    );

    // Load and position weapon
    loader.load(
      "./assets/models/used_canguro_shoes_____free/scene.gltf",
      (gltf) => {
        shoe = gltf.scene;
        shoe.scale.set(0.02, 0.02, 0.02);
        shoe.position.set(-3.5, houseGroundLevel + 4.59, -5.7);
        scene.add(shoe);
        shoe.visible = false;
      }
    );
  });
}

// Create audio objects
const clueSound = new Audio("alarm.ogg");
const backgroundMusic = new Audio("Dark Intro.ogg");
const successSound = new Audio("audio/success.mp3");
const failSound = new Audio("audio/fail.mp3");

// Start background music
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Adjust as needed
backgroundMusic.play();

function createControlButtons() {
  const controlDiv = document.createElement("div");
  controlDiv.className = "controls";

  const upButton = createButton("W", "up");
  const leftButton = createButton("A", "left");
  const downButton = createButton("S", "down");
  const rightButton = createButton("D", "right");

  controlDiv.appendChild(upButton);
  controlDiv.appendChild(leftButton);
  controlDiv.appendChild(downButton);
  controlDiv.appendChild(rightButton);

  document.body.appendChild(controlDiv);

  // Event listeners for control buttons
  upButton.addEventListener("mousedown", () => {
    keys["w"] = true;
  });
  upButton.addEventListener("mouseup", () => {
    keys["w"] = false;
  });

  leftButton.addEventListener("mousedown", () => {
    keys["a"] = true;
  });
  leftButton.addEventListener("mouseup", () => {
    keys["a"] = false;
  });

  downButton.addEventListener("mousedown", () => {
    keys["s"] = true;
  });
  downButton.addEventListener("mouseup", () => {
    keys["s"] = false;
  });

  rightButton.addEventListener("mousedown", () => {
    keys["d"] = true;
  });
  rightButton.addEventListener("mouseup", () => {
    keys["d"] = false;
  });
}
function createButton(label, id) {
  const button = document.createElement("button");
  button.id = id;
  button.textContent = label;
  button.style.width = "50px";
  button.style.height = "50px";
  button.style.margin = "5px";
  button.style.fontSize = "20px";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.backgroundColor = "#621a1a";
  button.style.color = "white";
  button.style.cursor = "pointer";

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#971f1f;"; // Darker green on hover
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#621a1a"; // Reset to original color
  });

  return button;
}

function loadDeadBody() {
  if (deadBody) {
    deadBody.visible = true; // Make the dead body visible when all clues are solved
    console.log("Dead body revealed.");
    showHint(
      "I once breathed air, now none to spare. Find me, and your search will end where I lay bare."
    ); // Optional: show a hint when the dead body is revealed
  } else {
    console.error("Dead body model is not loaded yet.");
  }
}

function solveClue() {
  cluesSolved++;
  if (cluesSolved === 1) {
    weapon.visible = true; // Show weapon after solving first clue
    console.log("Blood splatter clue solved.");
  } else if (cluesSolved === 2) {
    shoe.visible = true; // Show shoe after solving second clue
    console.log("Weapon clue solved.");
  } else if (cluesSolved === 3) {
    // Show the dead body after solving all clues
    loadDeadBody();
  }
}

const glowThreshold = 1.5; // Distance threshold for glow effect

document.getElementById("clueButton").addEventListener("click", () => {
  if (isNearClue(bloodSplatter)) {
    console.log("Near blood splatter");
    showHint(
      "I appear red, not from a brush, but from a moment of rush. Find me, and a weapon you'll soon see."
    );
    clueSound.play();
    solveClue();
  } else if (isNearClue(weapon)) {
    console.log("Near weapon");
    showHint(
      "I strike with might, unseen by the night. Solve me, and a shoe will point you right."
    );
    clueSound.play();
    solveClue();
  } else if (isNearClue(shoe)) {
    console.log("Near shoe");
    showHint(
      "I walk and run, but now I lay, pointing the way. Find me, and the body will no longer be astray."
    );
    clueSound.play();
    solveClue();
  } else if (isNearClue(deadBody)) {
    console.log("Near dead body");
    showHint(
      "I once breathed air, now none to spare. Find me, and your search will end where I lay bare."
    );
    successSound.play();
    solveClue();
  }
});

function hideHintMessage() {
  const hintMessageDiv = document.getElementById("hintMessage");
  hintMessageDiv.style.display = "none"; // Hide the message
}

function applyGlowEffect(object, threshold) {
  const distance = object.position.distanceTo(character.position);
  console.log("Distance to object:", distance); // Log distance for debugging

  if (distance < threshold) {
    console.log("Player is near object. Showing hint button.");

    // Show the button
    const clueButton = document.getElementById("clueButton");
    clueButton.style.display = "block"; // Make the button visible
    clueButton.classList.add("glow"); // Apply glow effect
  } else {
    console.log("Player is far from object. Hiding hint button.");

    // Hide the button
    const clueButton = document.getElementById("clueButton");
    clueButton.style.display = "none"; // Hide the button
    clueButton.classList.remove("glow"); // Remove glow effect
  }
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, currentCamera); // Use currentCamera here

  // Check interaction with blood splatter
  const bloodIntersect = raycaster.intersectObject(bloodSplatter, true);
  if (bloodIntersect.length > 0) {
    console.log("Clicked on blood splatter!");
  }

  // Check interaction with weapon
  const weaponIntersect = raycaster.intersectObject(weapon, true);
  if (weaponIntersect.length > 0) {
    console.log("Clicked on weapon!");
  }

  // Check interaction with shoe
  const shoeIntersect = raycaster.intersectObject(shoe, true);
  if (shoeIntersect.length > 0) {
    console.log("Clicked on shoe!");
  }
});

// Function to check if the player is near a clue
function isNearClue(clue) {
  if (!clue) return false;
  const distance = clue.position.distanceTo(character.position);
  return distance < glowThreshold;
}

let gameEnded = false; // Track if the game has ended

// Function to check if the player is near the dead body and end the game
function checkIfNearDeadBody() {
  if (isNearClue(deadBody)) {
    // Check if player is near the dead body
    console.log("Player found the dead body!");
    endGame(true); // End game with success when near the dead body
  }
}

function endGame(success) {
  if (gameEnded) return; // If the game has already ended, do nothing

  clearInterval(timerId); // Stop the timer
  disableGameControls(); // Disable controls

  if (success) {
    showSuccessPopup(); // Show success popup
  } else {
    showFailPopup(); // Show failure popup if time runs out
  }

  gameEnded = true; // Mark the game as ended
}
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

  // Check if the player is near active clues and apply glow effects
  if (cluesSolved === 0 && bloodSplatter) {
    // Apply glow effect to the blood splatter
    applyGlowEffect(bloodSplatter, glowThreshold);
  } else if (cluesSolved === 1 && weapon) {
    // Apply glow effect to the weapon
    applyGlowEffect(weapon, glowThreshold);
  } else if (cluesSolved === 2 && shoe) {
    // Apply glow effect to the shoe
    applyGlowEffect(shoe, glowThreshold);
  }

  // Update hint position to always face the camera
  updateHintPosition(currentCamera);

  renderer.render(scene, currentCamera); // Render the scene from the active camera
}
function gameOver() {
  backgroundMusic.pause();
  failSound.play();
}

function showSuccessPopup() {
  document.getElementById("gameOverPopupSuccess").style.display = "flex";
}

// Function to show failure popup
function showFailPopup() {
  document.getElementById("gameOverPopupFail").style.display = "flex";
}

function handleKeyDown(event) {
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
}

// Handle key up event
function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  keys[key] = false; // Set the key as released
  console.log("Key Up:", key); // Log released key
}

// Handle click event
function handleClick(event) {
  const clue = detectClue(); // Assume you have a detectClue function to detect if a clue is clicked
  if (clue) {
    solveClue(clue);
  }
}

function disableGameControls() {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  document.removeEventListener("click", handleClick);
}

// Add event listeners for controls
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
document.addEventListener("click", handleClick);
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

    // Check if time has run out
    if (timeLeft < 0) {
      clearInterval(timerId);
      timerDisplay.innerText = "Time's Up!";
      endGame(false); // End the game with failure when time runs out
    }

    // Continuously check if the player is near the dead body
    if (!gameEnded) checkIfNearDeadBody();
  }, 1000); // Update every second
}
// Switch between animations
function switchAnimation(newAction) {
  activeAction.fadeOut(0.5); // Smooth transition
  newAction.reset().fadeIn(0.5).play(); // Fade into the new action
  activeAction = newAction; // Update the current action
}

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

document.getElementById("failRestartButton").addEventListener("click", () => {
  location.reload(); // Reload the game (or handle the restart logic as needed)
});

document.getElementById("nextLevelButton").addEventListener("click", () => {
  window.location.href = "_intro.html"; // Reload the game (or handle the restart logic as needed)
});

document
  .getElementById("successRestartButton")
  .addEventListener("click", () => {
    location.reload(); // Reload the game (or handle the restart logic as needed)
  });

// Initialize the game
// Start the application
init();
startTimer();
createControlButtons();
