import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
let bloodPrintTexture;
// Enhanced Material
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

function createLightingSystem() {
    // Increased ambient light with warmer tint
    const ambientLight = new THREE.AmbientLight(0x996666, 0.6);
    scene.add(ambientLight);

    // Main directional light with softer red tint
    const sunLight = new THREE.DirectionalLight(0xff6666, 0.8);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Create all house lights with unified color scheme
    const pointLights = [];
    const pointLightPositions = [
        // All lights now have similar base properties for unified flickering
        { x: 0, y: 15, z: 0, color: 0xff6666, intensity: 1.8 },      // Center
        { x: -15, y: 10, z: 15, color: 0xff6666, intensity: 1.8 },   // Left wing
        { x: 15, y: 10, z: 15, color: 0xff6666, intensity: 1.8 },    // Right wing
        { x: 0, y: 10, z: -15, color: 0xff6666, intensity: 1.8 },    // Back
        { x: -25, y: 12, z: 0, color: 0xff6666, intensity: 1.8 },    // Far left
        { x: 25, y: 12, z: 0, color: 0xff6666, intensity: 1.8 },     // Far right
        { x: 0, y: 12, z: 25, color: 0xff6666, intensity: 1.8 },     // Far front
        { x: 0, y: 12, z: -25, color: 0xff6666, intensity: 1.8 }     // Far back
    ];

    pointLightPositions.forEach((pos) => {
        const light = new THREE.PointLight(pos.color, pos.intensity, 40);
        light.position.set(pos.x, pos.y, pos.z);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        scene.add(light);
        pointLights.push(light);
    });

    // Unified spotlight that follows the house's flicker
    const spotlight = new THREE.SpotLight(0xff4d4d, 1.7);
    spotlight.position.set(0, 30, 0);
    spotlight.angle = Math.PI / 3.5;
    spotlight.penumbra = 0.2;
    spotlight.decay = 1.3;
    spotlight.distance = 60;
    spotlight.castShadow = true;
    scene.add(spotlight);

    // Global flickering effect for all lights
    function flickerHouseLights() {
        // Generate global flicker values for this frame
        const globalFlicker = Math.random();
        const globalIntensityMod = 
            globalFlicker < 0.1 ? 0.4 :  // Rare dramatic drops
            globalFlicker < 0.2 ? 0.7 :  // Common minor drops
            globalFlicker < 0.3 ? 1.3 :  // Occasional bright flashes
            1.0;                         // Normal intensity

        // Apply subtle random variation to each light
        pointLights.forEach((light, index) => {
            // Individual variation per light (±20% from global flicker)
            const individualVar = 0.8 + Math.random() * 0.4;
            const finalIntensity = pointLightPositions[index].intensity * globalIntensityMod * individualVar;
            
            // Ensure intensity stays within reasonable bounds
            light.intensity = Math.max(0.2, Math.min(2.5, finalIntensity));

            // Vary the color temperature slightly
            const hue = 0.02 + Math.random() * 0.02;
            const saturation = 0.7 + Math.random() * 0.2;
            const lightness = 0.4 + Math.random() * 0.3;
            light.color.setHSL(hue, saturation, lightness);
        });

        // Apply flicker to spotlight
        spotlight.intensity = 1.7 * globalIntensityMod;

        // Random timing between 50-200ms for natural feeling flicker
        setTimeout(flickerHouseLights, Math.random() * 150 + 50);
    }
    flickerHouseLights();

    // Warmer ground light that follows the main flicker pattern
    const groundLight = new THREE.HemisphereLight(
        0xff8080, // Sky color (warmer red)
        0x664444, // Ground color (warmer dark red)
        0.6
    );
    scene.add(groundLight);

    // Unified pulse for ground light that adds to the flickering effect
    function updateGroundLight() {
        const basePulse = Math.sin(Date.now() * 0.001) * 0.15 + 0.45;
        const flickerEffect = 0.8 + Math.random() * 0.4; // Random flicker component
        groundLight.intensity = basePulse * flickerEffect;
        requestAnimationFrame(updateGroundLight);
    }
    updateGroundLight();
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
const wallMaterial = new THREE.MeshStandardMaterial({
    map: bloodPrintTexture,
    roughness: 0.9,   // Optional: increase roughness for a less shiny look
    metalness: 0      // Optional: remove metallic effect
  });
// Enhanced Lighting System


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
const moveSpeed = 0.2;

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

// Initialize scene
createLightingSystem();
const house = createHouse();
scene.add(house);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    updateCameraPosition();
    setCameraConstraints(-20, 20, -20, 20, 0); // Ensure camera stays within bounds
    controls.update();
    renderer.render(scene, camera);
}

animate();
