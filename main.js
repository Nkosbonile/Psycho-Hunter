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
let timeLeft = 160;
let timerId;
let fog;
let bloodSplatter, weapon, shoe, deadBody;
let pickUpAction; // Declare the pick-up action

let cluesSolved = 0;
let weaponClueEnabled = false;
let shoeClueEnabled = false;

let flashlightModel, flashlightLight, flashlightTarget;
let isFlashlightOn = false;
let isFlashlightPickedUp = false;
let canPickUpFlashlight = false;

// Function to create and load the flashlight model
function createFlashlight() {
  // Create a simple flashlight geometry
  const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.015, 0.4, 5);
  const headGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 5);
  const lensGeometry = new THREE.CircleGeometry(0.02, 5);

  // Create materials
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Dark grey
  const headMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 }); // Light grey
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0,
  });

  // Create mesh parts
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  const head = new THREE.Mesh(headGeometry, headMaterial);
  const lens = new THREE.Mesh(lensGeometry, lensMaterial);

  // Position the parts
  head.position.y = 0.25;
  lens.position.y = 0.3;
  lens.rotation.x = -Math.PI / 2;

  // Create a group for the flashlight
  flashlightModel = new THREE.Group();
  flashlightModel.add(body);
  flashlightModel.add(head);
  flashlightModel.add(lens);

  // Create the spotlight for the flashlight
  flashlightLight = new THREE.SpotLight(0xffcc00, 1, 10, Math.PI / 4, 0.1);
  flashlightLight.position.set(0, 0.3, 0); 
  flashlightLight.angle = Math.PI / 6;
  flashlightLight.penumbra = 0.2; 
  flashlightLight.decay = 2; 
  flashlightLight.castShadow = true;

  // Create and add the target for the spotlight
  flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, 0, -1); 
  flashlightModel.add(flashlightTarget);
  flashlightLight.target = flashlightTarget;

  // Add the light to the flashlight model
  flashlightModel.add(flashlightLight);

  // Position flashlight on the floor
  flashlightModel.position.set(5, houseGroundLevel + 4.5, 6);
  flashlightModel.rotation.z = -Math.PI / 2;

  // Initially hide the light (can be made visible when picked up)
  flashlightLight.visible = false;

  // Add the flashlight to the scene
  scene.add(flashlightModel);

  // Add glow effect to make it more noticeable
  addFlashlightGlow();
}

// Add a subtle glow effect to make the flashlight noticeable
function addFlashlightGlow() {
  const glowSize = 0.01;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    transparent: true,
    opacity: 0.5, 
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 0.3, 0); // Position it near the head

  flashlightModel.add(glow);

  // Animate the glow
  const glowAnimation = () => {
    if (!isFlashlightPickedUp) {
      glow.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.1; // Pulsating effect
    }
    requestAnimationFrame(glowAnimation);
  };
  glowAnimation();
}

// Function to check if player is near flashlight
function checkFlashlightProximity() {
  if (!character || !flashlightModel || isFlashlightPickedUp) return;

  const distance = character.position.distanceTo(flashlightModel.position);
  const proximityThreshold = 0.5;

  if (distance < proximityThreshold) {
    if (!canPickUpFlashlight) {
      canPickUpFlashlight = true;
      showPickupPrompt();
    }
  } else {
    if (canPickUpFlashlight) {
      canPickUpFlashlight = false;
      hidePickupPrompt();
    }
  }
}

// Function to show pickup prompt
function showPickupPrompt() {
  const prompt =
    document.getElementById("pickupPrompt") || createPickupPrompt();
  prompt.style.display = "block";
}

// Function to hide pickup prompt
function hidePickupPrompt() {
  const prompt = document.getElementById("pickupPrompt");
  if (prompt) {
    prompt.style.display = "none";
  }
}

// Create pickup prompt element
function createPickupPrompt() {
  const prompt = document.createElement("div");
  prompt.id = "pickupPrompt";
  prompt.innerHTML = "Press E to pick up flashlight";
  prompt.style.position = "fixed";
  prompt.style.top = "50%";
  prompt.style.left = "50%";
  prompt.style.transform = "translate(-50%, -50%)";
  prompt.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  prompt.style.color = "white";
  prompt.style.padding = "10px";
  prompt.style.borderRadius = "5px";
  prompt.style.display = "none";
  document.body.appendChild(prompt);
  return prompt;
}

// Function to pick up flashlight
function pickupFlashlight() {
  if (!canPickUpFlashlight || isFlashlightPickedUp) return;

  isFlashlightPickedUp = true;
  hidePickupPrompt();

  // Play pickup animation if available
  if (pickUpAction) {
    pickUpAction.reset().fadeIn(0.2).play();
    setTimeout(() => {
      pickUpAction.fadeOut(0.2);
      idleAction.fadeIn(0.2);
    }, 1000);
  }
}

// Function to update flashlight position when picked up
function updateFlashlight() {
  if (!character || !flashlightModel) return;

  if (isFlashlightPickedUp) {
    // Get character's world position and direction
    const characterPosition = new THREE.Vector3();
    character.getWorldPosition(characterPosition);
    const characterDirection = new THREE.Vector3();
    character.getWorldDirection(characterDirection);

    // Position the flashlight relative to the character (as if being held)
    const offsetRight = new THREE.Vector3(-0.12, 0, 0);
    const offsetUp = new THREE.Vector3(0, 0.4, 0);
    const offsetForward = new THREE.Vector3(0, 0, 0);

    // Apply character's rotation to the offset
    offsetRight.applyQuaternion(character.quaternion);
    offsetForward.applyQuaternion(character.quaternion);

    // Calculate final flashlight position
    const flashlightPosition = characterPosition
      .clone()
      .add(offsetRight)
      .add(offsetUp)
      .add(offsetForward);

    // Update flashlight position and rotation
    flashlightModel.position.copy(flashlightPosition);
    flashlightModel.rotation.copy(character.rotation);
    flashlightModel.rotateX(Math.PI/2 ); // Angle the flashlight slightly upward

    // Update the light target position
    const targetDistance = 5;
    const targetPosition = flashlightPosition
      .clone()
      .add(characterDirection.multiplyScalar(targetDistance));
    flashlightTarget.position.copy(targetPosition);
  }
}

// Function to toggle flashlight
function toggleFlashlight() {
  if (!isFlashlightPickedUp) return;

  isFlashlightOn = !isFlashlightOn;

  // Toggle the spotlight
  flashlightLight.visible = isFlashlightOn;

  // Update lens material emission
  const lensMaterial = flashlightModel.children[2].material;
  lensMaterial.emissiveIntensity = isFlashlightOn ? 0.5 : 0;

  // Adjust fog density
 scene.fog.density = isFlashlightOn ? 0.2 : 0.4;
}

// Initialize the scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001829);

  // Add fog to the scene
  fog = new THREE.FogExp2(0x001829, 0.4);
  scene.fog = fog;
  createFlashlight();

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
 
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  

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

      pickUpAction = mixer.clipAction(
        THREE.AnimationClip.findByName(animations, "Rig|pickUp")
      );
      // Set idle as the default active action
      activeAction = idleAction;
      idleAction.play();

      // Create the flashlight next to the character after loading
      createFlashlight(character.position);

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

// Define sets of hints for different game restarts
const HINT_SETS = [
  // Set 1
  {
    bloodSplatter:
      "I appear red, not from a brush, but from a moment of rush. Find me, and a weapon you'll soon see.",
    weapon:
      "I strike with might, unseen by the night. Solve me, and a shoe will point you right.",
    shoe: "I walk and run, but now I lay, pointing the way. Find me, and the body will no longer be astray.",
  },
  // Set 2
  {
    bloodSplatter:
      "Crimson traces tell a tale, of violence that did not fail. Follow my trail, and find what caused my stain.",
    weapon:
      "Steel and shadows intertwine, I was the tool of dark design. Near me lies a lost sole's sign.",
    shoe: "A lonely wanderer's last stride, in dusty corners I reside. Follow where I point, and death's secret you'll find.",
  },
  // Set 3
  {
    bloodSplatter:
      "Where life force meets floor, stories of gore. Seek me to unlock death's door.",
    weapon:
      "Instrument of final sleep, in darkness I now keep. Find me where shadows creep.",
    shoe: "Silent steps now cease their sound, upon this haunted ground. Where I rest, truth is found.",
  },
  // Set 4
  {
    bloodSplatter:
      "Paint of life spilled in haste, upon these floors now placed. Follow my scarlet guide with taste.",
    weapon:
      "Death's companion cold and stern, waiting for your eyes to learn. Find me where shadows turn.",
    shoe: "Journey's end marked by leather, clues all come together. Where I point, gather.",
  },
  // Set 5
  {
    bloodSplatter:
      "Ruby drops mark the scene, of what has been unseen. Follow me to what violence means.",
    weapon:
      "I dealt the final blow, now in shadow low. Find me where dark winds blow.",
    shoe: "Last steps taken in fear, tell you death is near. Follow where I disappear.",
  },
];

let currentHintSetIndex = 0;

// Function to initialize a new hint set
function initializeNewHintSet() {
  // Get a random hint set index different from the current one
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * HINT_SETS.length);
  } while (newIndex === currentHintSetIndex && HINT_SETS.length > 1);

  currentHintSetIndex = newIndex;
  return HINT_SETS[currentHintSetIndex];
}

// Function to get the current hint for a specific clue
function getCurrentHint(clueType) {
  const currentSet = HINT_SETS[currentHintSetIndex];
  return currentSet[clueType];
}

// Add this to your game restart logic
function restartGame() {
  // Reset game state
  cluesSolved = 0;

  timeLeft = 150; // Reset timer
  
  // Reset visibility of objects
  weapon.visible = false;
  shoe.visible = false;
  deadBody.visible = false;

  // Initialize new set of hints
  initializeNewHintSet();

  // Reset other necessary game elements
  resetHint(); // Clear any displayed hints

  document.getElementById("gameOverPopupSuccess").style.display = "none"; // Hide success/failure pop-ups
  document.getElementById("gameOverPopupFail").style.display = "none";

  character.position.set(5, houseGroundLevel + 4.7, 6); // Reset character position
  character.rotation.y = Math.PI;

  // Start the timer again
  clearInterval(timerId);
  startTimer();

  // Reset game-ended state and re-enable controls
  gameEnded = false;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  document.addEventListener("click", handleClick);
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
  const currentHints = HINT_SETS[currentHintSetIndex];

  if (cluesSolved === 1) {
    weapon.visible = true; // Show weapon after solving first clue
    showHint(currentHints.weapon);
    console.log("Blood splatter clue solved.");
  } else if (cluesSolved === 2) {
    shoe.visible = true; // Show shoe after solving second clue
    showHint(currentHints.shoe);
    console.log("Weapon clue solved.");
  } else if (cluesSolved === 3) {
    // Show the dead body after solving all clues
    loadDeadBody();
  }
}

const glowThreshold = 1.5; // Distance threshold for glow effect

document.getElementById("clueButton").addEventListener("click", () => {
  const currentHints = HINT_SETS[currentHintSetIndex];

  if (isNearClue(bloodSplatter)) {
    console.log("Near blood splatter");
    showHint(currentHints.bloodSplatter);
    clueSound.play();
    playPickUpAnimation();
    solveClue();
  } else if (isNearClue(weapon)) {
    console.log("Near weapon");
    showHint(currentHints.weapon);
    clueSound.play();
    playPickUpAnimation();
    solveClue();
  } else if (isNearClue(shoe)) {
    console.log("Near shoe");
    showHint(currentHints.shoe);
    playPickUpAnimation();
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

function playPickUpAnimation() {
  if (pickUpAction && activeAction !== pickUpAction) {
    // Fade out the current action and fade in the pick-up animation
    activeAction.fadeOut(0.2); // Smooth transition
    pickUpAction.reset().fadeIn(0.2).play();
    activeAction = pickUpAction;

    // After the pick-up animation ends, return to idle
    mixer.addEventListener("finished", () => {
      activeAction = idleAction;
      idleAction.play();
    });
  }
}
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

  checkFlashlightProximity();
  updateFlashlight();

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

  if (key === "e" && canPickUpFlashlight) {
    pickupFlashlight();
  }

  if (key === "f" && isFlashlightPickedUp) {
    toggleFlashlight();
  }
  if (key === "v") {
    isFirstPerson = !isFirstPerson; // Toggle between first-person and third-person
    currentCamera = isFirstPerson ? firstPersonCamera : thirdPersonCamera; // Switch the camera
    console.log(
      `Switched to ${isFirstPerson ? "First-Person" : "Third-Person"} Camera`
    );
  }

  keys[key] = true; // Set the key as pressed
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
  restartGame();
});

document.getElementById("nextLevelButton").addEventListener("click", () => {
  window.location.href = "level2.html"; // Reload the game (or handle the restart logic as needed)
});

document
  .getElementById("successRestartButton")
  .addEventListener("click", () => {
    restartGame();
  });

// Initialize the game
// Start the application
init();
startTimer();
createControlButtons();
