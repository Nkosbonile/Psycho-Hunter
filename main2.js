import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCharacter, moveCharacter } from "./character.js";
import { ThirdPersonCamera } from './thirdPersonCamera.js';
import { clues, showEvidenceModal } from './clues.js';


let character;
let mixer;
let walkAction;
let idleAction;
let pickUpAction;
let activeAction;

// Add these camera configuration constants at the top with other constants
const THIRD_PERSON_OFFSET = new THREE.Vector3(0, 5, -14); // Camera position relative to character
const FIRST_PERSON_OFFSET = new THREE.Vector3(0, 10, 0.1); // Roughly eye level
const CAMERA_LERP_FACTOR = 0.1; // How smoothly the camera follows (0-1)

const HOUSE_GROUND_LEVEL = 0;
const HOUSE_UPPER_FLOOR_LEVEL = 10; // Adjust based on your house dimensions
let isFirstPerson = false; // Toggle for first/third person view
const clock = new THREE.Clock();
const keys = {
    'w': false,
    'a': false,
    's': false,
    'd': false,
    //'shift': false
}
// Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 20, 5);
camera.lookAt(0, 5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();
// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = 0.1;
const characterSpeedMain2 = 0.1;  // Different speed for character in main2.js
// Enhanced Materials
const textures = {
    walls: {
        color: textureLoader.load('wall.jpg'),
        normal: textureLoader.load('wall.jpg'),
        roughness: textureLoader.load('wall.jpg')
    },
    wood: {
        color: textureLoader.load('wood_color.jpg'),
        normal: textureLoader.load('wood_color.jpg'),
        roughness: textureLoader.load('wood_roughness.jpg')
    },
    roof: {
        color: textureLoader.load('r2.jpg'),
        normal: textureLoader.load('r2.jpg')
    },
    floor: {
        color: textureLoader.load('tile2.jpg'),
        normal: textureLoader.load('tile2.jpg'),
        roughness: textureLoader.load('tile2.jpg')
    },
    grass: {
        color: textureLoader.load('grass2.jpg'),
        normal: textureLoader.load('grass2.jpg')
    }
};

// Add texture repeat settings
Object.values(textures).forEach(textureSet => {
    Object.values(textureSet).forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Adjust repeat values as needed
    });
});

// Then modify the materials object to use these textures
const materials = {
    walls: new THREE.MeshStandardMaterial({
        map: textures.walls.color,
        normalMap: textures.walls.normal,
        roughnessMap: textures.walls.roughness,
        roughness: 0.9,
        metalness: 0.1
    }),
    
    floor: new THREE.MeshStandardMaterial({
        map: textures.floor.color,
        normalMap: textures.floor.normal,
        roughnessMap: textures.floor.roughness,
        roughness: 0.8,
        metalness: 0.2
    }),
    
    wood: new THREE.MeshStandardMaterial({
        map: textures.wood.color,
        normalMap: textures.wood.normal,
        roughnessMap: textures.wood.roughness,
        roughness: 0.7,
        metalness: 0.2
    }),
    
    roof: new THREE.MeshStandardMaterial({
        map: textures.roof.color,
        normalMap: textures.roof.normal,
        roughness: 0.8,
        metalness: 0.2
    }),

    // Window material remains unchanged as it's transparent
    window: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0,
        metalness: 0.2,
        transmission: 0.95,
        clearcoat: 1.0
    }),

    door: new THREE.MeshStandardMaterial({
        map: textures.wood.color,
        normalMap: textures.wood.normal,
        roughnessMap: textures.wood.roughness,
        roughness: 0.7,
        metalness: 0.1
    })
};
// Enhanced Lighting System
function createLightingSystem() {
    // Create a brighter ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x777777, 1.2); // Slightly brighter soft ambient light
    scene.add(ambientLight);

    // Main directional light for focused lighting and shadows
    const sunLight = new THREE.DirectionalLight(0xfffacd, 0.8); // Warmer light with a higher base intensity
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Flicker effect for both ambient and directional lights
    function flickerRoomLight() {
        // Increase baseline intensity with slight flicker range for both lights
        ambientLight.intensity = 1.0 + Math.random() * 0.3; // Between 1.0 and 1.3
        sunLight.intensity = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0

        // Set a short random interval to keep the flickering organic and unsettling
        setTimeout(flickerRoomLight, Math.random() * 200 + 300); // Random interval for natural effect
    }
    flickerRoomLight(); // Initiate flickering effect

    // Spotlight for highlighting key areas with warm tone
    const spotlight = new THREE.SpotLight(0xff4500, 1.2); // Higher intensity spotlight
    spotlight.position.set(0, 20, 0);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.3;
    spotlight.castShadow = true;
    spotlight.target.position.set(0, 0, 0);
    spotlight.target.updateMatrixWorld();
    scene.add(spotlight);
}



function createHouse() {
    const house = new THREE.Group();

    // Ground/Lawn
    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(40, 64),
        new THREE.MeshStandardMaterial({ 
            color: 0x2E8B57,
            roughness: 0.8,
            metalness: 0.1
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    house.add(ground);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(50, 1, 50),
        materials.floor
    );
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    house.add(floor);

    const wallHeight = 18;
    const wallThickness = 0.5;

    // Create Wall With Windows Function
    function createWallWithWindows(width, height, depth, windowConfig) {
        const wallGroup = new THREE.Group();

        // Main wall
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            materials.walls
        );
        wall.castShadow = true;
        wall.receiveShadow = true;
        wallGroup.add(wall);

        // Add windows
        if (windowConfig) {
            windowConfig.forEach(config => {
                const windowFrame = new THREE.Mesh(
                    new THREE.BoxGeometry(config.width + 0.4, config.height + 0.4, depth + 0.1),
                    materials.wood
                );
                windowFrame.position.set(config.x, config.y, 0);
                wallGroup.add(windowFrame);

                const windowPane = new THREE.Mesh(
                    new THREE.BoxGeometry(config.width, config.height, depth + 0.2),
                    materials.window
                );
                windowPane.position.set(config.x, config.y, 0);
                wallGroup.add(windowPane);
            });
        }

        return wallGroup;
    }

    // Front wall with door and windows
    const frontWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: -15, y: 5 },
        { width: 4, height: 6, x: 15, y: 5 }
    ]);
    frontWall.position.set(0, wallHeight / 2, 25);
    
    // Add door
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(4, 8, wallThickness + 0.1),
        materials.door
    );
    door.position.set(0, 4, 25);
    house.add(door);
    
    house.add(frontWall);

    // Back wall with windows
    const backWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: -15, y: 5 },
        { width: 4, height: 6, x: 15, y: 5 }
    ]);
    backWall.position.set(0, wallHeight / 2, -25);
    house.add(backWall);

    // Side walls
    const leftWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: 0, y: 5 }
    ]);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-25, wallHeight / 2, 0);
    house.add(leftWall);

    const rightWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: 0, y: 5 }
    ]);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(25, wallHeight / 2, 0);
    house.add(rightWall);

    // Roof
    const roofHeight = 8;
    const roofGeometry = new THREE.ConeGeometry(35, roofHeight, 4);
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.y = wallHeight + roofHeight / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Interior Walls
    const interiorWall = new THREE.Mesh(
        new THREE.BoxGeometry(30, wallHeight, wallThickness),
        materials.walls
    );
    interiorWall.position.set(0, wallHeight / 2, 0);
    house.add(interiorWall);

    // Enhanced Furniture
    const furniture = [
        // Living Room
        { type: 'sofa', pos: [15, 1.5, -15], size: [8, 3, 4], rot: 0 },
        { type: 'coffeeTable', pos: [15, 1, -10], size: [4, 1.5, 3], rot: 0 },
        { type: 'tvStand', pos: [15, 2, -5], size: [8, 3, 1], rot: 0 },
        
        // Study Room
        { type: 'desk', pos: [-15, 2, -15], size: [7, 2.5, 3], rot: 0 },
        { type: 'bookshelf', pos: [-22, 5, -15], size: [1, 10, 8], rot: 0 },
        { type: 'chair', pos: [-15, 2, -12], size: [2, 3, 2], rot: 0 }
    ];

    furniture.forEach(item => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(...item.size),
            materials.wood
        );
        mesh.position.set(...item.pos);
        mesh.rotation.y = item.rot;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        house.add(mesh);
    });

    // Add carpets
    const carpets = [
        { pos: [-15, 0.01, -15], radius: 6 },
        { pos: [15, 0.01, -15], radius: 8 }
    ];

    carpets.forEach(carpet => {
        const mesh = new THREE.Mesh(
            new THREE.CircleGeometry(carpet.radius, 32),
            materials.carpet
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(...carpet.pos);
        mesh.receiveShadow = true;
        house.add(mesh);
    });

    return house;
}

const loader = new GLTFLoader();
// Load the character model
loader.load(
    "./assets/models/iwi_male_character_02/scene.gltf", 
    (gltf) => {
        try {
            character = gltf.scene;
            
            // Set initial position and rotation
            character.position.set(0, HOUSE_GROUND_LEVEL, 3);
            character.rotation.y = Math.PI;
            character.scale.set(5, 5, 5); // Adjust scale as needed
            
            scene.add(character);
            
            // Set up animation mixer
            mixer = new THREE.AnimationMixer(character);
            
            // Find and set up animations
            const animations = gltf.animations;
            console.log('Available animations:', animations.map(a => a.name));
            
            // Set up animations (adjust animation names based on your model)
            walkAction = mixer.clipAction(
                THREE.AnimationClip.findByName(animations, "walk") ||
                THREE.AnimationClip.findByName(animations, "Rig|walk")
            );
            
            idleAction = mixer.clipAction(
                THREE.AnimationClip.findByName(animations, "idle") ||
                THREE.AnimationClip.findByName(animations, "Rig|idle")
            );
            
            // Start with idle animation
            if (idleAction) {
                activeAction = idleAction;
                idleAction.play();
            }
            
            // Add debug helper to visualize character position
            const helper = new THREE.BoxHelper(character, 0xff0000);
            //scene.add(helper);
            
        } catch (error) {
            console.error('Error setting up character:', error);
        }
    },
    (xhr) => {
        console.log(`Character loading: ${(xhr.loaded / xhr.total * 100)}% loaded`);
    },
    (error) => {
        console.error('Error loading character:', error);
    }
);

// Add keyboard event listeners
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
    // Add perspective toggle
    if (key === 'v') {
        isFirstPerson = !isFirstPerson;
        updateCameraMode();
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// Add this new function to handle camera positioning
function updateCamera() {
    if (!character) return;

    if (isFirstPerson) {
        // First-person view: position camera at character's head
        const characterWorldPos = new THREE.Vector3();
        character.getWorldPosition(characterWorldPos);
        
        // Add first-person offset to character position
        camera.position.copy(characterWorldPos.add(FIRST_PERSON_OFFSET));
        
        // Align camera rotation with character
        // camera.rotation.y = character.rotation.y;
        // camera.rotation.x = 0; // Keep vertical angle level


        // Copy the character's full rotation quaternion
        camera.quaternion.copy(character.quaternion);
        camera.rotateY(Math.PI); // Rotate 180 degrees to face forward
        
        // Disable orbit controls in first person
        controls.enabled = false;
    } else {
        // Third-person view
        const characterWorldPos = new THREE.Vector3();
        character.getWorldPosition(characterWorldPos);
        
        // Calculate desired camera position behind character
        const idealOffset = THIRD_PERSON_OFFSET.clone();
        idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
        const idealPosition = characterWorldPos.clone().add(idealOffset);
        
        // Smoothly move camera to ideal position
        camera.position.lerp(idealPosition, CAMERA_LERP_FACTOR);
        
        // Make camera look at character
        camera.lookAt(characterWorldPos);
        
        // Enable orbit controls in third person but limit their effect
        controls.enabled = true;
        controls.target.copy(characterWorldPos);
        controls.minDistance = 5;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
    }
}
function addFlickeringLight(target, color = 0xff0000, intensity = 2, range = 10) {
    const light = new THREE.PointLight(color, intensity, range);
    target.add(light);

    // Flickering effect
    function flicker() {
        // Randomize the light intensity within a range
        light.intensity = intensity * (0.5 + Math.random() * 0.5); // Flicker between 50% and 100%
        setTimeout(flicker, Math.random() * 200); // Change every 0 to 200ms
    }
    flicker();
}
// Function to update camera based on perspective mode
function updateCameraMode() {
    if (character) {
        if (isFirstPerson) {
            controls.enabled = false;
        } else {
            controls.enabled = true;
            // Reset to default third-person view
            const characterWorldPos = new THREE.Vector3();
            character.getWorldPosition(characterWorldPos);
            camera.position.copy(characterWorldPos).add(THIRD_PERSON_OFFSET);
            camera.lookAt(characterWorldPos);
        }
    }
}

// load dossier
loader.load("./assets/models/file/scene.gltf", (gltf) => {
    const file = gltf.scene;
    file.scale.set(5, 5, 5);
    file.position.set(23, 0.0625, 23);
    scene.add(file);
    addFlickeringLight(file); // Add flickering light
});

// load bloody cabinet (no light needed here)
loader.load("./assets/models/bloody_cabinet/scene.gltf", (gltf) => {
    const cabinet = gltf.scene;
    cabinet.scale.set(0.20, 0.20, 0.20);
    cabinet.position.set(-22.5, 0, 18.5);
    scene.add(cabinet);
});

// load polaroid pictures (no light needed here)
loader.load("./assets/models/polaroid_pictures/scene.gltf", (gltf) => {
    const polaroid = gltf.scene;
    polaroid.scale.set(1, 1, 1);
    polaroid.position.set(0, 0, 0.09375);
    scene.add(polaroid);
});

// load broken glass (no light needed here)
loader.load("./assets/models/broken_glass_pieces/scene.gltf", (gltf) => {
    const brokenGlass = gltf.scene;
    brokenGlass.scale.set(1, 1, 1);
    brokenGlass.position.set(0, 0.20, 10);
    scene.add(brokenGlass);
});

// load handcuff with flickering light
loader.load("./assets/models/simple_handcuffs/scene.gltf", (gltf) => {
    const handcuff = gltf.scene;
    handcuff.scale.set(0.5, 0.5, 0.5);
    handcuff.position.set(-10, 0, -10);
    scene.add(handcuff);
    addFlickeringLight(handcuff); // Add flickering light
});

// load cleaver with flickering light
loader.load("./assets/models/3d_pbr_bloody_cleaver/scene.gltf", (gltf) => {
    const cleaver = gltf.scene;
    cleaver.scale.set(0.015625, 0.015625, 0.015625);
    cleaver.position.set(-24, 0, 8);
    scene.add(cleaver);
    addFlickeringLight(cleaver); // Add flickering light
});

// load revolver with flickering light
loader.load("./assets/models/revolver/scene.gltf", (gltf) => {
    const revolver = gltf.scene;
    revolver.scale.set(3.5, 3.5, 3.5);
    revolver.position.set(22, 1, -24);
    scene.add(revolver);
    addFlickeringLight(revolver); // Add flickering light
});

// Update animation states based on movement
function updateCharacterAnimation() {
    if (!mixer || !character) return;
    
    // Check if character is moving
    const isMoving = keys['w'] || keys['s'];
    
    // Switch between walk and idle animations
    if (isMoving && walkAction && activeAction !== walkAction) {
        // Transition to walk animation
        walkAction.reset().fadeIn(0.2);
        if (activeAction) {
            activeAction.fadeOut(0.2);
        }
        activeAction = walkAction;
        walkAction.play();
    } else if (!isMoving && idleAction && activeAction !== idleAction) {
        // Transition to idle animation
        idleAction.reset().fadeIn(0.2);
        if (activeAction) {
            activeAction.fadeOut(0.2);
        }
        activeAction = idleAction;
        idleAction.play();
    }
}



// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log('Clicked:', object);
    }
}

window.addEventListener('click', onMouseClick);

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Movement controls
//const keys = { w: false, a: false, s: false, d: false };
const moveSpeed = 0.8;

document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': 
            keys.w = true; 
            // If in first person, also set opposite key
            if (isFirstPerson) {
                keys.s = true;
                keys.w = false;
            }
            break;
        case 's': 
            keys.s = true;
            // If in first person, also set opposite key
            if (isFirstPerson) {
                keys.w = true;
                keys.s = false;
            }
            break;
        case 'a': keys.a = true; break;
        case 'd': keys.d = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': 
            keys.w = false;
            // If in first person, also set opposite key
            if (isFirstPerson) {
                keys.s = false;
            }
            break;
        case 's': 
            keys.s = false;
            // If in first person, also set opposite key
            if (isFirstPerson) {
                keys.w = false;
            }
            break;
        case 'a': keys.a = false; break;
        case 'd': keys.d = false; break;
    }
});

const groundLevel = 0; // Adjust if needed
const houseWidth = 50; // Width of the house
const houseDepth = 50; // Depth of the house
const houseHeight = 18; // Height of the house

function updateCameraPosition() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    if (keys.w) camera.position.addScaledVector(direction, moveSpeed);
    if (keys.s) camera.position.addScaledVector(direction, -moveSpeed);
    if (keys.a) {
        const left = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
        camera.position.addScaledVector(left, moveSpeed);
    }
    if (keys.d) {
        const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
        camera.position.addScaledVector(right, moveSpeed);
    }

    // Constrain camera position
    camera.position.y = Math.max(camera.position.y, groundLevel); // Prevent camera from going below ground level

    // Set camera constraints within the house boundaries
    setCameraConstraints(
        -houseWidth / 2, // Left boundary
        houseWidth / 2,  // Right boundary
        -houseDepth / 2, // Back boundary
        houseDepth / 2   // Front boundary
    );
}

// Update setCameraConstraints function if necessary
function setCameraConstraints(xMin, xMax, zMin, zMax) {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, xMin, xMax);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, zMin, zMax);
}

// Initialize scene
createLightingSystem();
const house = createHouse();
scene.add(house);



// Timer Setup
let countdownTime = 240000;  // 2 minutes in milliseconds
let timerInterval;

function updateTimer() {
    const remainingTime = countdownTime; // Use the countdownTime directly
    
    if (remainingTime > 0) {
        const minutes = Math.floor(remainingTime / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((remainingTime % 60000) / 1000).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `Time: ${minutes}:${seconds}`;
    } else if (remainingTime === 0)  {
        document.getElementById('timer').textContent = "Time: 00:00";
        clearInterval(timerInterval);
    
    }
}

const witnesses = {
    witness1: [
        { 
            question: "Where was suspect1 last night?", 
            response: "I saw them near the park.", 
            image: "witness1.jpg",
            reliability: 0.8,
            timeDelay: 2000,
            contradicts: null,
            stressLevel: 0.3
        },
        { 
            question: "Did suspect1 seem suspicious?", 
            response: "Yes, they were acting strangely.", 
            image: "witness1.jpg",
            reliability: 0.6,
            timeDelay: 3000,
            contradicts: "witness2.1",
            stressLevel: 0.5
        },
        { 
            question: "What was suspect1 wearing?", 
            response: "They had a dark jacket on.", 
            image: "witness1.jpg",
            reliability: 0.9,
            timeDelay: 1500,
            contradicts: null,
            stressLevel: 0.2
        }
    ],
    witness2: [
        { 
            question: "What was suspect2 doing?", 
            response: "They were having a heated argument.", 
            image: "witness2.jpg",
            reliability: 0.7,
            timeDelay: 2500,
            contradicts: null,
            stressLevel: 0.6
        },
        { 
            question: "Did you notice anyone with suspect2?", 
            response: "Yes, they were with a group.", 
            image: "witness2.jpg",
            reliability: 0.5,
            timeDelay: 4000,
            contradicts: "witness1.2",
            stressLevel: 0.8
        },
        { 
            question: "Where did suspect2 go afterward?", 
            response: "They left quickly after the argument.", 
            image: "witness2.jpg",
            reliability: 0.4,
            timeDelay: 3500,
            contradicts: "witness3.1",
            stressLevel: 0.7
        }
    ],
    witness3: [
        { 
            question: "Did you see suspect3 near the scene?", 
            response: "Yes, but they left in a hurry.", 
            image: "witness3.jpg",
            reliability: 0.6,
            timeDelay: 2800,
            contradicts: "witness2.3",
            stressLevel: 0.4
        },
        { 
            question: "Did suspect3 look nervous?", 
            response: "Definitely, they looked anxious.", 
            image: "witness3.jpg",
            reliability: 0.3,
            timeDelay: 3200,
            contradicts: null,
            stressLevel: 0.9
        },
        { 
            question: "Did you speak to suspect3?", 
            response: "No, but they avoided contact.", 
            image: "witness3.jpg",
            reliability: 0.8,
            timeDelay: 1800,
            contradicts: null,
            stressLevel: 0.5
        }
    ]
};

// function startTimer() {
//     timerInterval = setInterval(() => {
//         if (countdownTime > 0) {
//             countdownTime -= 1000; // Reduce by 1 second (1000 ms)
//            updateTimer();
//         } else {
//             clearInterval(timerInterval); // Stop the timer when it reaches zero
//             alert("Time's up!"); // Optional: Handle time-out scenario
//         }
//     }, 1000); // Run every 1 second
// }

document.addEventListener('DOMContentLoaded', () => {
    // Modal control
    const askButton = document.getElementById('ask-button');
    const modal = document.getElementById('questioning-modal');
    const closeModal = document.getElementById('close-modal');
    const viewSuspectListButton = document.getElementById('view-suspect-list-button');

    // Add view suspect list button handler
    viewSuspectListButton.addEventListener('click', () => {
        window.location.href = 'suspect.html';
    });

    askButton.addEventListener('click', () => {
        showWarning();
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.getElementById('response-container').style.display = 'none';
    });

    // Suspect button handling
    const suspectButtons = document.querySelectorAll('.suspect-btn');
    suspectButtons.forEach(button => {
        button.addEventListener('click', () => {
            suspectButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            someFunctionThatLoadsQuestions(button.dataset.suspect);
            document.getElementById('response-container').style.display = 'none';
        });
    });

    // Start the timer when the page loads
    startTimer();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('questioning-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
        document.getElementById('response-container').style.display = 'none';
    }
});

// Function to load questions based on the selected suspect
function someFunctionThatLoadsQuestions(suspect) {
    switch(suspect) {
        case 'suspect1':
            loadQuestions('witness1');
            break;
        case 'suspect2':
            loadQuestions('witness2');
            break;
        case 'suspect3':
            loadQuestions('witness3');
            break;
        default:
            console.error('Invalid suspect');
            const questionSection = document.getElementById('questionSection');
            questionSection.innerHTML = '<p>No valid suspect selected.</p>';
            break;
    }
}

const stressIndicators = [
    "appears calm and collected",
    "shows slight nervousness",
    "fidgets occasionally",
    "appears visibly stressed",
    "shows signs of extreme anxiety"
];

const bodyLanguageDescriptions = [
    "maintains steady eye contact",
    "avoids direct eye contact",
    "crosses arms defensively",
    "speaks with a trembling voice",
    "frequently touches face while speaking"
];

function animateResponse(witnessKey, questionIndex) {
    const response = witnesses[witnessKey][questionIndex];
    const responseContainer = document.getElementById('response-container');
    const witnessImage = document.getElementById('witnessImage');
    const responseText = document.getElementById('responseText');
    const stressIndicator = document.getElementById('stressIndicator');
    const bodyLanguage = document.getElementById('bodyLanguage');

    responseContainer.style.opacity = '0';
    responseContainer.style.display = 'block';

    setTimeout(() => {
        responseContainer.style.transition = 'opacity 0.5s ease-in-out';
        responseContainer.style.opacity = '1';
    }, 100);

    const stressLevel = Math.floor(response.stressLevel * (stressIndicators.length - 1));
    const bodyLanguageIndex = Math.floor(Math.random() * bodyLanguageDescriptions.length);

    setTimeout(() => {
        witnessImage.src = response.image;
    }, 500);

    let index = 0;
    responseText.textContent = '';
    
    function typeWriter() {
        if (index < response.response.length) {
            responseText.textContent += response.response.charAt(index);
            index++;
            setTimeout(typeWriter, 50);
        }
    }

    setTimeout(typeWriter, 1000);

    setTimeout(() => {
        stressIndicator.textContent = `Witness ${stressIndicators[stressLevel]}`;
        bodyLanguage.textContent = `Witness ${bodyLanguageDescriptions[bodyLanguageIndex]}`;
        stressIndicator.classList.add('visible');
        bodyLanguage.classList.add('visible');
    }, 2000);

    const timePenalty = Math.floor((1 - response.reliability) * 30000);
    countdownTime -= timePenalty;

    if (response.contradicts) {
        markContradiction(response.contradicts);
    }
}

function markContradiction(contradictionRef) {
    const logEntry = document.createElement('div');
    logEntry.className = 'contradiction-log';
    logEntry.textContent = `⚠️ Possible contradiction detected in testimony`;
    document.getElementById('investigation-log').appendChild(logEntry);
}

const questionedSuspects = new Set();
const questionsRemaining = {
    suspect1: true,
    suspect2: true,
    suspect3: true
};

function showWarning() {
    const warningMessage = document.getElementById('warning-message');
    warningMessage.classList.remove('hidden'); // Show the warning

    // Optionally hide the warning after a few seconds
    setTimeout(() => {
        warningMessage.classList.add('hidden'); // Hide the warning
    }, 3000); // Adjust time as needed (3000 ms = 3 seconds)
}

function initializeSuspectButtons() {
    const suspectButtonsContainer = document.getElementById('suspect-buttons');
    suspectButtonsContainer.innerHTML = '';

    const suspectButtons = document.querySelectorAll('.suspect-btn');
    
    suspectButtons.forEach(button => {
        const buttonClone = button.cloneNode(true);
        
        buttonClone.addEventListener('click', () => {
            const suspectId = buttonClone.dataset.suspect;
            
            if (questionsRemaining[suspectId]) {
                suspectButtons.forEach(btn => btn.classList.remove('active'));
                buttonClone.classList.add('active');
                loadQuestions(getSuspectWitness(suspectId));
                document.getElementById('response-container').style.display = 'none';
                document.querySelector('.question-limit-warning').style.display = 'none';
            } else {
                buttonClone.classList.add('shake');
                setTimeout(() => buttonClone.classList.remove('shake'), 500);
                
                const warning = document.querySelector('.question-limit-warning');
                warning.style.display = 'block';
                warning.textContent = 'You have already questioned this suspect!';
            }
        });

        suspectButtonsContainer.appendChild(buttonClone);
    });
}

function loadQuestions(witnessKey) {
    const questionSection = document.getElementById('questionSection');
    questionSection.innerHTML = '';

    const suspectId = witnessKey.replace('witness', 'suspect');
    
    if (!questionsRemaining[suspectId]) {
        questionSection.innerHTML = '<p>You have already questioned this suspect.</p>';
        return;
    }

    if (witnesses[witnessKey] && Array.isArray(witnesses[witnessKey])) {
        const container = document.createElement('div');
        container.className = 'questions-container';
        
        const warning = document.createElement('div');
        warning.className = 'question-limit-warning';
        container.appendChild(warning);

        witnesses[witnessKey].forEach((q, index) => {
            const button = document.createElement('button');
            button.className = 'question-btn';
            button.textContent = q.question;

            button.onclick = () => {
                if (!questionedSuspects.has(suspectId)) {
                    questionedSuspects.add(suspectId);
                    questionsRemaining[suspectId] = false;
                    
                    const suspectButton = document.querySelector(`[data-suspect="${suspectId}"]`);
                    suspectButton.classList.add('questioned');
                    
                    document.querySelectorAll('.question-btn').forEach(btn => {
                        btn.disabled = true;
                    });

                    showTimedResponse(witnessKey, index);
                    updateInvestigationProgress();
                }
            };

            container.appendChild(button);
        });

        questionSection.appendChild(container);
    }
}

function showTimedResponse(witnessKey, questionIndex) {
    const timeLimit = 10000;
    const response = witnesses[witnessKey][questionIndex];
    
    animateResponse(witnessKey, questionIndex);
    
    const timerBar = document.createElement('div');
    timerBar.className = 'question-timer';
    document.querySelector('.questions-container').appendChild(timerBar);
    
    let timeLeft = timeLimit;
    const timerInterval = setInterval(() => {
        timeLeft -= 100;
        const percentage = (timeLeft / timeLimit) * 100;
        timerBar.style.width = `${percentage}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('response-container').style.display = 'none';
            timerBar.remove();
        }
    }, 100);
}

function updateInvestigationProgress() {
    const totalSuspects = Object.keys(questionsRemaining).length;
    const questionedCount = questionedSuspects.size;
    
    const progressDisplay = document.getElementById('investigation-progress') || createProgressDisplay();
    progressDisplay.textContent = `Suspects Questioned: ${questionedCount}/${totalSuspects}`;
    
    if (questionedCount === totalSuspects) {
        showInvestigationSummary();
    }
}

function createProgressDisplay() {
    const progressDisplay = document.createElement('div');
    progressDisplay.id = 'investigation-progress';
    document.body.appendChild(progressDisplay);
    return progressDisplay;
}

function showInvestigationSummary() {
    const modal = document.createElement('div');
    modal.className = 'investigation-summary';
    modal.innerHTML = `
        <div class="summary-content">
            <h2>Investigation Complete!</h2>
            <p>You have questioned all available suspects.</p>
            <p>Time Remaining: ${document.getElementById('timer').textContent}</p>
            <button onclick="this.parentElement.parentElement.remove()">Close Summary</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function getSuspectWitness(suspectId) {
    return `witness${suspectId.replace('suspect', '')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSuspectButtons();
    createProgressDisplay();
});

// On-screen Controls
document.getElementById('up').addEventListener('mousedown', () => keys.w = true);
document.getElementById('left').addEventListener('mousedown', () => keys.a = true);
document.getElementById('down').addEventListener('mousedown', () => keys.s = true);
document.getElementById('right').addEventListener('mousedown', () => keys.d = true);

document.getElementById('up').addEventListener('mouseup', () => keys.w = false);
document.getElementById('left').addEventListener('mouseup', () => keys.a = false);
document.getElementById('down').addEventListener('mouseup', () => keys.s = false);
document.getElementById('right').addEventListener('mouseup', () => keys.d = false);

document.addEventListener('DOMContentLoaded', () => {
    const askButton = document.getElementById('ask-button');
    if (askButton) {
        askButton.disabled = true;
        askButton.style.opacity = '0.5';
        askButton.style.cursor = 'not-allowed';
    }
  const  viewSuspectListButton = document.getElementById('view-suspect-list-button');
    if (viewSuspectListButton) {
        viewSuspectListButton.disabled = true;
        viewSuspectListButton.style.opacity = '0.5';
        viewSuspectListButton.style.cursor = 'not-allowed';
    }
});


const hintButton = document.getElementById('hint-button');
const DEBUG = true;
let currentClueIndex=0;
function debugLog(message) {
    if (DEBUG) {
        console.log(`[Debug] ${message}`);
    }
}

// Validate clues array on load
function validateClues() {
    if (!Array.isArray(clues)) {
        console.error('Clues is not an array!');
        return false;
    }
    
    if (clues.length === 0) {
        console.error('Clues array is empty!');
        return false;
    }

    // Validate each clue has required properties
    return clues.every((clue, index) => {
        const hasRequiredProps = clue 
            && typeof clue.model === 'string'
            && clue.position 
            && typeof clue.radius === 'number';
            
        if (!hasRequiredProps) {
            console.error(`Invalid clue at index ${index}:`, clue);
        }
        return hasRequiredProps;
    });
}

const penaltyTime = 15000; // 15 seconds penalty in milliseconds

function checkClueProximity() {
    if (!character || !Array.isArray(clues) || clues.length === 0) return;

    const currentClue = clues[currentClueIndex];
    let nearestClue = null;
    let minDistance = Infinity;
    let isCorrectClue = false;

    // Find the nearest clue
    clues.forEach((clue) => {
        if (!clue || !clue.position || !clue.model) return;

        const distance = character.position.distanceTo(clue.position);
        if (distance < minDistance && distance <= (clue.radius || 3)) {
            minDistance = distance;
            nearestClue = clue;
            isCorrectClue = clue.model === currentClue.model; // Check if this is the correct clue
        }
    });

    const hintButton = document.getElementById('hint-button');
    if (nearestClue) {
        // Show hint button and set up click event
        hintButton.style.display = 'block';
        hintButton.onclick = () => handleHintClick(nearestClue, isCorrectClue);
    } else {
        hintButton.style.display = 'none';
        hintButton.onclick = null;
    }
}

function handleHintClick(clue, isCorrectClue) {
    if (isCorrectClue) {
        console.log(`Correct clue found: ${clue.model}`);
        showEvidenceModal(clue);
        currentClueIndex++; // Move to the next clue in sequence

        // Check if this is the last clue
        if (currentClueIndex >= clues.length) {
            enableAskAndViewButtons(); // Enable the "Ask" and "View Suspect List" buttons
        }
    } else {
        console.log(`Wrong clue selected: ${clue.model} - Applying 15-second penalty.`);
        countdownTime = Math.max(0, countdownTime - penaltyTime); // Deduct 15 seconds
        updateTimer(); // Update the timer display
        showKillerMessage(); // Show the killer message
    }
}

 function enableAskAndViewButtons() {
    const askButton = document.getElementById('ask-button');
    const viewSuspectListButton = document.getElementById('view-suspect-list-button');

     if (askButton) {
         askButton.disabled = false;
        askButton.style.opacity = '1';
         askButton.style.cursor = 'pointer';
  }

     if (viewSuspectListButton) {
        viewSuspectListButton.disabled = false; 
                viewSuspectListButton.style.opacity = '1';
         viewSuspectListButton.style.cursor = 'pointer';
     }
 }



function showKillerMessage() {
    const killerMessage = document.getElementById("killerMessage");
    const closeMessage = document.getElementById("closeMessage");
    const killerText = document.getElementById("killerText");

    // Set a random message each time
    const messages = [
        "You think you're clever? But you're just wasting your time...",
        "Close, but not close enough... Try harder, or end up like the others.",
        "Do you really think you're safe? Guess again...",
        "You’re just another fool walking right into my hands...",
        "Tick-tock... Every second brings you closer to the end."
    ];
    killerText.innerText = messages[Math.floor(Math.random() * messages.length)];

    // Show the modal
    killerMessage.style.display = "flex";

    // Close modal on button click
    closeMessage.onclick = () => {
        killerMessage.style.display = "none";
    };
}
function restartGame() {
    // Reset countdown timer
    countdownTime = 120000; // Set back to 2 minutes or initial time in milliseconds
    updateTimer(); // Immediately update the displayed timer
    
    // Reset game state variables
    currentClueIndex = 0;
    gameEnded = false;
    
    // Hide failure popup and other UI elements
    document.getElementById("gameOverPopupFail").style.display = "none";
    document.getElementById("ask-button").disabled = true;
    document.getElementById("view-suspect-list-button").disabled = true;
    document.getElementById("ask-button").style.opacity = '0.5';
    document.getElementById("view-suspect-list-button").style.opacity = '0.5';

    // Reset clues and progress indicators
    resetClues();
    resetProgressIndicator();

    // Re-enable controls if they were disabled
    enableControls();

    // Restart the timer
    clearInterval(timerInterval); // Clear any existing timer
    startTimer();
}

function resetClues() {
    // Logic to reset clues to their original state
    cluesSolved = 0;
    // Reset visibility or other clue properties if needed
}

function resetProgressIndicator() {
    const progressElement = document.getElementById('progress-indicator');
    const progressBar = document.getElementById('progress-bar');
    if (progressElement) progressElement.textContent = `Evidence Found: 0/${clues.length}`;
    if (progressBar) progressBar.style.width = '0%';
}

function enableControls() {
    // Logic to re-enable character movement and interactions
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("click", handleClick);
}




// CSS for penalty feedback animation
const style = document.createElement('style');
style.textContent = `
    .penalty-flash {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 5px;
        font-size: 24px;
        transition: opacity 1s;
        pointer-events: none;
        z-index: 1000;
    }
`;
document.head.appendChild(style);
const clueSound = new Audio("alarm.ogg");
const backgroundMusic = new Audio("Dark Intro.ogg");
const successSound = new Audio("audio/success.mp3");
const failSound = new Audio("audio/fail.mp3");

// Start background music
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Adjust as needed
backgroundMusic.play();

// Validate clues when the script loads
if (!validateClues()) {
    console.error('Clues validation failed! Game may not work properly.');
}

const level2Thoughts = [
    "That flickering light can't be good... Should I trust it?",
    "I need to focus; every wrong clue costs me time!",
    "This doesn't feel right. Am I being led astray?",
    "The clock is ticking, and I'm running out of options!",
    "Which suspect should I trust? This is getting complicated.",
    "That clue has a red light... Is it a trap?",
    "I can't afford to waste any more time on wrong leads.",
    "I hope my instincts are right about this one.",
    "There’s something off about that clue…",
    "Every second counts. I must find the primary suspect!"
];


function getRandomLevel2Thought() {
    const randomIndex = Math.floor(Math.random() * level2Thoughts.length);
    return level2Thoughts[randomIndex];
}
 

function displayLevel2Thought() {
    const thought = getRandomLevel2Thought();
    const thoughtDisplay = document.getElementById('thoughtDisplay');
    thoughtDisplay.textContent = thought;

    // Apply fade-in animation
    thoughtDisplay.style.animation = 'fadeIn 0.8s forwards';
    thoughtDisplay.style.opacity = '1'; // Ensure it's visible

    // Clear the thought after a few seconds and apply fade-out animation
    setTimeout(() => {
        thoughtDisplay.style.animation = 'fadeOut 0.8s forwards'; // Apply fade-out animation
        thoughtDisplay.style.opacity = '0'; // Set to hidden

        // Clear the text after fading out
        setTimeout(() => {
            thoughtDisplay.textContent = ''; // Clear the thought text
        }, 500); // Wait for fade-out to complete
    }, 6000); // Display for 3 seconds
}


function startRandomThoughts() {
    const totalDuration = 240000; // 4 minutes in milliseconds
    const thoughtInterval = 10000; // Interval in milliseconds (5 seconds)

    // Calculate how many thoughts can be displayed in 4 minutes
    const maxThoughts = Math.floor(totalDuration / thoughtInterval);

    // Use an index to track how many thoughts have been displayed
    let displayedThoughts = 0;

    const intervalId = setInterval(() => {
        if (displayedThoughts < maxThoughts) {
            displayLevel2Thought();
            displayedThoughts++;
        } else {
            clearInterval(intervalId); // Stop after the max thoughts
        }
    }, thoughtInterval);
}


function restoreGameState() {
    if (sessionStorage.getItem("countdownTime")) {
        countdownTime = parseInt(sessionStorage.getItem("countdownTime"));
        currentClueIndex = parseInt(sessionStorage.getItem("currentClueIndex"));
        cluesSolved = JSON.parse(sessionStorage.getItem("cluesSolved"));
        
        updateTimer(); // Update the timer display
        updateClueProgress(); // Function to reflect progress on UI
    }
}

document.addEventListener('DOMContentLoaded', restoreGameState);

function handleWrongClueInteraction() {
    countdownTime = Math.max(0, countdownTime - 15000); // Deduct 15 seconds
    updateTimer();
    if (countdownTime <= 0) {
        endGame(false); // End game if time runs out
    }
}




const cameraController = new ThirdPersonCamera(camera, character);
// Timer Update Function
cameraController.setOffset(0, 2, 4); // Adjust x,y,z to change camera position
cameraController.setLookAtOffset(0, 1, 0); // Adjust where camera looks
cameraController.setSmoothness(0.3); // Higher = smoother but more lag
// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (character) {
        // Move character using the imported moveCharacter function
        moveCharacter(
            camera,
            keys,
            character,
            isFirstPerson,
            HOUSE_GROUND_LEVEL,
            HOUSE_UPPER_FLOOR_LEVEL,
            characterSpeedMain2
        );
        
        // Update character animations
        updateCharacterAnimation();
        updateCamera();
        // Update camera position in third-person mode
        // if (!isFirstPerson) {
        //     // Adjust these values to bring the camera closer to the player
        //     const cameraOffset = new THREE.Vector3(5, 5, 12); // Closer values for zoom effect
        //     const targetPosition = character.position.clone().add(cameraOffset);
        //     camera.position.lerp(targetPosition, 0.1);
        //     camera.lookAt(character.position);
        // }
        
    }
    if(!isFirstPerson) {
        cameraController.update(delta);
    }
    // Update animation mixer
    if (mixer) {
        mixer.update(delta);
    }
    checkClueProximity()
    renderer.render(scene, camera);
}


function endGame(success) {
    clearInterval(timerInterval);
    if (!success) {
        showFailPopup();
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        countdownTime -= 1000;
        updateTimer();
        if (countdownTime <= 0) {
            endGame(false); // Trigger fail popup if time runs out
        }
    }, 1000);
}

function showFailPopup() {
    document.getElementById("gameOverPopupFail").style.display = "flex";
}

// Restart functionality


// function updateTimerDisplay() {
//     const minutes = Math.floor(countdownTime / 60000).toString().padStart(2, '0');
//     const seconds = Math.floor((countdownTime % 60000) / 1000).toString().padStart(2, '0');
//     document.getElementById('timer').textContent = `Time: ${minutes}:${seconds}`;
// }
// Ensure the DOM is fully loaded before adding event listeners
document.getElementById("failRestartButton").addEventListener("click", () => {
    location.reload();
});

animate();
startRandomThoughts();
updateTimer();
   