import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

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
      this.modelUrl = '/assets/models/iwi_male_character_02/scene.gltf',  // Ensure this points to the correct .gltf file
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
        console.error('An error happened while loading the model', error);
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
const speed = 0.1; // Speed of the character

// Function to create and return the character model
export function createCharacter(gltf) {
  const character = gltf.scene;
  character.scale.set(1, 1, 1); // Scale down the character
  character.position.y = 1; // Position character above ground
  return character;
}

// Function to move the character relative to the camera
export function moveCharacter(camera, keys, character, isFirstPerson) {
  const speed = 0.1; // Adjust movement speed
  const direction = new THREE.Vector3(); // Direction vector

  if (isFirstPerson) {
      // Get the camera's forward direction
      const forwardDirection = new THREE.Vector3();
      camera.getWorldDirection(forwardDirection);  // Get camera forward direction
      forwardDirection.y = 0;  // Ignore the vertical movement
      forwardDirection.normalize();

      // Get the right direction relative to the camera's forward direction
      const rightDirection = new THREE.Vector3();
      rightDirection.crossVectors(forwardDirection, camera.up).normalize();  // Right direction

      // Move the character relative to the camera's orientation
      const moveDirection = new THREE.Vector3();

      if (keys['w']) moveDirection.add(forwardDirection);  // Move forward
      if (keys['s']) moveDirection.add(forwardDirection.clone().negate()); // Move backward
      if (keys['a']) moveDirection.add(rightDirection.clone().negate());   // Move left
      if (keys['d']) moveDirection.add(rightDirection);  // Move right

      // Normalize and apply movement
      if (moveDirection.length() > 0) {
          moveDirection.normalize();
          character.position.add(moveDirection.multiplyScalar(speed));
      }

      // Optional: You can rotate the character to face the direction of movement in first-person
      if (moveDirection.length() > 0) {
          const targetPosition = character.position.clone().add(moveDirection);
          character.lookAt(targetPosition);
      }

  } else {
        // Get the camera's forward and right directions
        const forwardDirection = new THREE.Vector3();
        camera.getWorldDirection(forwardDirection); // Get camera forward direction
        forwardDirection.y = 0;  // Ignore the vertical movement
        forwardDirection.normalize();

        const rightDirection = new THREE.Vector3();
        rightDirection.crossVectors(forwardDirection, camera.up); // Right direction relative to forward
        rightDirection.normalize();

        let moveDirection = new THREE.Vector3();

        // Check which keys are pressed and move the character in the respective direction
        if (keys['w']) moveDirection.add(forwardDirection);   // Move forward
        if (keys['s']) moveDirection.add(forwardDirection.clone().multiplyScalar(-1)); // Move backward
        if (keys['a']) moveDirection.add(rightDirection.clone().multiplyScalar(-1));  // Strafe left
        if (keys['d']) moveDirection.add(rightDirection);    // Strafe right

        // Normalize the direction to avoid diagonal speed boost
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            character.position.add(moveDirection.multiplyScalar(speed));

            // Make the character face the direction of movement
            const lookAtTarget = character.position.clone().add(moveDirection);
            character.lookAt(lookAtTarget);
        }
    }
}


// Function to return the character object
export function getCharacter() {
    return Character;
}


export default Character;
