import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createCharacter, moveCharacter } from "./character.js";
import { ThirdPersonCamera } from './thirdPersonCamera.js';




const clock = new THREE.Clock();
let character;
let mixer;
let walkAction;
let idleAction;
let pickUpAction;
let activeAction;
let isFirstPerson = false;
// Add these camera configuration constants at the top with other constants
const THIRD_PERSON_OFFSET = new THREE.Vector3(0, 5, -14); // Camera position relative to character
const FIRST_PERSON_OFFSET = new THREE.Vector3(0, 10, 0.1); // Roughly eye level
const CAMERA_LERP_FACTOR = 0.1; // How smoothly the camera follows (0-1)
const HOUSE_GROUND_LEVEL = 0;
const HOUSE_UPPER_FLOOR_LEVEL = 10;


// Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);
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
const characterSpeedMain2 = 0.8;  // Different speed for character in main2.js
// Modified texture loading


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

const restartStyles = `
.restart-button {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 15px 30px;
    background-color: #ff0000;
    color: #000;
    border: 2px solid #990000;
    font-family: 'Courier New', monospace;
    font-size: 24px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    z-index: 2000;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
    70% { box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
}

.restart-button:hover {
    background-color: #990000;
    color: #fff;
    transform: translate(-50%, -50%) scale(1.1);
    transition: all 0.3s ease;
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = restartStyles;
document.head.appendChild(styleSheet);

// Create the restart button
const restartButton = document.createElement('button');
restartButton.className = 'restart-button';
restartButton.textContent = 'RESTART INVESTIGATION';
restartButton.style.display = 'none';
document.body.appendChild(restartButton);

// Add click handler for restart
restartButton.addEventListener('click', () => {
    location.reload();
});

function createLightingSystem() {
    // Track all lights for dimming
    const allLights = {
        ambient: null,
        directional: null,
        points: [],
        spot: null,
        hemisphere: null
    };

    // Increased ambient light with warmer tint
    const ambientLight = new THREE.AmbientLight(0x996666, 0.6);
    scene.add(ambientLight);
    allLights.ambient = ambientLight;

    // Main directional light with softer red tint
    const sunLight = new THREE.DirectionalLight(0xff6666, 0.8);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    allLights.directional = sunLight;

    // Create all house lights with unified color scheme
    const pointLightPositions = [
        { x: 0, y: 15, z: 0, color: 0xff6666, intensity: 1.8 },
        { x: -15, y: 10, z: 15, color: 0xff6666, intensity: 1.8 },
        { x: 15, y: 10, z: 15, color: 0xff6666, intensity: 1.8 },
        { x: 0, y: 10, z: -15, color: 0xff6666, intensity: 1.8 },
        { x: -25, y: 12, z: 0, color: 0xff6666, intensity: 1.8 },
        { x: 25, y: 12, z: 0, color: 0xff6666, intensity: 1.8 },
        { x: 0, y: 12, z: 25, color: 0xff6666, intensity: 1.8 },
        { x: 0, y: 12, z: -25, color: 0xff6666, intensity: 1.8 }
    ];

    pointLightPositions.forEach((pos) => {
        const light = new THREE.PointLight(pos.color, pos.intensity, 40);
        light.position.set(pos.x, pos.y, pos.z);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        scene.add(light);
        allLights.points.push(light);
    });

    // Unified spotlight
    const spotlight = new THREE.SpotLight(0xff4d4d, 1.7);
    spotlight.position.set(0, 30, 0);
    spotlight.angle = Math.PI / 3.5;
    spotlight.penumbra = 0.2;
    spotlight.decay = 1.3;
    spotlight.distance = 60;
    spotlight.castShadow = true;
    scene.add(spotlight);
    allLights.spot = spotlight;

    // Warmer ground light
    const groundLight = new THREE.HemisphereLight(
        0xff8080,
        0x664444,
        0.6
    );
    scene.add(groundLight);
    allLights.hemisphere = groundLight;

    // Timer variables
    const totalDuration = 3* 60 * 1000; // 5 minutes in milliseconds
    const interval = 15 * 1000; // 15 seconds between dims
    const totalSteps = totalDuration / interval;
    let currentStep = 0;
    let timerStarted = false;


    // Initial intensities
    const initialIntensities = {
        ambient: ambientLight.intensity,
        directional: sunLight.intensity,
        points: pointLightPositions.map(p => p.intensity),
        spot: spotlight.intensity,
        hemisphere: groundLight.intensity
    };

    // Dimming function
    function dimLights() {
        if (currentStep >= totalSteps) {
            console.log("Timer complete - lights at minimum");
            return;
        }

        const dimFactor = Math.max(0.3, 1 - (currentStep / totalSteps));
        
        // Dim all lights proportionally
        allLights.ambient.intensity = initialIntensities.ambient * dimFactor;
        allLights.directional.intensity = initialIntensities.directional * dimFactor;
        allLights.points.forEach((light, index) => {
            light.intensity = initialIntensities.points[index] * dimFactor;
        });
        allLights.spot.intensity = initialIntensities.spot * dimFactor;
        allLights.hemisphere.intensity = initialIntensities.hemisphere * dimFactor;

        currentStep++;
        
        // Schedule next dimming
        if (currentStep < totalSteps) {
            setTimeout(dimLights, interval);
        }
    }
    function startTimer(duration, display) {
        let timer = duration;
    timerStarted = true;
    
    // Start the dimming process
    dimLights();
    
    const countdown = setInterval(function () {
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);

        display.textContent = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

        if (--timer < 0) {
            clearInterval(countdown);
            display.textContent = "TIME'S UP";
            display.style.animation = "flicker 0.5s infinite";
            
            // Show restart button with dramatic effect
            restartButton.style.display = 'block';
            
            // Optional: Add a dark overlay to emphasize the game over state
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1999;
                animation: fadeIn 1s ease;
            `;
            document.body.appendChild(overlay);
        }
    }, 1000);
    }
    const fadeAnimation = `
    @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
styleSheet.textContent += fadeAnimation;
    // Flicker effect modified to work with dimming
    function flickerHouseLights() {
        if (!timerStarted) return;

        const dimFactor = 1 - (currentStep / totalSteps);
        const globalFlicker = Math.random();
        const globalIntensityMod = 
            globalFlicker < 0.1 ? 0.4 :
            globalFlicker < 0.2 ? 0.7 :
            globalFlicker < 0.3 ? 1.3 :
            1.0;

        allLights.points.forEach((light, index) => {
            const individualVar = 0.8 + Math.random() * 0.4;
            const baseIntensity = initialIntensities.points[index] * dimFactor;
            const finalIntensity = baseIntensity * globalIntensityMod * individualVar;
            light.intensity = Math.max(0.2, Math.min(2.5, finalIntensity));

            const hue = 0.02 + Math.random() * 0.02;
            const saturation = 0.7 + Math.random() * 0.2;
            const lightness = 0.4 + Math.random() * 0.3;
            light.color.setHSL(hue, saturation, lightness);
        });

        allLights.spot.intensity = initialIntensities.spot * dimFactor * globalIntensityMod;

        setTimeout(flickerHouseLights, Math.random() * 150 + 50);
    }

    // Start both timer and flicker effects
    const fiveMinutes = 60 * 3;
    const display = document.querySelector('#timer');
    startTimer(fiveMinutes, display);
    flickerHouseLights();

    return allLights;
}

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
        metalness: 0.0
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

function createDoor(width, height, thickness) {
    const doorGroup = new THREE.Group();
    
    // Door frame
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.4, height + 0.4, thickness + 0.2),
        materials.wood
    );
    doorGroup.add(frame);

    // Door (slightly smaller than frame)
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, thickness),
        materials.door
    );
    
    // Position door to swing from one edge
    door.position.x = width / 2;
    door.rotation.y = Math.PI / 4; // Open at 45 degrees
    
    doorGroup.add(door);
    
    return doorGroup;
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
    const doorWidth = 4;
    const doorHeight = 8;

    // Modified Wall Creation Function - Now doesn't create door gaps in exterior walls
    function createWallWithWindows(width, height, depth, windowConfig, isExterior = true) {
        const wallGroup = new THREE.Group();

        // Create a solid wall regardless of door status for exterior walls
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

    // Exterior Walls - All solid now
    const frontWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: -15, y: 5 },
        { width: 4, height: 6, x: 15, y: 5 }
    ]);
    frontWall.position.set(0, wallHeight / 2, 25);
    house.add(frontWall);

    const backWall = createWallWithWindows(50, wallHeight, wallThickness, [
        { width: 4, height: 6, x: -15, y: 5 },
        { width: 4, height: 6, x: 15, y: 5 }
    ]);
    backWall.position.set(0, wallHeight / 2, -25);
    house.add(backWall);

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

    // Interior Walls with Doorframes
    function createDoorframe(width, height, depth) {
        const frame = new THREE.Group();
        
        // Top of doorframe
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.5, depth),
            materials.wood
        );
        top.position.y = height;
        frame.add(top);
        
        // Left side of doorframe
        const left = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, height, depth),
            materials.wood
        );
        left.position.set(-width/2 + 0.25, height/2, 0);
        frame.add(left);
        
        // Right side of doorframe
        const right = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, height, depth),
            materials.wood
        );
        right.position.set(width/2 - 0.25, height/2, 0);
        frame.add(right);
        
        return frame;
    }

    // Interior Walls - Modified to ensure proper connections
    const horizontalWallLength = 25;
    
    // Left section wall (extend to meet vertical wall)
    const leftHorizontalWall = new THREE.Mesh(
        new THREE.BoxGeometry((horizontalWallLength - doorWidth)/2, wallHeight, wallThickness),
        materials.walls
    );
    leftHorizontalWall.position.set(-horizontalWallLength/2 - doorWidth/4, wallHeight/2, 0);
    house.add(leftHorizontalWall);
    
    // Right section of left wall
    const leftHorizontalWall2 = new THREE.Mesh(
        new THREE.BoxGeometry((horizontalWallLength - doorWidth)/2, wallHeight, wallThickness),
        materials.walls
    );
    leftHorizontalWall2.position.set(-horizontalWallLength/4, wallHeight/2, 0);
    house.add(leftHorizontalWall2);
    
    // Left doorframe
    const leftDoorframe = createDoorframe(doorWidth, doorHeight, wallThickness);
    leftDoorframe.position.set(-12.5, 0, 0);
    house.add(leftDoorframe);
    
    // Right section wall (extend to meet vertical wall)
    const rightHorizontalWall = new THREE.Mesh(
        new THREE.BoxGeometry((horizontalWallLength - doorWidth)/2, wallHeight, wallThickness),
        materials.walls
    );
    rightHorizontalWall.position.set(horizontalWallLength/2 + doorWidth/4, wallHeight/2, 0);
    house.add(rightHorizontalWall);
    
    // Left section of right wall
    const rightHorizontalWall2 = new THREE.Mesh(
        new THREE.BoxGeometry((horizontalWallLength - doorWidth)/2, wallHeight, wallThickness),
        materials.walls
    );
    rightHorizontalWall2.position.set(horizontalWallLength/4, wallHeight/2, 0);
    house.add(rightHorizontalWall2);
    
    // Right doorframe
    const rightDoorframe = createDoorframe(doorWidth, doorHeight, wallThickness);
    rightDoorframe.position.set(12.5, 0, 0);
    house.add(rightDoorframe);

    // Vertical wall sections (extended to meet horizontal walls)
    const verticalWallLength = 25;
    
    // Upper section
    const upperVerticalWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, (verticalWallLength - doorWidth)/2),
        materials.walls
    );
    upperVerticalWall.position.set(0, wallHeight/2, verticalWallLength/2 + doorWidth/4);
    house.add(upperVerticalWall);
    
    // Lower section
    const lowerVerticalWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, (verticalWallLength - doorWidth)/2),
        materials.walls
    );
    lowerVerticalWall.position.set(0, wallHeight/2, -verticalWallLength/4);
    house.add(lowerVerticalWall);
    
    // Vertical doorframe
    const verticalDoorframe = createDoorframe(doorWidth, doorHeight, wallThickness);
    verticalDoorframe.rotation.y = Math.PI/2;
    verticalDoorframe.position.set(0, 0, 12.5);
    house.add(verticalDoorframe);

    // Rest of the house components remain the same
    // Roof
    const roofHeight = 8;
    const roofGeometry = new THREE.ConeGeometry(35, roofHeight, 4);
    const roof = new THREE.Mesh(roofGeometry, materials.roof);
    roof.position.y = wallHeight + roofHeight / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Furniture
    const furniture = [
        // Living Room (Front Right)
        { type: 'sofa', pos: [15, 1.5, 15], size: [8, 3, 4], rot: Math.PI },
        { type: 'coffeeTable', pos: [15, 1, 10], size: [4, 1.5, 3], rot: 0 },
        { type: 'tvStand', pos: [22, 2, 15], size: [1, 3, 8], rot: 0 },
        
        // Bedroom (Front Left)
        { type: 'bed', pos: [-15, 1.5, 15], size: [8, 2, 6], rot: Math.PI / 2 },
        { type: 'dresser', pos: [-22, 2, 15], size: [1, 4, 6], rot: 0 },
        { type: 'nightstand', pos: [-19, 1, 18], size: [2, 2, 2], rot: 0 },
        
        // Study Room (Back)
        { type: 'desk', pos: [0, 2, -15], size: [7, 2.5, 3], rot: 0 },
        { type: 'bookshelf', pos: [-22, 5, -15], size: [1, 10, 8], rot: 0 },
        { type: 'chair', pos: [0, 2, -12], size: [2, 3, 2], rot: 0 },
        { type: 'bookshelf', pos: [22, 5, -15], size: [1, 10, 8], rot: 0 }
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

    // Carpets with different colors
    const carpets = [
        { pos: [-15, 0.01, 15], radius: 6, color: 0x8B4513 },  // Bedroom - Brown
        { pos: [15, 0.01, 15], radius: 6, color: 0x4B0082 },   // Living Room - Indigo
        { pos: [0, 0.01, -15], radius: 8, color: 0x006400 }    // Study Room - Dark Green
    ];

    carpets.forEach(carpet => {
        const mesh = new THREE.Mesh(
            new THREE.CircleGeometry(carpet.radius, 32),
            new THREE.MeshStandardMaterial({
                color: carpet.color,
                roughness: 0.8,
                metalness: 0.1
            })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(...carpet.pos);
        mesh.receiveShadow = true;
        house.add(mesh);
    });
 // Main entrance door (solid, attached to front wall)
 const mainDoor = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, wallThickness/2),
    materials.wood
);
mainDoor.position.set(0, doorHeight/2, 25 - wallThickness/4);
house.add(mainDoor);

// Main entrance doorframe
const mainDoorframe = createDoorframe(doorWidth + 0.5, doorHeight + 0.25, wallThickness);
mainDoorframe.position.set(0, 0, 25);
house.add(mainDoorframe);

return house;
}
const house = createHouse();
scene.add(house);

const loader = new GLTFLoader();


const furniturePositions = {
    coffeeTable: { 
        x: 15, 
        y: 2.5,  // 1.0 (table height) + 1.5 (object placement height)
        z: 10 
    },
    nightstand: {
        x: 0,  // From the original createHouse function
        y: 2,    // 2 (nightstand height) + 1 (object placement height)
        z: -12    // From the original createHouse function
    },
    brownCarpet: {
        x: -15,  // Bedroom area (brown carpet)
        y: 2.5,  // Height of table + offset for object
        z: 15
    }
};

function loadModelWithSpotlight(modelPath, position, rotation = 0, scale = 1) {
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        
        // Apply position, rotation and scale
        model.position.set(position.x, position.y, position.z);
        model.rotation.y = rotation;
        model.scale.set(scale, scale, scale);
        
        // Enable shadows for all meshes in the model
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // Optimize materials
                const material = node.material;
                material.normalMap = null;
                material.roughnessMap = null;
                material.aoMap = null;
                material.needsUpdate = true;
            }
        });
        
        // Add model to scene
        scene.add(model);
        
        // Create spotlight for the model
        const spotlight = new THREE.SpotLight(0xffffff, 2.0);
        spotlight.position.set(
            position.x,
            position.y + 5, // Increased height for better illumination
            position.z
        );
        
        spotlight.target = model;
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.3;
        spotlight.distance = 15; // Increased distance for better coverage
        spotlight.decay = 2;
        spotlight.castShadow = true;
        
        // Configure shadow properties
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;
        spotlight.shadow.camera.near = 0.5;
        spotlight.shadow.camera.far = 20; // Increased far plane for shadows
        
        scene.add(spotlight);
        scene.add(spotlight.target);
        
        console.log(`Model loaded successfully at position:`, position);
    },
    undefined,
    (error) => console.error('Error loading model:', error));
}

// // Load the bloody glasses on the coffee table
// loadModelWithSpotlight(
//     "./assets/models/international_military_police_badge/scene.gltf",
//     {
//         x: furniturePositions.coffeeTable.x-2,
//         y: furniturePositions.coffeeTable.y,
//         z: furniturePositions.coffeeTable.z
//     },
//     Math.PI / 4,  // Slight rotation for natural placement
//     4.0          // Adjusted scale for better proportions
// );

// // Place military hat on the black carpet in living room
// loadModelWithSpotlight(
//     "./assets/models/plastic_evidence_bag/scene.gltf",
//     {
//         x: furniturePositions.nightstand.x,
//         y: furniturePositions.nightstand.y+2,
//         z: furniturePositions.nightstand.z
//     },
//     Math.PI / 4,  // Slight rotation for natural placement
//     0.06          // Kept the small scale for the evidence bag
// );

// // Place book on the table in bedroom (brown carpet area)
// loadModelWithSpotlight(
//     "./assets/models/330book_morales_danny/scene.gltf",
//     {
//         x: furniturePositions.brownCarpet.x,
//         y: furniturePositions.brownCarpet.y,
//         z: furniturePositions.brownCarpet.z
//     },
//     Math.PI / 6,  // Slight angle for natural placement
//     1.5          // Adjusted scale to look natural on table
// );


const cluePositions = {
    plastic_evidence: new THREE.Vector3(
        furniturePositions.nightstand.x,
        furniturePositions.nightstand.y + 2,
        furniturePositions.nightstand.z
    ),
    police_badge: new THREE.Vector3(
        furniturePositions.coffeeTable.x - 2,
        furniturePositions.coffeeTable.y,
        furniturePositions.coffeeTable.z
    ),
    book: new THREE.Vector3(
        furniturePositions.brownCarpet.x,
        furniturePositions.brownCarpet.y+0.6,
        furniturePositions.brownCarpet.z
    )
};
function loadClues() {
    const loader = new GLTFLoader();
    
    // Load plastic evidence bag
    loader.load('./assets/models/plastic_evidence_bag/scene.gltf', (gltf) => {
        const model = gltf.scene;
        model.position.copy(cluePositions.plastic_evidence);
        model.scale.set(0.06, 0.06, 0.06);
        scene.add(model);
    });

    // Load police badge
    loader.load('./assets/models/international_military_police_badge/scene.gltf', (gltf) => {
        const model = gltf.scene;
        model.position.copy(cluePositions.police_badge);
        model.scale.set(4.0, 4.0, 4.0);
        scene.add(model);
    });

    // Load book
    loader.load('./assets/models/330book_morales_danny/scene.gltf', (gltf) => {
        const model = gltf.scene;
        model.position.copy(cluePositions.book);
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
    });
}
// Remove or comment out the original loader.load calls that were commented out
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
const keys = { w: false, a: false, s: false, d: false };


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

    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.crossVectors(camera.up, direction).normalize();

    if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(right, moveSpeed);

    // Boundaries for house dimensions
    const halfWidth = houseWidth / 2;
    const halfDepth = houseDepth / 2;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -halfWidth, halfWidth);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -halfDepth, halfDepth);
    camera.position.y = Math.max(camera.position.y, groundLevel); // Prevent sinking below the floor
}

// Update setCameraConstraints function if necessary
function setCameraConstraints(xMin, xMax, zMin, zMax) {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, xMin, xMax);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, zMin, zMax);
}

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
const cameraController = new ThirdPersonCamera(camera, character);
// Timer Update Function
cameraController.setOffset(0, 2, 4); // Adjust x,y,z to change camera position
cameraController.setLookAtOffset(0, 1, 0); // Adjust where camera looks
cameraController.setSmoothness(0.3); // Higher = smoother but more lag
// Initialize scene
createLightingSystem();

// Animation Loop
const clueHints = {
    plastic_evidence: "DNA analysis results show contamination with lab-grade chemicals. Only someone with access to the crime lab could have handled this evidence.",
    police_badge: "The badge shows signs of tampering - serial numbers have been carefully altered. This requires intimate knowledge of police identification systems.",
    book: "A forensics textbook with specific pages on evidence contamination marked. Recent access logs show it was checked out from the department library."
};
const gameState = {
    hintsRemaining: 1,
    cluesFound: {
        plastic_evidence: false,
        police_badge: false,
        book: false
    },
    proximityThreshold: 8,
    activeClue: null,
    gameStarted: false
};

const warningModalHTML = `
<div id="warning-modal" class="modal">
    <div class="modal-content">
        <h2 class="flicker">⚠ WARNING ⚠</h2>
        <p>You can only examine ONE piece of evidence in this investigation.</p>
        <p>Choose wisely. This decision cannot be undone.</p>
        <div class="warning-buttons">
            <button id="proceed-hint" class="warning-btn">Examine Evidence</button>
            <button id="cancel-hint" class="warning-btn">Wait</button>
        </div>
    </div>
</div>
`;

// Add these styles to your CSS
const warningStyles = `
.warning-buttons {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
    gap: 20px;
}

.warning-btn {
    padding: 10px 20px;
    background-color: #1a0000;
    color: #ff0000;
    border: 2px solid #ff0000;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
}

.warning-btn:hover {
    background-color: #ff0000;
    color: #000;
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
}

#warning-modal h2 {
    color: #ff0000;
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    text-shadow: 0 0 10px #ff0000;
}

#warning-modal p {
    text-align: center;
    margin: 10px 0;
    font-size: 18px;
    line-height: 1.5;
}
`;

function createUIElements() {
    // Create hint button
    const hintButton = document.createElement('button');
    hintButton.className = 'hint-button';
    hintButton.textContent = 'Examine Clue';
    hintButton.style.display = 'none';
    hintButton.addEventListener('click', showHint);
    document.body.appendChild(hintButton);

    // Create hint modal if it doesn't exist
    if (!document.getElementById('hint-modal')) {
        const hintModal = document.createElement('div');
        hintModal.id = 'hint-modal';
        hintModal.className = 'hint-modal';
        hintModal.innerHTML = `
            <p id="hint-text"></p>
            <button onclick="closeHintModal()">Close</button>
        `;
        document.body.appendChild(hintModal);
    }
    const warningModalDiv = document.createElement('div');
    warningModalDiv.innerHTML = warningModalHTML;
    document.body.appendChild(warningModalDiv);

    // Add warning styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = warningStyles;
    document.head.appendChild(styleSheet);
}

function checkClueProximity() {
    const playerPosition = character.position;
    let nearestClue = null;
    let shortestDistance = Infinity;

    Object.entries(cluePositions).forEach(([clueId, position]) => {
        const distance = playerPosition.distanceTo(position);
        
        if (distance < gameState.proximityThreshold && distance < shortestDistance) {
            nearestClue = clueId;
            shortestDistance = distance;
        }
    });

    gameState.activeClue = nearestClue;
    const hintButton = document.querySelector('.hint-button');
    
    if (nearestClue && gameState.hintsRemaining > 0) {
        hintButton.style.display = 'block';
    } else {
        hintButton.style.display = 'none';
    }
}

// Handle hint interaction
function showHint() {
    if (gameState.activeClue && gameState.hintsRemaining > 0) {
        const warningModal = document.getElementById('warning-modal');
        warningModal.style.display = 'block';

        // Add event listeners for the warning buttons
        document.getElementById('proceed-hint').onclick = () => {
            warningModal.style.display = 'none';
            revealHint();
        };

        document.getElementById('cancel-hint').onclick = () => {
            warningModal.style.display = 'none';
        };
    }
}

function revealHint() {
    const hintModal = document.getElementById('hint-modal');
    const hintText = document.getElementById('hint-text');
    hintText.textContent = clueHints[gameState.activeClue];
    hintModal.style.display = 'block';
    
    gameState.hintsRemaining--;
    gameState.cluesFound[gameState.activeClue] = true;
    
    // Hide the examine button after using the hint
    document.querySelector('.hint-button').style.display = 'none';
}

// Add to your existing close modal function
function closeHintModal() {
    document.getElementById('hint-modal').style.display = 'none';
    document.getElementById('warning-modal').style.display = 'none';
}

// Add click outside to close for warning modal
window.onclick = function(event) {
    const warningModal = document.getElementById('warning-modal');
    if (event.target == warningModal) {
        warningModal.style.display = 'none';
    }
}

// Get the modal
const officerModal = document.getElementById("officer-modal");

// Get the button that opens the modal
const officerBtn = document.getElementById("view-officers");

// Get the <span> element that closes the modal
const closeBtn = document.querySelector("#officer-modal .close");

// When the user clicks the button, open the modal
officerBtn.onclick = function() {
    officerModal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function() {
    officerModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
// On-screen Controls
document.getElementById('up').addEventListener('mousedown', () => keys.w = true);
document.getElementById('left').addEventListener('mousedown', () => keys.a = true);
document.getElementById('down').addEventListener('mousedown', () => keys.s = true);
document.getElementById('right').addEventListener('mousedown', () => keys.d = true);

document.getElementById('up').addEventListener('mouseup', () => keys.w = false);
document.getElementById('left').addEventListener('mouseup', () => keys.a = false);
document.getElementById('down').addEventListener('mouseup', () => keys.s = false);
document.getElementById('right').addEventListener('mouseup', () => keys.d = false);
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


createUIElements();
loadClues();
closeHintModal();
showHint();

animate();