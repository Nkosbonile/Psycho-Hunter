//character.js

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

// Function to create and return the character model
export function createCharacter(gltf) {
  const character = gltf.scene;
  character.scale.set(1, 1, 1); // Scale down the character
  character.position.y = 1; // Position character above ground
  return character;
}

export function moveCharacter(camera, keys, character, isFirstPerson, houseGroundLevel, houseUpperFloorLevel) {
  const speed = 0.01;
  const moveDirection = new THREE.Vector3();

  // Get camera's forward and right directions for first-person movement
  const cameraDirection = new THREE.Vector3();
  if (isFirstPerson) {
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0; // Keep movement horizontal
      cameraDirection.normalize();
  }

  if (keys['w']) {
      if (isFirstPerson) {
          moveDirection.add(cameraDirection);
      } else {
          moveDirection.z = 1;
      }
  }
  if (keys['s']) {
      if (isFirstPerson) {
          moveDirection.sub(cameraDirection);
      } else {
          moveDirection.z = -1;
      }
  }
  if (keys['a']) {
      if (isFirstPerson) {
          moveDirection.add(cameraDirection.cross(new THREE.Vector3(0, 1, 0)));
      } else {
          character.rotation.y += 0.05;
      }
  }
  if (keys['d']) {
      if (isFirstPerson) {
          moveDirection.sub(cameraDirection.cross(new THREE.Vector3(0, 1, 0)));
      } else {
          character.rotation.y -= 0.05;
      }
  }

  // Apply movement
  if (moveDirection.length() > 0) {
      moveDirection.normalize();
      const movement = moveDirection.multiplyScalar(speed);
      
      if (isFirstPerson) {
          // In first person, move relative to camera direction
          character.position.add(movement);
      } else {
          // In third person, move relative to character's rotation
          movement.applyQuaternion(character.quaternion);
          character.position.add(movement);
      }
  }

  // Ground collision
  if (character.position.y < houseGroundLevel) {
      character.position.y = houseGroundLevel;
  }
}

export default Character;
