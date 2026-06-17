const CURRENT_GAME_VERSION = 1.0; // Schimbi valoarea asta când adaugi update-uri în viitor!

// Structura inițială (obiectul default folosit la un joc complet nou)
const defaultGameState = {
    version: CURRENT_GAME_VERSION,
    money: 0,
    linesOfCode: 0,
    clickPower: 1,
    officeLevel: 0, // 0 = Garaj, 1 = Birou Modern
    upgrades: {
        pcLevel: 0
    },
    projectsOwned: {
        website: 0,
        mobileApp: 0,
        saasPlatform: 0
    }
};

// Descarcă progresul ca fișier text .json
function downloadSaveFile() {
    gameState.version = CURRENT_GAME_VERSION; // Ne asigurăm că are versiunea la zi
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dev_tycoon_save_v${CURRENT_GAME_VERSION}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Încarcă fișierul ales de utilizator
function loadSaveFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedData = JSON.parse(e.target.result);
            
            // Verificăm și completăm dacă lipsesc date (Mecanismul anti-corupere la update)
            gameState = validateAndMigrateSave(loadedData);
            
            // Facem backup imediat și în LocalStorage-ul browserului
            localStorage.setItem('dev_tycoon_local_save', JSON.stringify(gameState));
            
            // Reîmprospătăm ecranul
            updateUI();
            alert("📂 Salvare încărcată cu succes! Datele companiei au fost restaurate.");
        } catch (err) {
            alert("❌ Fișierul de salvare este invalid sau corupt.");
        }
    };
    reader.readAsText(file);
}

// Mecanismul de îmbinare (merge) care previne erorile de tip "undefined" în versiuni noi
function validateAndMigrateSave(loadedData) {
    if (!loadedData || typeof loadedData !== 'object') {
        return { ...defaultGameState };
    }

    function mergeObjects(target, source) {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!target[key]) target[key] = Array.isArray(source[key]) ? [] : {};
                    mergeObjects(target[key], source[key]);
                } else if (target[key] === undefined) {
                    // Dacă în update-ul 1.1 adaugi o cheie nouă (ex: cryptoSystem: 0), o injectează automat fără să strice restul datelor
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    let migratedState = mergeObjects(loadedData, defaultGameState);
    migratedState.version = CURRENT_GAME_VERSION; 
    return migratedState;
}
