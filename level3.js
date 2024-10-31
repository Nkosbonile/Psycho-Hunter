// script.js
document.getElementById('suspect-button').addEventListener('click', function() {
    document.getElementById('suspects-section').classList.remove('hidden');
    document.getElementById('officers-section').classList.add('hidden');
});

document.getElementById('officer-button').addEventListener('click', function() {
    document.getElementById('officers-section').classList.remove('hidden');
    document.getElementById('suspects-section').classList.add('hidden');
});

document.getElementById('reveal-suspect').addEventListener('click', function() {
    const suspects = [
        {
            name: 'Suspect 1',
            age: 34,
            motive: 'Jealousy',
            lastSeen: 'Downtown',
            description: 'A local artist with a history of unstable relationships. Known for volatile behavior.'
        },
        {
            name: 'Suspect 2',
            age: 27,
            motive: 'Revenge',
            lastSeen: 'Park',
            description: 'A former associate of the victim who recently had a falling out. Often seen lurking around.'
        },
        {
            name: 'Suspect 3',
            age: 45,
            motive: 'Greed',
            lastSeen: 'Office',
            description: 'A business partner with financial troubles. Rumored to have wanted the victim out of the way.'
        },
        {
            name: 'Officer 1',
            badge: '1234',
            department: 'Homicide',
            description: 'A dedicated officer with a keen eye for detail, but has been acting suspiciously.'
        },
        {
            name: 'Officer 2',
            badge: '5678',
            department: 'Investigation',
            description: 'An officer with a deep connection to the case, but also a few secrets.'
        }
    ];

    const actualSuspect = suspects[Math.floor(Math.random() * suspects.length)];
    document.getElementById('result').innerHTML = `
        <h2>The actual suspect is: ${actualSuspect.name}</h2>
        ${actualSuspect.age ? `<p><strong>Age:</strong> ${actualSuspect.age}</p>` : ''}
        ${actualSuspect.badge ? `<p><strong>Badge Number:</strong> ${actualSuspect.badge}</p>` : ''}
        ${actualSuspect.department ? `<p><strong>Department:</strong> ${actualSuspect.department}</p>` : ''}
        <p>${actualSuspect.description}</p>
    `;
});

// Initialize to show suspects section on load
document.getElementById('suspect-button').click();
