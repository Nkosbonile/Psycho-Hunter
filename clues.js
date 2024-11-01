import * as THREE from 'three';

const clues = [
    {
        model: 'brokenGlass',
        riddle: "Shattered memories scatter the floor, each shard reflecting a darker truth. Look for where violence escalated.",
        nextObject: "polaroid",
        timePenalty: 15000,
        position: new THREE.Vector3(0, 0.20, 10), // Position for broken glass
        radius: 3,
        note: "Broken glass from what appears to be a picture frame. Polaroid fragments visible."
    },
    {
        model: 'polaroid',
        riddle: "Silent witnesses to a dark act, captured in still life. Next, find where blood tells the tale.",
        nextObject: "bloodyCabinet",
        timePenalty: 20000,
        position: new THREE.Vector3(0, 0, 0.09375), // Position for polaroid
        radius: 3,
        note: "Pictures on the wall, some torn, showing scenes of the victim."
    },
    {
        model: 'bloodyCabinet',
        riddle: "The cabinet is stained with memories and the truth locked inside. The next clue is within arm's reach.",
        nextObject: "cleaver",
        timePenalty: 25000,
        position: new THREE.Vector3(-22.5, 0, 18.5), // Position for bloody cabinet
        radius: 3,
        note: "Blood-stained cabinet, lock appears forced open."
    },
    {
        model: 'cleaver',
        riddle: "A tool of anger lies discarded, but something nearby reveals a desperate struggle.",
        nextObject: "handcuff",
        timePenalty: 30000,
        position: new THREE.Vector3(-24, 0, 8), // Position for cleaver
        radius: 3,
        note: "A bloody cleaver found near the cabinet, used recently."
    },
    {
        model: 'handcuff',
        riddle: "Bonds broken in desperation. Look for where silence meets steel.",
        nextObject: "revolver",
        timePenalty: 15000,
        position: new THREE.Vector3(-10, 0, -10), // Position for handcuff
        radius: 3,
        note: "Broken handcuffs found at the initial struggle site. Signs of violent resistance."
    },
    {
        model: 'revolver',
        riddle: "Steel and gunpowder tell the story's end. Find the final piece that seals the truth.",
        nextObject: "file",
        timePenalty: 20000,
        position: new THREE.Vector3(22, 1, -24), // Position for revolver
        radius: 3,
        note: "Revolver found at the scene with one chamber empty."
    },
    {
        model: 'file',
        riddle: "The final chapter awaits. This dossier will unravel all.",
        nextObject: null,
        timePenalty: 0,
        position: new THREE.Vector3(23, 0.0625, 23), // Position for file
        radius: 3,
        note: "Confidential dossier containing case details and suspect information."
    }
];

// Modal display for clue hints
function showEvidenceModal(clue) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    modal.style.color = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.zIndex = '1500';
    modal.style.maxWidth = '80%';

    modal.innerHTML = `
        <h2 style="color: #ff4444;">Evidence Found!</h2>
        <p style="color: #ffaa44;"><strong>Investigation Note:</strong> ${clue.note}</p>
        <p style="color: #ffffff;"><strong>Riddle:</strong> ${clue.riddle}</p>
        ${clue.timePenalty ? `<p style="color: #ff6666;">Warning: Incorrect investigation paths will cost you ${clue.timePenalty / 1000} seconds</p>` : ''}
        <button id="close-evidence-modal" style="margin-top:10px; padding: 5px 15px; background: #333; color: white; border: 1px solid #666;">Continue Investigation</button>
    `;

    document.body.appendChild(modal);
    document.getElementById('close-evidence-modal').onclick = () => {
        document.body.removeChild(modal);
    };
}

export { clues, showEvidenceModal };
