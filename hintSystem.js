import * as THREE from 'three';

let hintSprite = null;
let hintShown = false;

function createHintSprite(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '16px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Split the message into multiple lines
    const words = message.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = canvas.width - 20;
    const lineHeight = 20;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw each line on the canvas
    lines.forEach((line, i) => {
        context.fillText(line, canvas.width / 2, (i + 1) * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);

    return sprite;
}

// export function showHint(scene, camera, message) {
//     if (!hintShown) {
//         hintSprite = createHintSprite(message);
//         scene.add(hintSprite);
//         hintShown = true;

//         // Position the sprite in front of the camera
//         const distance = 2; // Distance from camera
//         const vector = new THREE.Vector3(0, 0, -distance).applyQuaternion(camera.quaternion);
//         hintSprite.position.copy(camera.position).add(vector);

//         // Remove the hint after 5 seconds
//         setTimeout(() => {
//             if (hintSprite) {
//                 scene.remove(hintSprite);
//                 hintSprite = null;
//             }
//         }, 5000);
//     }
// }

export function showHint(message) {
    const hintElement = document.getElementById('hintMessage');
    hintElement.textContent = message;
    hintElement.style.display = 'block';
  
    setTimeout(() => {
      hintElement.style.display = 'none';
    }, 10000); // Remove hint after 3 seconds
  }


export function updateHintPosition(camera) {
    if (hintSprite) {
        const distance = 2; // Keep the same distance from camera
        const vector = new THREE.Vector3(0, 0, -distance).applyQuaternion(camera.quaternion);
        hintSprite.position.copy(camera.position).add(vector);
    }
}

export function resetHint() {
    hintShown = false;
}