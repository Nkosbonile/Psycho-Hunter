import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCameras, switchCamera, onWindowResize, updateFirstPersonCamera } from './camera.js';
import { createCharacter, moveCharacter } from './character.js';

let scene, renderer, keys = {}, mixer, walkAction, idleAction, activeAction, character;
let thirdPersonCamera, firstPersonCamera, currentCamera, controls;
let isFirstPerson = false;
let houseGroundLevel = 0;  // Ground level of the house

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

        // Traverse through the house model and log texture info
        house.traverse((node) => {
            if (node.isMesh) {
                const material = node.material;
                console.log(node.material.map);       // Check if diffuse map is loaded
                console.log(node.material.normalMap);  // Check if normal map is loaded
                console.log(node.material.specularMap);  // Check if specular map is loaded

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

            // Set character on the house ground level
            character.position.y = houseGroundLevel+4.5;

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
        loader.load('./assets/models/dead_body/scene.gltf', function (gltf) {
            const deadBody = gltf.scene;
            deadBody.scale.set(0.5, 0.5, 0.5);  // Adjust size
            deadBody.position.set(4, houseGroundLevel+4.5, 0);  // Set the dead body at the same ground level as the house
            scene.add(deadBody);
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

    // Transition to walk if moving, idle if not moving
    if (isMoving && activeAction !== walkAction) {
        switchAnimation(walkAction);
    } else if (!isMoving && activeAction !== idleAction) {
        switchAnimation(idleAction);
    }

    // Move character and camera
    moveCharacter(currentCamera, keys, character, isFirstPerson);  // Pass isFirstPerson

    if (isFirstPerson) {
        updateFirstPersonCamera(firstPersonCamera, character.position); // Update first-person camera position
    }

    if (mixer) mixer.update(0.016); // Update animations

    if (!isFirstPerson) {
        controls.update();  // Update controls only in third-person view
    }

    renderer.render(scene, currentCamera);  // Render the scene with the current camera
}

// Switch between animations
function switchAnimation(newAction) {
    activeAction.fadeOut(0.5); // Smooth transition
    newAction.reset().fadeIn(0.5).play(); // Fade into the new action
    activeAction = newAction; // Update the current action
}

// Key event handlers
window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true; // Set the key as pressed

    // Switch between first-person and third-person view on pressing 'V'
    if (event.key.toLowerCase() === 'v') {
        currentCamera = switchCamera(thirdPersonCamera, firstPersonCamera);
        isFirstPerson = !isFirstPerson;
        controls.enabled = !isFirstPerson; // Disable OrbitControls in first-person view
    }
});

window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false; // Set the key as released
});

// Start the application
init();
