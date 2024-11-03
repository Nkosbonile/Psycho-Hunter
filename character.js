import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/loaders/GLTFLoader.js";

class Character {
  constructor(modelUrl) {
    this.modelUrl = modelUrl;
    this.mixer = null;
    this.model = null;
    this.animations = null;
  }

  loadModel(callback) {
    const loader = new GLTFLoader();
    loader.load(
      this.modelUrl,  // Use the class property directly
      (gltf) => {
        this.model = gltf.scene;
        this.animations = gltf.animations;
        if (this.animations && this.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const action = this.mixer.clipAction(this.animations[0]);
          action.play();
        }
        if (callback) callback(this.model);
      },
      undefined,
      (error) => {
        console.error("An error happened while loading the model", error);
      }
    );
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}

// Function to create and return the character model
export function createCharacter(gltf) {
  const character = gltf.scene;
  character.scale.set(5, 5, 5); // Adjusted scale to match your main2.js
  character.position.y = 0; // Start at ground level
  return character;
}

export function moveCharacter(camera, keys, character, isFirstPerson, houseGroundLevel, houseUpperFloorLevel, speed = 0.01) {
  if (!character || !camera) return;

  const rotationSpeed = 0.05;  // Rotation speed
  const moveDirection = new THREE.Vector3();  // Direction for movement

  // Forward and right directions based on character's current rotation
  let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(character.quaternion).normalize();

  // If in first-person mode, invert forward and backward logic
  if (isFirstPerson) {
    forward.negate();  // Invert the forward direction
  }

  // Update movement direction based on key inputs
  if (keys['w']) {
    moveDirection.add(forward);  // Move forward
  }
  if (keys['s']) {
    moveDirection.sub(forward);  // Move backward
  }
  if (keys['a']) {
    // Rotate the character to the left
    character.rotation.y += rotationSpeed;
  }
  if (keys['d']) {
    // Rotate the character to the right
    character.rotation.y -= rotationSpeed;
  }

  // Apply movement to character's position
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
    const displacement = moveDirection.multiplyScalar(speed);
    const newPosition = character.position.clone().add(displacement);

    // Define the bounds of the house
    const HOUSE_BOUNDS = {
      minX: -24,
      maxX: 24,
      minZ: -24,
      maxZ: 24
    };

    // Create a bounding box for the character
    const characterBox = new THREE.Box3().setFromCenterAndSize(
      character.position.clone(), 
      new THREE.Vector3(1, 2, 1) // Assuming character size is 1x2x1
    );

    // Create a bounding box for the interior wall
    const wallHeight = 10; // Set your wall height
    const wallThickness = 1; // Set your wall thickness
    const interiorWallBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, wallHeight / 2, 0), // Position of the wall
      new THREE.Vector3(30, wallHeight, wallThickness) // Size of the wall
    );

    // Check for collision with the interior wall
    const newCharacterBox = characterBox.clone().translate(displacement);
    
    if (!newCharacterBox.intersectsBox(interiorWallBox)) {
      // Only apply movement if within house bounds and no collision
      if (newPosition.x >= HOUSE_BOUNDS.minX && 
          newPosition.x <= HOUSE_BOUNDS.maxX && 
          newPosition.z >= HOUSE_BOUNDS.minZ && 
          newPosition.z <= HOUSE_BOUNDS.maxZ) {
        character.position.copy(newPosition);
      }
    }
  }

  // Keep character on the ground
  if (character.position.y < houseGroundLevel) {
    character.position.y = houseGroundLevel;
  }

  // Update first-person camera if active
  if (isFirstPerson) {
    const headOffset = new THREE.Vector3(0, 1.6, 0);
    camera.position.copy(character.position).add(headOffset);
    camera.rotation.y = character.rotation.y;
  }
}


export { Character };