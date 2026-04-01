// background.js
let extensionEnabled = true;

chrome.storage.sync.get({ enabled: true }, (data) => {
  extensionEnabled = data.enabled;
  updateAllIcons();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    extensionEnabled = changes.enabled.newValue;
    updateAllIcons();
  }
});

function updateAllIcons() {
  chrome.tabs.query({ url: ['*://pix.fr/*', '*://app.pix.fr/*'] }, (tabs) => {
    tabs.forEach(tab => {
      const iconPath = (extensionEnabled && tab.url && (tab.url.includes('pix.fr') || tab.url.includes('app.pix.fr')))
        ? 'icons/icon_active.png'
        : 'icons/icon.png';
      chrome.action.setIcon({ tabId: tab.id, path: { 128: iconPath } });
    });
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      const isPix = tab.url.includes('pix.fr') || tab.url.includes('app.pix.fr');
      const iconPath = (extensionEnabled && isPix) ? 'icons/icon_active.png' : 'icons/icon.png';
      chrome.action.setIcon({ tabId: activeInfo.tabId, path: { 128: iconPath } });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    const isPix = tab.url.includes('pix.fr') || tab.url.includes('app.pix.fr');
    const iconPath = (extensionEnabled && isPix) ? 'icons/icon_active.png' : 'icons/icon.png';
    chrome.action.setIcon({ tabId: tabId, path: { 128: iconPath } });
  }
});

// ========== GESTION DES RESSOURCES ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getResources') {
    handleGetResources(request.question, request.context, sendResponse);
    return true; // réponse asynchrone
  }
});

function handleGetResources(userQuestion, context, sendResponse) {
  const fullText = userQuestion + ' ' + (context.question || '');
  const keywords = extractKeywords(fullText);
  
  // Liens fixes
  const fixedLinks = [
    { title: "📚 Documentation officielle Pix", url: "https://pix.fr/support" },
    { title: "🎓 Tutoriels Pix (Éducation nationale)", url: "https://eduscol.education.fr/pix" },
    { title: "❓ Centre d'aide Pix", url: "https://aide.pix.fr" }
  ];
  
  // Liens Google : priorité nosdevoirs.fr
  const googleLinks = [
    { 
      title: "🔍 Recherche sur Google (priorité nosdevoirs.fr)", 
      url: `https://www.google.com/search?q=${encodeURIComponent(keywords + ' site:nosdevoirs.fr')}` 
    },
    { 
      title: "🔍 Recherche Google (tous sites)", 
      url: `https://www.google.com/search?q=${encodeURIComponent(keywords + ' tutoriel aide')}` 
    }
  ];
  
  // Liens supplémentaires basés sur des mots-clés
  const additionalLinks = [];
  const lower = userQuestion.toLowerCase();
  
  if (lower.includes('excel') || lower.includes('tableur')) {
    additionalLinks.push({ title: "📊 Tutoriel Excel (OpenClassrooms)", url: "https://openclassrooms.com/fr/courses/2250726-initiez-vous-au-tableur-excel" });
  }
  if (lower.includes('mail') || lower.includes('email') || lower.includes('courriel')) {
    additionalLinks.push({ title: "✉️ Bien rédiger un email (Pix)", url: "https://pix.fr/ressources/email" });
    additionalLinks.push({ title: "📧 Guide du courrier électronique (CNIL)", url: "https://www.cnil.fr/fr/courrier-electronique" });
  }
  if (lower.includes('recherche') || lower.includes('moteur')) {
    additionalLinks.push({ title: "🔎 Maîtriser la recherche sur Internet", url: "https://www.pix.fr/competences/recherche-internet" });
  }
  if (lower.includes('securité') || lower.includes('mot de passe')) {
    additionalLinks.push({ title: "🔐 Bonnes pratiques de sécurité", url: "https://www.ssi.gouv.fr/guide/mot-de-passe/" });
  }
  
  const allLinks = [...fixedLinks, ...googleLinks, ...additionalLinks];
  sendResponse({ links: allLinks });
}

function extractKeywords(text) {
  const mots = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(mot => mot.length > 3);
  const unique = [...new Set(mots)].slice(0, 4);
  return unique.join(' ');
}