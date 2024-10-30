function goBack() {
    window.location.href = "index.html"; // Replace with the correct path to your homepage
}
window.addEventListener("load", () => {
    const music = document.getElementById("background-music");
    music.volume = 0.3;  // Adjust volume level (0.0 - 1.0)
    music.play().catch(error => {
        console.log("Background music playback failed:", error);
    });
});
