let scene, camera, renderer;
let introText, startButton, overlay, backgroundMusic;

const introLines = [
  "A haunting whisper through the city... People who enter that house never return alive.",
  "No witnesses. No bodies found.",
  "Local authorities are baffled...",
  "As the department's finest detective, this case is now yours.",
  "Every clue matters. Every word hides a secret.",
  "Your mission: Solve the mystery before you become the next victim.",
];

function init() {
  // Get DOM elements after the page loads
  introText = document.getElementById("introText");
  startButton = document.getElementById("startButton");
  overlay = document.getElementById("overlay");
  backgroundMusic = document.getElementById("backgroundMusic");

  // Initialize Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const backgroundTexture = new THREE.TextureLoader().load(
    "https://via.placeholder.com/800x600/000000/FFFFFF?text=Murder+Scene+Background"
  );
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 75),
    new THREE.MeshBasicMaterial({ map: backgroundTexture })
  );
  background.position.set(0, 0, -10);
  scene.add(background);

  addAnimatedEvidence();
  introAnimation();
  window.addEventListener("resize", onWindowResize, false);
}

function addAnimatedEvidence() {
  const loader = new THREE.TextureLoader();

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshBasicMaterial({
      map: loader.load(
        "https://via.placeholder.com/100/FFFFFF/000000?text=Magnifying+Glass"
      ),
    })
  );
  glass.position.set(-3, 1, 0);
  scene.add(glass);

  function animateGlass() {
    requestAnimationFrame(animateGlass);
    glass.rotation.z += 0.01;
  }
  animateGlass();

  const question = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({
      map: loader.load("https://via.placeholder.com/100/FFFFFF/000000?text=?"),
    })
  );
  question.position.set(2, 1, 0);
  scene.add(question);

  function animateQuestion() {
    requestAnimationFrame(animateQuestion);
    question.rotation.z += 0.02;
  }
  animateQuestion();
}

function introAnimation() {
  let cameraMove = { z: 30 };

  new TWEEN.Tween(cameraMove)
    .to({ z: 15 }, 5000)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(() => {
      camera.position.z = cameraMove.z;
    })
    .onComplete(() => {
      if (backgroundMusic) backgroundMusic.play();
      showIntroText(0);
    })
    .start();

  animate();
}

function showIntroText(lineIndex) {
  if (lineIndex >= introLines.length) {
    setTimeout(() => {
      overlay.style.display = "block"; // Show overlay
      startButton.style.display = "block"; // Show button
    }, 2000);
    return;
  }

  introText.innerText = introLines[lineIndex];
  introText.style.opacity = 1;

  setTimeout(() => {
    introText.style.opacity = 0;
    setTimeout(() => showIntroText(lineIndex + 1), 1000); // Delay before next line
  }, 3000); // Time each line stays visible
}
function startGame() {
  // Play background music only after a user has interacted
  if (backgroundMusic) {
    backgroundMusic.currentTime = 0; // Reset audio to start
    backgroundMusic.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  }
  
  introText.style.opacity = 0;
  startButton.style.display = "none";
  overlay.style.display = "none"; // Hide overlay
  // Navigate to the main game after a slight delay to allow audio to play
  setTimeout(() => {
    window.location.href = "level1.html";
  }, 500); // Adjust the delay as necessary
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  renderer.render(scene, camera);
}

// Run init after DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);
