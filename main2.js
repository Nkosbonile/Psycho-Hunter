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
// Enhanced Materials
class TextureGenerator {
    constructor(width = 512, height = 512) {
        this.width = width;
        this.height = height;
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        return canvas;
    }

    generateNoiseTexture(scale = 30, octaves = 4) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let noise = 0;
                let amplitude = 1;
                let frequency = 1;
                
                for (let i = 0; i < octaves; i++) {
                    noise += (Math.random() - 0.5) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                const value = Math.floor((noise + 1) * 128);
                ctx.fillStyle = `rgb(${value},${value},${value})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateCrackedTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 25; i++) {
            const startX = Math.random() * this.width;
            const startY = Math.random() * this.height;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            this.generateCrackPath(ctx, startX, startY, 0, 4);
            
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateCrackPath(ctx, x, y, depth, maxDepth) {
        if (depth >= maxDepth) return;

        const length = 30 + Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        ctx.lineTo(endX, endY);
        
        if (Math.random() < 0.7) {
            this.generateCrackPath(ctx, endX, endY, depth + 1, maxDepth);
        }
    }

    generateRottenWoodTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.height; i += 4) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            
            for (let x = 0; x < this.width; x += 10) {
                const y = i + Math.sin(x * 0.03) * 2;
                ctx.lineTo(x, y);
            }
            
            ctx.strokeStyle = `rgba(30, 20, 10, ${Math.random() * 0.3})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.stroke();
        }

        for (let i = 0; i < 40; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const radius = 5 + Math.random() * 25;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(30, 20, 10, 0.8)');
            gradient.addColorStop(1, 'rgba(30, 20, 10, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateMossTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#3e5c3e';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const radius = 8 + Math.random() * 15;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(55, 80, 50, 0.8)');
            gradient.addColorStop(1, 'rgba(55, 80, 50, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
}

// Usage example
const textureGen = new TextureGenerator(512, 512);

const textures = {
    walls: {
        color: textureGen.generateCrackedTexture(),
        normal: textureGen.generateNoiseTexture(15, 5),
        roughness: textureGen.generateNoiseTexture(8, 6),
        moss: textureGen.generateMossTexture(),
    },
    wood: {
        color: textureGen.generateRottenWoodTexture(),
        normal: textureGen.generateNoiseTexture(12, 4),
        roughness: textureGen.generateNoiseTexture(10, 4),
    },
    floor: {
        color: textureGen.generateRottenWoodTexture(),
        normal: textureGen.generateNoiseTexture(20, 5),
        roughness: textureGen.generateNoiseTexture(12, 4),
        moss: textureGen.generateMossTexture(),
    },
    roof: {
        color: textureGen.generateCrackedTexture(),
        normal: textureGen.generateNoiseTexture(25, 4),
        moss: textureGen.generateMossTexture(),
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

const wallMaterial = new THREE.MeshStandardMaterial({
    map: bloodPrintTexture,
    roughness: 0.9,   // Optional: increase roughness for a less shiny look
    metalness: 0      // Optional: remove metallic effect
  });
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
        { pos: [-15, 0.01, -15], radius: 6, color: '#8b2d2d' }, // Dark red
        { pos: [15, 0.01, -15], radius: 8, color: '#4b3621' }    // Dark brown
    ];
    

    carpets.forEach(carpet => {
        const material = new THREE.MeshStandardMaterial({
            color: carpet.color,
            roughness: 0.8
        });
    
        const mesh = new THREE.Mesh(
            new THREE.CircleGeometry(carpet.radius, 32),
            material
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(...carpet.pos);
        mesh.receiveShadow = true;
        house.add(mesh);
    });
    
     bloodPrintTexture = textureLoader.load('blood.jpg');

    // Create the blood print mesh
    const bloodPrint = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.MeshStandardMaterial({
            map: bloodPrintTexture,
            transparent: true, // Ensures any transparency in the image is respected
            roughness: 0.9,
            metalness: 0
        })
    );
    
    // Position the blood print on the wall
    bloodPrint.position.set(-25, wallHeight / 2, 0.1); // Adjust z for slight offset to avoid z-fighting
    bloodPrint.rotation.y = Math.PI / 2; // Rotate to align with the wall
    
    // Add to the house
    house.add(bloodPrint);
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