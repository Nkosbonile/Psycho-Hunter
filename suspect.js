// suspect.js

// Randomly select a correct suspect from available suspects (assuming 3 suspects with IDs 1, 2, and 3)
const correctSuspect = Math.floor(Math.random() * 3) + 1; // Generates a random number between 1 and 3

document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    const eliminateButtons = document.querySelectorAll('.eliminate-button');
    const revealButton = document.getElementById('reveal-suspect');

    // Function to handle suspect elimination
    eliminateButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const suspectCard = event.target.closest('.suspect-card');
            const suspectId = parseInt(suspectCard.getAttribute('data-suspect'));

            // Check if the eliminated suspect is correct
            if (suspectId === correctSuspect) {
                displayResult("Congratulations! You found the actual suspect. You win!");
                highlightCorrectSuspect(suspectCard); // Optional: highlight the correct suspect
            } else {
                suspectCard.style.opacity = "0.5";  // Gray out eliminated suspect
                displayResult("This is not the correct suspect. Try again!");
            }
        });
    });

    // Function to display the result message
    function displayResult(message) {
        resultDiv.innerHTML = `<p>${message}</p>`;
        resultDiv.style.display = 'block';
    }

    // Optional: highlight the correct suspect visually when revealed
    function highlightCorrectSuspect(suspectCard) {
        suspectCard.classList.add('highlight');
    }

    // Reveal button to highlight the correct suspect if desired
    revealButton.addEventListener('click', () => {
        const correctCard = document.querySelector(`.suspect-card[data-suspect="${correctSuspect}"]`);
        highlightCorrectSuspect(correctCard);
    });
});
