import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        // Lower and more directly behind the character
        this.offset = new THREE.Vector3(0, 1, 3); // Lower height, closer follow
        this.smoothness = 0.4; // Slightly smoother for stability
        this.lookAtOffset = new THREE.Vector3(0, 0.5, 0); // Look closer to character base
    }

    update(delta) {
        if (!this.target) return;

        // Get target's current position and rotation
        const targetPosition = this.target.position.clone();
        const targetRotation = this.target.rotation.clone();

        // Calculate camera position based on character's rotation
        const offsetRotated = this.offset.clone();
        offsetRotated.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation.y);
        
        // Apply the rotated offset to get desired camera position
        const desiredPosition = targetPosition.clone().add(offsetRotated);
        
        // Smooth camera movement
        this.camera.position.lerp(desiredPosition, this.smoothness);

        // Look at point just slightly above the character's base
        const lookAtPoint = targetPosition.clone().add(this.lookAtOffset);
        this.camera.lookAt(lookAtPoint);
    }

    setOffset(x, y, z) {
        this.offset.set(x, y, z);
    }

    setLookAtOffset(x, y, z) {
        this.lookAtOffset.set(x, y, z);
    }

    setSmoothness(value) {
        this.smoothness = Math.max(0, Math.min(1, value));
    }
}