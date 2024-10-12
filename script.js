document.addEventListener('DOMContentLoaded', loadCurrentSession);

let chartUpdateTimer; // Timer pour gérer la mise à jour du graphique


function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    const sessionList = document.getElementById('existing-sessions');
    sessionList.innerHTML = '';

    sessions.forEach((session, index) => {
        const li = document.createElement('li');
        li.className = 'session-item'; // Ajout de la classe pour l'alignement
        li.style.cursor = 'pointer'; // Indiquer que l'élément est cliquable

        // Ajouter le gestionnaire d'événements pour ouvrir la session
        li.onclick = () => loadSession(index);

        // Conteneur pour le nom de la session, la date, et les boutons
        const nameContainer = document.createElement('div');
        nameContainer.style.display = 'flex'; // Utiliser flexbox pour aligner les éléments
        nameContainer.style.justifyContent = 'space-between'; // Espacer les éléments
        nameContainer.style.alignItems = 'center'; // Centrer verticalement

        // Nom de la session
        const sessionName = document.createElement('span');
        sessionName.textContent = session.name;
        sessionName.style.fontWeight = 'bold'; // Mettre le nom en gras
        sessionName.style.fontSize = '1.2em'; // Ajuster la taille de la police
        nameContainer.appendChild(sessionName);

        // Conteneur pour les icônes
        const iconContainer = document.createElement('div');
        iconContainer.style.display = 'flex'; // Utilisation de Flexbox pour le conteneur d'icônes
        iconContainer.style.alignItems = 'center'; // Centrer verticalement

        // Date et heure de création
        const date = new Date(session.createdAt);
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = date.toLocaleDateString('fr-FR', options).replace(',', ' à');

        const dateTimeText = document.createElement('small');
        dateTimeText.textContent = `Créée le ${formattedDate}`;
        dateTimeText.style.fontStyle = 'italic'; // Mettre l'horodatage en italique
        dateTimeText.style.marginRight = '10px'; // Ajouter un espace à droite
        iconContainer.appendChild(dateTimeText); // Ajouter l'horodatage au conteneur d'icônes

        // Bouton pour renommer la session
        const renameButton = document.createElement('img');
        renameButton.src = 'images/rename.png'; // Chemin vers l'icône de renommer
        renameButton.alt = 'Renommer';
        renameButton.onclick = (e) => {
            e.stopPropagation(); // Empêche le clic d'atteindre l'élément li
            openRenamePopup(index);
        };
        renameButton.className = 'icon-button'; // Classe pour les styles

        // Bouton pour supprimer la session
        const deleteButton = document.createElement('img');
        deleteButton.src = 'images/trash.png'; // Chemin vers l'icône de supprimer
        deleteButton.alt = 'Supprimer';
        deleteButton.onclick = (e) => {
            e.stopPropagation(); // Empêche le clic d'atteindre l'élément li
            deleteSession(index);
        };
        deleteButton.className = 'icon-button'; // Classe pour les styles

        // Ajout des boutons au conteneur d'icônes
        iconContainer.appendChild(renameButton);
        iconContainer.appendChild(deleteButton);

        // Ajouter le conteneur d'icônes au conteneur principal
        nameContainer.appendChild(iconContainer);

        li.appendChild(nameContainer); // Ajouter le conteneur du nom, de la date, et des icônes à l'élément de liste

        sessionList.appendChild(li);
    });
}


// Créer une nouvelle session
function createSession() {
    const sessionName = document.getElementById('session-name').value;
    if (sessionName.trim() === '') {
        alert('Veuillez entrer un nom de session');
        return;
    }

    const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    const newSession = {
        name: sessionName,
        createdAt: new Date().toISOString(), // Ajouter la date et l'heure de création
        data: {
            moins3: 0,
            age3a14: 0,
            adulte: 0,
            total: 0,
        clicks: {
            moins3: 0,
            age3a14: 0,
            adulte: 0
        },
        history: [] // Ajouter un tableau d'historique
    }
};

    sessions.push(newSession);
    localStorage.setItem('sessions', JSON.stringify(sessions));
    alert('Session créée avec succès');
    loadSessions();
}

// Charger une session existante
function loadSession(index) {
    const sessions = JSON.parse(localStorage.getItem('sessions'));
    const session = sessions[index];
    localStorage.setItem('currentSession', JSON.stringify(session));
    window.location.href = 'session.html'; // Rediriger vers la page de session
}

function loadCurrentSession() {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    totalHistory = JSON.parse(localStorage.getItem('totalHistory')) || []; // Charger l'historique

    if (session) {
        document.getElementById('session-title').textContent = session.name;
        document.title = `"${session.name}" • Compteur live`; // Met à jour le titre de la page

        // Vérifier si le total est à 0
        const total = session.data.moins3 + session.data.age3a14 + session.data.adulte;
        if (total === 0) {
            // Créer un état initial dans l'historique
            session.data.history.push({
                timestamp: new Date().toISOString(),
                moins3: 0,
                age3a14: 0,
                adulte: 0,
                total: 0,
                clicks: {
                    moins3: 0,
                    age3a14: 0,
                    adulte: 0
                }
            });
            // Enregistrer la session mise à jour
            saveCurrentSession(session.data);
        }

        updateDisplay();
        
        // Récupérer l'historique de la session et rendre le graphique avec ces données
        const sessionHistory = session.data.history || [];
        renderChart(sessionHistory);
        updateClock();
    } else {
        alert("Aucune session en cours. Veuillez créer ou charger une session.");
    }
}





// Enregistrer les données de la session en cours
function saveCurrentSession(sessionData) {
    const sessions = JSON.parse(localStorage.getItem('sessions'));
    const currentSession = JSON.parse(localStorage.getItem('currentSession'));

    currentSession.data = sessionData;

    const sessionIndex = sessions.findIndex(s => s.name === currentSession.name);
    if (sessionIndex !== -1) {
        sessions[sessionIndex] = currentSession;
        localStorage.setItem('sessions', JSON.stringify(sessions));
        localStorage.setItem('currentSession', JSON.stringify(currentSession));
    }
}

// Fonction d'incrémentation
function increment(type) {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    session.data[type]++;
    session.data.clicks[type]++; // Augmente le nombre de clics (entrées)
    saveCurrentSession(session.data);
    updateDisplay();
    scheduleChartUpdate(); // Planifier la mise à jour du graphique
}

// Fonction de décrémentation
function decrement(type) {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    if (session.data[type] > 0) session.data[type]--;
    saveCurrentSession(session.data);
    updateDisplay();
    scheduleChartUpdate(); // Planifier la mise à jour du graphique
}

// Fonction pour planifier la mise à jour du graphique
function scheduleChartUpdate() {
    if (chartUpdateTimer) {
        clearTimeout(chartUpdateTimer); // Annuler le timer précédent
    }
    chartUpdateTimer = setTimeout(updateChart, 3000); // Mettre à jour le graphique après 3 secondes
}


// Mettre à jour l'affichage des compteurs et des "entrées"
function updateDisplay() {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    
    // Mettre à jour les compteurs de présents
    document.getElementById('count-moins3').textContent = session.data.moins3;
    document.getElementById('count-age3a14').textContent = session.data.age3a14;
    document.getElementById('count-adulte').textContent = session.data.adulte;

    // Calculer et afficher le total des présents
    const totalPresents = session.data.moins3 + session.data.age3a14 + session.data.adulte;
    document.getElementById('total').textContent = totalPresents;

    // Mettre à jour les compteurs d'entrées (clics)
    document.getElementById('click-moins3').textContent = session.data.clicks.moins3;
    document.getElementById('click-age3a14').textContent = session.data.clicks.age3a14;
    document.getElementById('click-adulte').textContent = session.data.clicks.adulte;
}


// Fonction pour mettre à jour l'horloge
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
}

// Démarrer l'horloge toutes les secondes
setInterval(updateClock, 1000);

let chart; // Pour accéder au graphique globalement
let totalHistory = []; // Stocker l'évolution du total

function renderChart(sessionHistory = []) {
    const ctx = document.getElementById('affluenceChart').getContext('2d');

    // Clear previous chart if it exists
    if (chart) {
        chart.destroy(); // Destroy the existing chart instance
    }

    // Create a new chart instance
    chart = new Chart(ctx, {
        type: 'line', // Type de graphique en ligne
        data: {
            labels: sessionHistory.length > 0 ? sessionHistory.map(entry => formatTime(new Date(entry.timestamp))) : [], // Horodatages formatés
            datasets: [{
                label: 'Total des présents',
                data: sessionHistory.length > 0 ? sessionHistory.map(item => item.total) : [], // Total des personnes présentes
                borderColor: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    title: {
                        display: true,
                        text: 'Temps'
                    }
                }
            }
        }
    });
}




function updateChart() {
    const session = JSON.parse(localStorage.getItem('currentSession'));
    const total = session.data.moins3 + session.data.age3a14 + session.data.adulte;

    // Ajouter la nouvelle valeur du total à l'historique de la session
    session.data.history.push({
        timestamp: new Date().toISOString(),
        moins3: session.data.moins3,
        age3a14: session.data.age3a14,
        adulte: session.data.adulte,
        total: total,
        clicks: {
            moins3: session.data.clicks.moins3,
            age3a14: session.data.clicks.age3a14,
            adulte: session.data.clicks.adulte
        }
    });

    // Sauvegarder la session mise à jour dans le localStorage
    saveCurrentSession(session.data);

    // Mettre à jour le graphique
    updateChartData(session.data.history);
}

function updateChartData(history) {
    chart.data.labels = history.map(entry => {
        const date = new Date(entry.timestamp);
        return formatTime(date); // Utiliser votre fonction de formatage de l'heure
    });
    chart.data.datasets[0].data = history.map(entry => entry.total);
    chart.update();
}





// Fonction pour exporter les données sous forme de fichier CSV
function exportData() {
    const session = JSON.parse(localStorage.getItem('currentSession'));

    // Vérifiez si une session active est chargée
    if (!session) {
        alert("Aucune session active à exporter.");
        return;
    }

    // Générer l'en-tête du CSV
    let csvContent = `Date,Heure,Enfants -3ans,Enfants 3 à 14,Ados & Adultes,Billets -3ans,Billets 3 à 14,Billets Adultes\n`;

    // Itérer sur l'historique de la session
    session.data.history.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        const date = formatDate(entryDate);
        const time = formatTime(entryDate);
        const { moins3, age3a14, adulte, clicks } = entry;

        // Ajouter les données de l'entrée à la chaîne CSV
        csvContent += `${date},${time},${moins3},${age3a14},${adulte},${clicks.moins3},${clicks.age3a14},${clicks.adulte}\n`;
    });

    // Encoder les données en URI et générer le fichier à télécharger
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", `${session.name}-historique.csv`);
    document.body.appendChild(downloadAnchorNode); // Requis pour Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}




// Fonction pour formater la date au format "ddMMMy" (ex : 08oct)
function formatDate(date) {
    const options = { day: '2-digit', month: 'short' };
    return date.toLocaleDateString('fr-FR', options).replace(' ', '').toLowerCase(); // Retirer l'espace entre jour et mois et mettre en minuscule
}

// Fonction pour formater l'heure au format "HH:MM:SS"
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}


function resetCounters() {
    const session = JSON.parse(localStorage.getItem('currentSession'));

    // Réinitialiser les compteurs
    session.data.moins3 = 0;
    session.data.age3a14 = 0;
    session.data.adulte = 0;
    session.data.clicks = {
        moins3: 0,
        age3a14: 0,
        adulte: 0
    };

    // Réinitialiser l'historique de la session
    session.data.history = []; // Réinitialiser l'historique des données

    saveCurrentSession(session.data); // Save the reset session
    updateDisplay(); // Update the display with the reset values
    renderChart([]); // Render an empty chart
    loadCurrentSession(); // Reload the current session to reflect changes
}





// Fonction pour ouvrir la fenêtre de renommage
function openRenamePopup(index) {
    const sessions = JSON.parse(localStorage.getItem('sessions'));
    const newName = prompt("Entrez le nouveau nom pour la session :", sessions[index].name);
    if (newName && newName.trim() !== '') {
        sessions[index].name = newName;
        localStorage.setItem('sessions', JSON.stringify(sessions));
        loadSessions(); // Recharger les sessions pour mettre à jour l'affichage
    }
}

// Fonction pour supprimer une session
function deleteSession(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
        const sessions = JSON.parse(localStorage.getItem('sessions'));
        sessions.splice(index, 1);
        localStorage.setItem('sessions', JSON.stringify(sessions));
        loadSessions(); // Recharger les sessions pour mettre à jour l'affichage
    }
}

// Appeler la fonction pour charger les sessions lors du chargement de la page
document.addEventListener('DOMContentLoaded', loadSessions);

function goBack() {
    window.location.href = "index.html"; // Redirige vers la page index
}

window.onload = function() {
    const currentSession = JSON.parse(localStorage.getItem("currentSession"));
    if (currentSession) {
        document.getElementById("session-title").textContent = currentSession.name;
    } else {
        document.getElementById("session-title").textContent = "Nom de la session non disponible";
    }
};

function confirmReset() {
    if (confirm('Êtes-vous sûr de vouloir remettre à zéro tous les compteurs ?')) {
        resetCounters();
    }
}


let chartVisible = true; // Variable pour suivre l'état de visibilité du graphique

function toggleChart() {
    const chartCanvas = document.getElementById('affluenceChart');
    const toggleButton = document.getElementById('toggleChartButton');
    
    chartVisible = !chartVisible; // Inverser l'état de visibilité
    
    if (chartVisible) {
        chartCanvas.style.display = 'block'; // Afficher le graphique
        toggleButton.textContent = 'Masquer le graphique'; // Mettre à jour le texte du bouton
    } else {
        chartCanvas.style.display = 'none'; // Masquer le graphique
        toggleButton.textContent = 'Afficher le graphique'; // Mettre à jour le texte du bouton
    }
}
