// dashboard.js
console.log('PixHelp Professeur - Dashboard script chargé.');
document.addEventListener('DOMContentLoaded', () => {
    loadSessionInfo();
    
    document.getElementById('refresh-session').addEventListener('click', () => {
        loadSessionInfo();
    });
    
    document.getElementById('export-data').addEventListener('click', () => {
        const data = [
            ['Nom', 'Statut', 'Progression'],
            ['Lucas Martin', 'Actif', '67%'],
            ['Emma Bernard', 'Actif', '42%'],
            ['Thomas Dubois', 'Inactif', '23%']
        ];
        const csv = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pix_session_${new Date().toISOString().slice(0,19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('send-message').addEventListener('click', () => {
        alert('Fonctionnalité à venir : envoi de messages aux élèves.');
    });
    
    document.getElementById('open-pix').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://orga.pix.fr' });
    });
});

function loadSessionInfo() {
    const sessionStatusDiv = document.getElementById('session-status');
    const sessionDetailsDiv = document.getElementById('session-details');
    
    chrome.storage.local.get(['pixSessionData'], (result) => {
        if (result.pixSessionData) {
            const data = result.pixSessionData;
            sessionStatusDiv.textContent = `📅 Session : ${data.name || 'Non définie'}`;
            sessionDetailsDiv.innerHTML = `
                <strong>Code :</strong> ${data.code || '---'}<br>
                <strong>Date :</strong> ${data.date || new Date().toLocaleDateString()}<br>
                <strong>Participants :</strong> ${data.participants || '3'} élèves
            `;
        } else {
            sessionStatusDiv.textContent = 'Aucune session active détectée.';
            sessionDetailsDiv.innerHTML = 'Veuillez ouvrir une session sur orga.pix.fr/dashboard pour voir les informations.';
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url.includes('orga.pix.fr/dashboard')) {
                    sessionDetailsDiv.innerHTML += '<br><small>(Simulation : session fictive chargée)</small>';
                    chrome.storage.local.set({
                        pixSessionData: {
                            name: 'Certification PIX - Classe 3A',
                            code: 'PIX2025-001',
                            date: new Date().toLocaleDateString(),
                            participants: 3
                        }
                    });
                }
            });
        }
    });
}