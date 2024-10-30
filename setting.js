
// settings.js

// settings.js

// Get the audio element
const backgroundMusic = document.getElementById('background-music');

// Function to save settings
function saveSettings() {
    const musicVolume = document.getElementById('music-volume').value;
    const graphicsQuality = document.getElementById('graphics-quality').value;
    const selectedTrack = document.getElementById('music-track').value;

    // Save settings to local storage (or your preferred method)
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('graphicsQuality', graphicsQuality);
    localStorage.setItem('selectedTrack', selectedTrack);

    // Update the background music source and volume
    backgroundMusic.src = selectedTrack;
    backgroundMusic.volume = musicVolume / 100; // Set volume between 0 and 1
    backgroundMusic.play();

}

// Event listener to display volume value
document.getElementById('music-volume').addEventListener('input', function() {
    document.getElementById('music-volume-value').innerText = this.value + '%';
});

// Set initial values from local storage when the page loads
window.onload = function() {
    const storedVolume = localStorage.getItem('musicVolume') || 50; // Default to 50
    const storedTrack = localStorage.getItem('selectedTrack') || 'track1.mp3'; // Default track

    document.getElementById('music-volume').value = storedVolume;
    document.getElementById('music-volume-value').innerText = storedVolume + '%';
    document.getElementById('music-track').value = storedTrack;

    // Set the audio source and volume on page load
    backgroundMusic.src = storedTrack;
    backgroundMusic.volume = storedVolume / 100; // Set volume between 0 and 1
    backgroundMusic.loop = true; // Ensure music loops
    backgroundMusic.play(); // Start playing
};


// Example goBack function
function goBack() {
    window.location.href = 'index.html'; // Adjust to your home page
}
