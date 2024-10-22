import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


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
      (this.modelUrl = "/assets/models/iwi_male_character_02/scene.gltf"), // Ensure this points to the correct .gltf file
      (gltf) => {
        this.model = gltf.scene;
        this.animations = gltf.animations;

        if (this.animations && this.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const action = this.mixer.clipAction(this.animations[0]); // Play the first animation
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
//let character; // Store the character model
let velocity = new THREE.Vector3(); // To handle movement direction and speed
const speed = 0.001; // Speed of the character

// Function to create and return the character model
export function createCharacter(gltf) {
  const character = gltf.scene;
  character.scale.set(1, 1, 1); // Scale down the character
  character.position.y = 1; // Position character above ground
  return character;
}

export function moveCharacter(camera, keys, character, isFirstPerson, houseGroundLevel, houseUpperFloorLevel) {
  const speed = 0.01;  // Movement speed
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
      character.position.add(moveDirection.multiplyScalar(speed));
  }

  // Keep character on the ground
  if (character.position.y < houseGroundLevel) {
      character.position.y = houseGroundLevel;
  }
}
