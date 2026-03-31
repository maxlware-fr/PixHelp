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