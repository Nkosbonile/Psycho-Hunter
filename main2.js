import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createCharacter, moveCharacter } from "./character.js";

let character;
let mixer;
let walkAction;
let idleAction;
let pickUpAction;
let activeAction;

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

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
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
        color: textureLoader.load('w2.webp'),
        normal: textureLoader.load('w2.webp'),
        roughness: textureLoader.load('w2.webp')
    },
    wood: {
        color: textureLoader.load('wood_color.jpg'),
        normal: textureLoader.load('wood_color.jpg'),
        roughness: textureLoader.load('wood_roughness.jpg')
    },
    roof: {
        color: textureLoader.load('roof.jpg'),
        normal: textureLoader.load('roof.jpg')
    },
    floor: {
        color: textureLoader.load('tile.jpeg'),
        normal: textureLoader.load('tile.jpeg'),
        roughness: textureLoader.load('floor.jpg')
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
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Sunlight
    const sunLight = new THREE.DirectionalLight(0xffffeb, 1.0);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // Interior lights
    const rooms = [
        { x: -15, z: 0 },
        { x: 15, z: 0 }
    ];

    rooms.forEach(pos => {
        const light = new THREE.PointLight(0xfff2e6, 0.8, 30);
        light.position.set(pos.x, 10, pos.z);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        scene.add(light);
    });
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

// Function to update camera based on perspective mode
function updateCameraMode() {
    if (isFirstPerson && character) {
        // Adjust this headOffset to position the camera at the character's head level
        const headOffset = 60; // Example offset; adjust based on character height
        camera.position.copy(character.position);
        camera.position.y += headOffset; // Moves the camera up to head level
        console.log("Camera Position:", camera.position);
        camera.rotation.copy(character.rotation);
    } else {
        // Reset to third-person view
        camera.position.set(12, 14, 18);
        camera.lookAt(5, 5, 5);
    }
}

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
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
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

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (character && camera) {
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
        
        // Update camera position in third-person mode
        if (!isFirstPerson) {
            // Adjust these values to bring the camera closer to the player
            const cameraOffset = new THREE.Vector3(5, 5, 12); // Closer values for zoom effect
            const targetPosition = character.position.clone().add(cameraOffset);
            camera.position.lerp(targetPosition, 0.1);
            camera.lookAt(character.position);
        }
        
    }
    
    // Update animation mixer
    if (mixer) {
        mixer.update(delta);
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate();