// suspect.js

const correctSuspect = Math.floor(Math.random() * 3) + 1;

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('suspectModal');
    const closeModal = document.getElementById('closeModal');
    const chooseButtons = document.querySelectorAll('.choose-button');
    const resultDiv = document.getElementById('result');

    // Open the modal
    function openModal() {
        modal.style.display = 'flex';
    }

    // Close the modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Select a suspect
    chooseButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const suspectCard = event.target.closest('.suspect-card');
            const suspectId = parseInt(suspectCard.getAttribute('data-suspect'));

            if (suspectId === correctSuspect) {
                displayResult("Congratulations! You found the actual suspect. You win!");
                highlightCorrectSuspect(suspectCard);
            } else {
                displayResult("Wrong choice! You lose the game.");
                suspectCard.classList.add('highlight'); // Show selected suspect
                disableChooseButtons(); // Prevent further selections
            }
        });
    });

    // Display the result
    function displayResult(message) {
        resultDiv.innerHTML = `<p>${message}</p>`;
        resultDiv.style.display = 'block';
    }

    // Highlight correct suspect
    function highlightCorrectSuspect(suspectCard) {
        suspectCard.classList.add('highlight');
    }

    // Disable all choose buttons after a choice is made
    function disableChooseButtons() {
        chooseButtons.forEach(button => button.disabled = true);
    }

    // Open modal on page load
    openModal();
});
