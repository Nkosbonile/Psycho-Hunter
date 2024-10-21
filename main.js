import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCameras,switchCamera ,updateThirdPersonCamera, onWindowResize, updateFirstPersonCamera  } from './camera.js';
import { createCharacter, moveCharacter } from './character.js';
import { showHint, updateHintPosition, resetHint } from './hintSystem.js';

let scene, renderer, keys = {}, mixer, walkAction, idleAction, activeAction, character;
let thirdPersonCamera, firstPersonCamera, currentCamera, controls;
let isFirstPerson = false;
let houseGroundLevel = 0;  // Ground level of the house
const walls = [];
let houseUpperFloorLevel = 0;

    let currentClueIndex = 0;
    let timeLeft = 600;
    let timerId;

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Light sky color
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the cameras
    const cameras = createCameras(renderer);
    thirdPersonCamera = cameras.thirdPersonCamera;
    firstPersonCamera = cameras.firstPersonCamera;
    controls = cameras.controls;


    currentCamera = thirdPersonCamera; // Start with third-person camera
    window.addEventListener('resize', () => onWindowResize(currentCamera, renderer));

    // Load the house model
    const loader = new GLTFLoader();
    loader.load('./assets/models/house/scene.gltf', (gltf) => {
        const house = gltf.scene;
        house.scale.set(0.2, 0.2, 0.2);

        // Calculate the house's ground level using bounding box
        const houseBox = new THREE.Box3().setFromObject(house);
        houseGroundLevel = houseBox.min.y;  // Save ground level for later use
        houseUpperFloorLevel = houseGroundLevel + 4;


        // Traverse through the house model and log texture info
        house.traverse((node) => {
            if (node.isMesh) {
                const material = node.material;
   

                
                const box = new THREE.Box3().setFromObject(node);
                walls.push(box);


                // Apply the diffuse texture manually if it's not applied automatically
                if (material.map === null && material.userData.diffuseTexture) {
                    const texture = textureLoader.load(`./assets/models/house/${material.userData.diffuseTexture}`);
                    material.map = texture;
                    material.needsUpdate = true;
                }
            }
        });

        scene.add(house);

        // Load the character model
        loader.load('./assets/models/iwi_male_character_02/scene.gltf', (gltf) => {
          character = createCharacter(gltf);
          scene.add(character);
          character.scale.set(0.5, 0.5, 0.5);

          character.position.set(0,houseGroundLevel + 4.7,5)
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
        loader.load('./assets/models/dead_body/scene.gltf', function (gltf) {
            const deadBody = gltf.scene;
            deadBody.scale.set(0.5, 0.5, 0.5);  // Adjust size
            deadBody.position.set(4, houseGroundLevel+4.5, 0);  // Set the dead body at the same ground level as the house
            scene.add(deadBody);
        });
        
        // Load and position the blood splatter model
        loader.load('./assets/models/blood_spattered/scene.gltf', (gltf) => {
            const bloodSplatter = gltf.scene;
            bloodSplatter.scale.set(0.05, 0.05, 0.05); // Adjust the scale as needed
            bloodSplatter.position.set(2, houseGroundLevel+4.5, 3); // Position it in the scene
            scene.add(bloodSplatter);

            // Start animation loop
          animate();
            
        });
    });

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const isMoving = keys['w'] || keys['a'] || keys['s'] || keys['d'];

    // Switch between animations
    if (isMoving && activeAction !== walkAction) {
        switchAnimation(walkAction);
    } else if (!isMoving && activeAction !== idleAction) {
        switchAnimation(idleAction);
    }

    // Move the character
    moveCharacter(currentCamera, keys, character, isFirstPerson, houseGroundLevel, houseUpperFloorLevel);

    // Update the camera based on the mode
    if (isFirstPerson) {
        updateFirstPersonCamera(firstPersonCamera, character);  // Update first-person camera
    } else {
        updateThirdPersonCamera(thirdPersonCamera, character);  // Update third-person camera
    }

    if (mixer) mixer.update(0.016);  // Update animations
    
    // Check if the player is close to the blood splatter
    const bloodSplatterPosition = new THREE.Vector3(2, houseGroundLevel+4.5, 3); // Position of the blood splatter
    const distanceToBloodSplatter = character.position.distanceTo(bloodSplatterPosition);
    const showHintThreshold = 2; // Adjust the distance threshold as needed

    if (distanceToBloodSplatter < showHintThreshold) {
        showHint(scene, currentCamera, 'This blood splatter is a clue. Where could the body be?');
    }

    // Update hint position to always face the camera
    updateHintPosition(currentCamera);

    renderer.render(scene, currentCamera);  // Render the scene from the active camera
}
/// Function to show the popup when the player fails to find the body (time's up)
function showFailPopup() {
    document.getElementById('gameOverPopupFail').style.display = 'flex';
    disableGameControls(); // Disable controls when showing the fail popup
}

// Function to show the popup when the player finds the body
function showSuccessPopup() {
    document.getElementById('gameOverPopupSuccess').style.display = 'flex';
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



window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    
    if (key === 'v') {
        isFirstPerson = !isFirstPerson;  // Toggle between first-person and third-person
        currentCamera = isFirstPerson ? firstPersonCamera : thirdPersonCamera;  // Switch the camera
        console.log(`Switched to ${isFirstPerson ? 'First-Person' : 'Third-Person'} Camera`);
    }

    keys[key] = true;  // Set the key as pressed
    console.log('Key Down:', key);  // Log pressed key
});

window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;  // Set the key as released
    console.log('Key Up:', event.key.toLowerCase());  // Log released key
});

// Start the application
init();
startTimer();

