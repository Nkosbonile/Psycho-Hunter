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
  const speed = 0.01;  // Adjust movement speed
  const direction = new THREE.Vector3();  // Movement direction vector

  if (isFirstPerson) {
      // Handle first-person movement
      const forwardDirection = new THREE.Vector3();
      camera.getWorldDirection(forwardDirection);
      forwardDirection.y = 0;  // Ignore Y axis movement (vertical)
      forwardDirection.normalize();

      // Compute the right direction
      const rightDirection = new THREE.Vector3();
      rightDirection.crossVectors(forwardDirection, camera.up).normalize();

      let moveDirection = new THREE.Vector3();  // Initialize movement direction vector

      if (keys['w']) character.position.z -= speed;
      if (keys['s']) character.position.z += speed;
      if (keys['a']) character.position.x -= speed;
      if (keys['d']) character.position.x += speed;

      if (character.position.y < houseGroundLevel) {
          character.position.y = houseGroundLevel;
      }
  } else {
      // Handle third-person movement logic
      const forwardDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(character.quaternion);

      if (keys['w']) direction.add(forwardDirection);
      if (keys['s']) direction.sub(forwardDirection);
      if (keys['a']) direction.add(new THREE.Vector3(-1, 0, 0));
      if (keys['d']) direction.add(new THREE.Vector3(1, 0, 0));

      if (keys['e'] || keys[' ']) {
          if (character.position.y <= houseGroundLevel) {
              const newPosition = character.position.clone();
              newPosition.y = houseUpperFloorLevel;
              character.position.copy(newPosition);
          }
      }

      if (direction.length() > 0) {
          direction.normalize();
          const newPosition = character.position.clone().add(direction.multiplyScalar(speed));
          character.position.copy(newPosition);
      }
  }
}
