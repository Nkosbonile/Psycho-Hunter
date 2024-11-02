class SuspectManager {
    constructor() {
        this.correctSuspect = Math.floor(Math.random() * 3) + 1; // Randomly select the correct suspect
        // Update selectors to match your HTML
        this.chooseButtons = document.querySelectorAll('.choose-button');
        this.resultDiv = document.getElementById('result');
        this.failurePopup = document.getElementById('failurePopup');
        this.successPopup = document.getElementById('successPopup');
        this.restartButton = document.getElementById('restartButton');
        this.restartGameButton = document.getElementById('restartGameButton');
        this.nextLevelButton = document.getElementById('nextLevelButton');
        
        console.log('Found buttons:', this.chooseButtons.length); // Debug log
        console.log('Correct suspect:', this.correctSuspect); // Debug log
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.chooseButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                console.log('Choose button clicked:', event.target); // Log button click
                event.stopPropagation(); // Prevent the event from bubbling up to the document
                this.handleSuspectChoice(event);
            });
        });
        

        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => this.restartGame());
        }
        if (this.restartGameButton) {
            this.restartGameButton.addEventListener('click', () => this.restartGame());
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.addEventListener('click', () => this.goToNextLevel());
        }
    }

    handleSuspectChoice(event) {
        const suspectCard = event.target.closest('.suspect-card');
        console.log("Suspect card found:", suspectCard); // Debug log
    
        if (!suspectCard) {
            console.log('No suspect card found'); // Debug log
            return;
        }
    
        const suspectId = parseInt(suspectCard.getAttribute('data-suspect'));
        console.log('Suspect chosen:', suspectId); // Debug log
    
        if (suspectId === this.correctSuspect) {
            console.log('Correct suspect selected'); // Debug log
            this.showSuccessPopup(suspectCard);
        } else {
            console.log('Incorrect suspect selected'); // Debug log
            this.showFailurePopup(suspectCard);
        }
    }
    
    showFailurePopup(suspectCard) {
        console.log('Displaying failure popup'); // Debug log
        if (this.failurePopup) {
            this.failurePopup.style.display = 'flex';
            suspectCard.classList.add('highlight');
            this.disableChooseButtons();
        } else {
            console.log('Failure popup not found'); // Debug log
        }
    }

    showSuccessPopup(suspectCard) {
        console.log('Displaying success popup'); // Debug log
        if (this.successPopup) {
            this.successPopup.style.display = 'flex';
            suspectCard.classList.add('highlight');
            this.disableChooseButtons();
            this.saveProgress();
        } else {
            console.log('Success popup not found'); // Debug log
        }
    }

    disableChooseButtons() {
        this.chooseButtons.forEach(button => {
            button.disabled = true;
            button.style.pointerEvents = 'none';
        });
    }

    restartGame() {
        console.log('Restarting game...'); // Debug log
        window.location.href = 'main2.html';
    }

    goToNextLevel() {
        console.log('Going to next level...'); // Debug log
        window.location.href = 'level3.html';
    }

    saveProgress() {
        console.log('Saving game progress...'); // Debug log
        sessionStorage.setItem('suspectChosen', 'true');
        sessionStorage.setItem('correctSuspectFound', 'true');
    }

    static loadGameState() {
        return {
            suspectChosen: sessionStorage.getItem('suspectChosen') === 'true',
            correctSuspectFound: sessionStorage.getItem('correctSuspectFound') === 'true'
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const suspectManager = new SuspectManager();
});

// Export the class if needed
export default SuspectManager;
