const correctSuspect = Math.floor(Math.random() * 3) + 1;

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('suspectModal');
    const closeModal = document.getElementById('closeModal');
    const chooseButtons = document.querySelectorAll('.choose-button');
    const resultDiv = document.getElementById('result');
    const failurePopup = document.getElementById('failurePopup');
    const successPopup = document.getElementById('successPopup');
    const restartButton = document.getElementById('restartButton');
    const restartGameButton = document.getElementById('restartGameButton');
    const nextLevelButton = document.getElementById('nextLevelButton');

    // Open the main suspect modal on page load
    function openModal() {
        modal.style.display = 'flex';
    }

    // Close the main suspect modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Choose suspect logic
    chooseButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const suspectCard = event.target.closest('.suspect-card');
            const suspectId = parseInt(suspectCard.getAttribute('data-suspect'));

            if (suspectId === correctSuspect) {
                showSuccessPopup(suspectCard);
            } else {
                showFailurePopup(suspectCard);
            }
        });
    });

    // Show failure popup
    function showFailurePopup(suspectCard) {
        displayMessage(failurePopup, `"Wrong choice... Do you think you can outsmart me? Think again."`);
        suspectCard.classList.add('highlight');
        disableChooseButtons();
    }

    // Show success popup
    function showSuccessPopup(suspectCard) {
        displayMessage(successPopup, `"Well, well, well... You found me. But this game is far from over."`);
        highlightCorrectSuspect(suspectCard);
        disableChooseButtons();
    }

    // Display the message in a popup
    function displayMessage(popup, message) {
        const content = popup.querySelector('p');
        content.innerText = message;
        popup.style.display = 'flex';
    }

    // Highlight the correct suspect card
    function highlightCorrectSuspect(suspectCard) {
        suspectCard.classList.add('highlight');
    }

    // Disable all choose buttons after a choice is made
    function disableChooseButtons() {
        chooseButtons.forEach(button => button.disabled = true);
    }

    // Restart the game
    function restartGame() {
        window.location.href = 'main2.html';
    }

    // Proceed to the next level
    function goToNextLevel() {
        window.location.href = 'level3.html';
    }

    // Attach restart and next level event listeners
    restartButton.addEventListener('click', restartGame);
    restartGameButton.addEventListener('click', restartGame);
    nextLevelButton.addEventListener('click', goToNextLevel);

    // Open the modal on page load
    openModal();
});
function saveGameState() {
    sessionStorage.setItem("countdownTime", countdownTime); // Save timer
    sessionStorage.setItem("currentClueIndex", currentClueIndex); // Save current clue index
    sessionStorage.setItem("cluesSolved", JSON.stringify(cluesSolved)); // Save clues found
    // Save any other necessary variables
}

document.querySelector('.navbar-menu a').addEventListener('click', () => {
    saveGameState();
    window.location.href = "suspect.html";
});
