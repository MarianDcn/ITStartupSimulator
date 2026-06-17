// Configurația fixă a proiectelor pe care le poți dezvolta
const projectsConfig = {
    website: { name: "Site Web Freelance", codeRequired: 15, income: 1, minOffice: 0 },
    mobileApp: { name: "Joc Mobil Casual", codeRequired: 100, income: 8, minOffice: 0 },
    saasPlatform: { name: "Platformă Cloud B2B", codeRequired: 1000, income: 75, minOffice: 1 } // Necesită Birou Modern
};

const officeNames = ["Garajul Părinților", "Birou Modern în Centru"];

// Starea live a jocului (pornește goală, se completează la pornire)
let gameState = {};

function initGame() {
    const localData = localStorage.getItem('dev_tycoon_local_save');
    if (localData) {
        gameState = validateAndMigrateSave(JSON.parse(localData));
    } else {
        gameState = JSON.parse(JSON.stringify(defaultGameState));
    }
    
    // Motorul de venit pasiv (rulează o dată pe secundă)
    setInterval(gameLoop, 1000);
    
    updateUI();
}

// Click-ul principal: generează linii de cod
function clickWriteCode() {
    gameState.linesOfCode += gameState.clickPower;
    updateUI();
}

// Calculează totalul de dolari pe secundă produși de software-urile lansate
function calculatePassiveIncome() {
    let total = 0;
    for (let key in projectsConfig) {
        total += (gameState.projectsOwned[key] || 0) * projectsConfig[key].income;
    }
    return total;
}

// Reîmprospătează toate datele de pe interfață
function updateUI() {
    document.getElementById("stat-money").innerText = Math.floor(gameState.money);
    document.getElementById("stat-lines").innerText = gameState.linesOfCode;
    document.getElementById("stat-office").innerText = officeNames[gameState.officeLevel];
    document.getElementById("click-power").innerText = gameState.clickPower;
    document.getElementById("game-version").innerText = gameState.version.toFixed(1);
    
    document.getElementById("stat-income").innerText = calculatePassiveIncome();

    // Calcul prețuri upgrade-uri active
    document.getElementById("cost-upgrade-pc").innerText = (50 + gameState.upgrades.pcLevel * 60);
    
    // Ascunde butonul de upgrade birou dacă l-ai cumpărat deja
    if (gameState.officeLevel >= 1) {
        document.getElementById("cost-upgrade-office").parentElement.disabled = true;
        document.getElementById("cost-upgrade-office").parentElement.innerHTML = "Sediu Maxim Atingis ✨";
    }

    renderProjects();
    
    // Salvare automată în browser la orice acțiune a utilizatorului
    localStorage.setItem('dev_tycoon_local_save', JSON.stringify(gameState));
}

// Generează dinamic lista de proiecte din panoul central
function renderProjects() {
    const container = document.getElementById("projects-list");
    container.innerHTML = "";

    for (let key in projectsConfig) {
        const project = projectsConfig[key];
        const owned = gameState.projectsOwned[key] || 0;
        
        // Verifică dacă ai sediul necesar pentru a vedea/crea proiectul
        if (gameState.officeLevel < project.minOffice) {
            continue; // Trece peste dacă nu ai biroul necesar
        }

        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
            <div class="project-info">
                <strong>${project.name} (Lansate: ${owned})</strong>
                <span>Cost: ${project.codeRequired} LOB</span>
            </div>
            <div class="project-info" style="color: #8b949e; font-size: 0.85rem; margin-bottom:12px;">
                +${project.income}$ / sec per proiect lansat
            </div>
            <button id="btn-project-${key}" onclick="launchProject('${key}')">Lansează Proiect</button>
        `;
        container.appendChild(card);
        
        // Dezactivează butonul dacă nu ai destul cod
        if (gameState.linesOfCode < project.codeRequired) {
            document.getElementById(`btn-project-${key}`).disabled = true;
        }
    }
}

// Consumă cod pentru a lansa un proiect software
function launchProject(key) {
    const project = projectsConfig[key];
    if (gameState.linesOfCode >= project.codeRequired) {
        gameState.linesOfCode -= project.codeRequired;
        gameState.projectsOwned[key] = (gameState.projectsOwned[key] || 0) + 1;
        updateUI();
    }
}

// Cumpărare Upgrade-uri pentru PC sau Sediu
function buyUpgrade(type) {
    if (type === 'pc') {
        let cost = 50 + gameState.upgrades.pcLevel * 60;
        if (gameState.money >= cost) {
            gameState.money -= cost;
            gameState.upgrades.pcLevel++;
            gameState.clickPower += 1;
            updateUI();
        } else {
            alert("Nu ai suficienți bani pentru upgrade-ul PC-ului!");
        }
    } else if (type === 'office') {
        let cost = 1000;
        if (gameState.money >= cost && gameState.officeLevel < 1) {
            gameState.money -= cost;
            gameState.officeLevel = 1;
            updateUI();
        } else if (gameState.money < cost) {
            alert("Nu ai destule fonduri (1000$) pentru un birou în centru!");
        }
    }
}

// Bucla automată: rulează în spate la fiecare secundă
function gameLoop() {
    let income = calculatePassiveIncome();
    if (income > 0) {
        gameState.money += income;
        // Optimizare performanță: schimbăm doar textul banilor în fiecare secundă
        document.getElementById("stat-money").innerText = Math.floor(gameState.money);
        localStorage.setItem('dev_tycoon_local_save', JSON.stringify(gameState));
        
        // Reactualizăm butoanele de proiecte în caz că strângerea banilor/codului le-a deblocat starea
        renderProjects();
    }
}

// Pornește tot sistemul în momentul în care fereastra s-a încărcat complet
window.onload = initGame;
