// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// import { createCameras, switchCamera, onWindowResize, updateFirstPersonCamera } from './camera.js';
// import { createCharacter, moveCharacter } from './character.js';

// let scene, renderer, keys = {}, mixer, walkAction, idleAction, activeAction, character;
// let thirdPersonCamera, firstPersonCamera, currentCamera, controls;
// let isFirstPerson = false;
// let houseGroundLevel = 0;  // Ground level of the house

// // Initialize the scene
// function init() {
//     scene = new THREE.Scene();
//     scene.background = new THREE.Color(0x87CEEB); // Light sky color
//     renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     document.body.appendChild(renderer.domElement);

//     // Create the cameras
//     const cameras = createCameras(renderer);
//     thirdPersonCamera = cameras.thirdPersonCamera;
//     firstPersonCamera = cameras.firstPersonCamera;
//     controls = cameras.controls;

//     currentCamera = thirdPersonCamera; // Start with third-person camera
//     window.addEventListener('resize', () => onWindowResize(currentCamera, renderer));

//     // Load the house model
//     const loader = new GLTFLoader();
//     loader.load('./assets/models/house/scene.gltf', (gltf) => {
//         const house = gltf.scene;
//         house.scale.set(0.2, 0.2, 0.2);

//         // Calculate the house's ground level using bounding box
//         const houseBox = new THREE.Box3().setFromObject(house);
//         houseGroundLevel = houseBox.min.y;  // Save ground level for later use

//         // Traverse through the house model and log texture info
//         house.traverse((node) => {
//             if (node.isMesh) {
//                 const material = node.material;
//                 console.log(node.material.map);       // Check if diffuse map is loaded
//                 console.log(node.material.normalMap);  // Check if normal map is loaded
//                 console.log(node.material.specularMap);  // Check if specular map is loaded

//                 // Apply the diffuse texture manually if it's not applied automatically
//                 if (material.map === null && material.userData.diffuseTexture) {
//                     const texture = textureLoader.load(`./assets/models/house/${material.userData.diffuseTexture}`);
//                     material.map = texture;
//                     material.needsUpdate = true;
//                 }
//             }
//         });

//         scene.add(house);

//         // Load the character model
//         loader.load('./assets/models/iwi_male_character_02/scene.gltf', (gltf) => {
//             character = createCharacter(gltf);
//             scene.add(character);
//             character.scale.set(0.5, 0.5, 0.5);

//             // Set character on the house ground level
//             character.position.y = houseGroundLevel+4.5;

//             // Set up animations
//             mixer = new THREE.AnimationMixer(character);
//             const animations = gltf.animations;
//             walkAction = mixer.clipAction(THREE.AnimationClip.findByName(animations, 'Rig|walk'));
//             idleAction = mixer.clipAction(THREE.AnimationClip.findByName(animations, 'Rig|idle'));

//             // Set idle as the default active action
//             activeAction = idleAction;
//             idleAction.play();

//             // Start animation loop
//             animate();
//         });

//         // Load the dead body model and position it
//         loader.load('./assets/models/dead_body/scene.gltf', function (gltf) {
//             const deadBody = gltf.scene;
//             deadBody.scale.set(0.5, 0.5, 0.5);  // Adjust size
//             deadBody.position.set(4, houseGroundLevel+4.5, 0);  // Set the dead body at the same ground level as the house
//             scene.add(deadBody);
//         });
//     });

//     // Add basic lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     scene.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
//     directionalLight.position.set(5, 10, 7.5);
//     scene.add(directionalLight);
// }
// function animate() {
//     requestAnimationFrame(animate);

//     const isMoving = keys['w'] || keys['a'] || keys['s'] || keys['d'];

//     // Transition to walk if moving, idle if not moving
//     if (isMoving && activeAction !== walkAction) {
//         switchAnimation(walkAction);
//     } else if (!isMoving && activeAction !== idleAction) {
//         switchAnimation(idleAction);
//     }

//     // Move character and camera
//     moveCharacter(currentCamera, keys, character, isFirstPerson);  // Pass isFirstPerson

//     if (isFirstPerson) {
//         // First-person camera: Set camera at character's eye level
//         const cameraOffset = new THREE.Vector3(0, 1.6, 0);  // Offset for the camera to be at the character's eye level
//         const cameraPosition = cameraOffset.applyMatrix4(character.matrixWorld);  // Apply character's transformation to the offset
//         firstPersonCamera.position.lerp(cameraPosition, 0.1);  // Smooth transition to the new position
//         firstPersonCamera.lookAt(character.position.x, character.position.y + 1.6, character.position.z);  // Look straight ahead
//     } else {
//         // Third-person camera: follow the character with an offset behind them
//         const cameraOffset = new THREE.Vector3(0, 2, -5); // Offset behind and above the character
//         const cameraPosition = cameraOffset.applyMatrix4(character.matrixWorld); // Apply character's transformation to the offset
//         thirdPersonCamera.position.lerp(cameraPosition, 0.1);  // Smooth follow
//         thirdPersonCamera.lookAt(character.position.x, character.position.y + 1.5, character.position.z);  // Look at character
//     }

//     if (mixer) mixer.update(0.016); // Update animations
//     renderer.render(scene, currentCamera);  // Render the scene with the current camera
// }



// // Switch between animations
// function switchAnimation(newAction) {
//     activeAction.fadeOut(0.5); // Smooth transition
//     newAction.reset().fadeIn(0.5).play(); // Fade into the new action
//     activeAction = newAction; // Update the current action
// }

// // Key event handlers
// window.addEventListener('keydown', (event) => {
//     keys[event.key.toLowerCase()] = true; // Set the key as pressed

//     // Switch between first-person and third-person view on pressing 'V'
//     if (event.key.toLowerCase() === 'v') {
//         currentCamera = switchCamera(thirdPersonCamera, firstPersonCamera);
//         isFirstPerson = !isFirstPerson;
//         controls.enabled = !isFirstPerson; // Disable OrbitControls in first-person view
//     }
// });

// window.addEventListener('keyup', (event) => {
//     keys[event.key.toLowerCase()] = false; // Set the key as released
// });

// // Start the application
// init();

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCameras, updateThirdPersonCamera, onWindowResize, updateFirstPersonCamera } from './camera.js';
import { createCharacter, moveCharacter } from './character.js';

let scene, renderer, keys = {}, mixer, walkAction, idleAction, activeAction, character;
let thirdPersonCamera, firstPersonCamera, currentCamera, controls;
let isFirstPerson = false;
let houseGroundLevel = 0;  // Ground level of the house
let houseUpperFloorLevel = 0;

const clues = [
    "Clue 1: Look for something that reflects light.",
    "Clue 2: The answer is hidden where it's cold.",
    "Clue 3: Check under the table where you find your meals.",
    "Clue 4: The last clue is near the entrance."
];

let currentClueIndex = 0;
let timeLeft = 30; // 2 minutes in seconds
let timerId;


function loadBody(isCorrect) {
    isCorrectBody = isCorrect; // Set the variable to indicate if this is the correct body
}

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

        // Calculate the house's ground level
        const houseBox = new THREE.Box3().setFromObject(house);
        houseGroundLevel = houseBox.min.y;  // Save ground level for later use
        houseUpperFloorLevel = houseGroundLevel + 4;

        // Add the house to the scene
        scene.add(house);

        // Load the character model
        loader.load('./assets/models/iwi_male_character_02/scene.gltf', (gltf) => {
            character = createCharacter(gltf);
            scene.add(character);
            character.scale.set(0.5, 0.5, 0.5);

            // Set character on the house ground level
            character.position.y = houseGroundLevel + 4.8; // Adjusted the y-position to place the character on the ground

            // Set up animations
            mixer = new THREE.AnimationMixer(character);
            const animations = gltf.animations;
            walkAction = mixer.clipAction(THREE.AnimationClip.findByName(animations, 'Rig|walk'));
            idleAction = mixer.clipAction(THREE.AnimationClip.findByName(animations, 'Rig|idle'));

            // Set idle as the default active action
            activeAction = idleAction;
            idleAction.play();

            // Start animation loop
            animate();
        });

        // Load the dead body model and position it
        loader.load('./assets/models/dead_body/scene.gltf', (gltf) => {
            const deadBody = gltf.scene;
            deadBody.scale.set(0.5, 0.5, 0.5);  // Adjust size
            deadBody.position.set(4, houseGroundLevel + 4.5, 0);  // Set the dead body at the same ground level
            scene.add(deadBody);

             
    loadBody(false);
        });
    });

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
}
// Function to show the clues
function showClue() {
    const clueDisplay = document.getElementById('clueDisplay');
    
    if (currentClueIndex < clues.length) {
        clueDisplay.innerText = clues[currentClueIndex];
        clueDisplay.style.display = 'block'; // Show the clue
        currentClueIndex++; // Move to the next clue
    } else {
        clueDisplay.innerText = "No more clues available!";
    }
}

// Button event listeners for clues
document.getElementById('clueButton').addEventListener('click', showClue);

// Button event listeners for character movement
document.getElementById('up').addEventListener('mousedown', () => {
    keys['w'] = true;
    console.log("Up button pressed: Moving forward");
});
document.getElementById('up').addEventListener('mouseup', () => {
    keys['w'] = false;
    console.log("Up button released: Stopping forward movement");
});

document.getElementById('left').addEventListener('mousedown', () => {
    keys['a'] = true;
    console.log("Left button pressed: Moving left");
});
document.getElementById('left').addEventListener('mouseup', () => {
    keys['a'] = false;
    console.log("Left button released: Stopping left movement");
});

document.getElementById('down').addEventListener('mousedown', () => {
    keys['s'] = true;
    console.log("Down button pressed: Moving backward");
});
document.getElementById('down').addEventListener('mouseup', () => {
    keys['s'] = false;
    console.log("Down button released: Stopping backward movement");
});

document.getElementById('right').addEventListener('mousedown', () => {
    keys['d'] = true;
    console.log("Right button pressed: Moving right");
});
document.getElementById('right').addEventListener('mouseup', () => {
    keys['d'] = false;
    console.log("Right button released: Stopping right movement");
});

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

function checkForDeadBodyInteraction() {
    // Get the character's position and the dead body's position
    const characterPosition = new THREE.Vector3();
    character.getWorldPosition(characterPosition);

    const deadBodyPosition = new THREE.Vector3(4, houseGroundLevel + 4.5, 0); // Adjust this based on the dead body's actual position

    // Calculate the distance between the character and the dead body
    const distance = characterPosition.distanceTo(deadBodyPosition);

    // Define an interaction range
    const interactionRange = 1.5; // You can adjust this value based on your needs

    // Check if the character is within the interaction range
    if (distance < interactionRange) {
        // Add event listener for 'E' key press
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'e') {
                // Check if the found body is correct or not
                if (!isCorrectBody) {
                    showSuccessPopup(); // Player wins if it's the wrong body
                    // Include logic for transitioning to the next level here if desired
                } else {
                    showFailPopup(); // Player fails if it's the correct body
                }
            }
        }, { once: true }); // Use { once: true } to remove the listener after it's called
    }
}

// Timer Functionality
function startTimer() {
    const timerDisplay = document.getElementById('timer');

    timerId = setInterval(() => {
        // Calculate minutes and seconds
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        // Format the time as MM:SS
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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

function switchAnimation(newAction) {
    if (activeAction !== newAction) {  // Check if we are already playing the desired action
        activeAction.fadeOut(0.5);     // Smoothly fade out the current action
        newAction.reset().fadeIn(0.5).play(); // Fade into the new action
        activeAction = newAction;       // Update the current active action
    }
}
// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const isMoving = keys['w'] || keys['a'] || keys['s'] || keys['d'];

    // Transition to walk if moving, idle if not moving
    if (isMoving && activeAction !== walkAction) {
        switchAnimation(walkAction);
    } else if (!isMoving && activeAction !== idleAction) {
        switchAnimation(idleAction);
    }

    // Move character and update camera based on current mode
    moveCharacter(currentCamera, keys, character, isFirstPerson, houseGroundLevel, houseUpperFloorLevel);
    
    if (isFirstPerson) {
        updateFirstPersonCamera(firstPersonCamera, character); // First-person camera updates
    } else {
        updateThirdPersonCamera(thirdPersonCamera, character); // Third-person camera updates
    }

    if (mixer) mixer.update(0.016);

    // Check for interaction with the dead body
    checkForDeadBodyInteraction();

    renderer.render(scene, currentCamera);
}

// Event listeners for keyboard input
window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;  // Set the key as pressed
    console.log('Key Down:', event.key.toLowerCase()); // Log pressed key
});

window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false; // Set the key as released
    console.log('Key Up:', event.key.toLowerCase()); // Log released key
});

// Start the application
init();
startTimer();

// Event listener for restart button in fail popup
document.getElementById('failRestartButton').addEventListener('click', () => {
    location.reload(); // Reload the game (or handle the restart logic as needed)
});

// Event listener for restart button in success popup
document.getElementById('successRestartButton').addEventListener('click', () => {
    location.reload(); // Reload the game (or handle the restart logic as needed)
});

// Event listener for next level button
document.getElementById('nextLevelButton').addEventListener('click', () => {
    // Your logic for proceeding to the next level
    console.log('Proceeding to next level...');
});
