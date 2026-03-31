chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0].url;
  const isPix = url && (url.includes('pix.fr') || url.includes('app.pix.fr'));
  
  chrome.storage.sync.get({ enabled: true }, (data) => {
    const statusSpan = document.getElementById('active-status');
    if (!data.enabled) {
      statusSpan.textContent = 'Désactivée (option)';
      statusSpan.style.color = 'orange';
    } else if (isPix) {
      statusSpan.textContent = 'Active sur Pix';
      statusSpan.style.color = 'green';
    } else {
      statusSpan.textContent = 'Inactive (hors Pix)';
      statusSpan.style.color = 'red';
    }
  });
});

document.getElementById('btn-pix').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://pix.fr' });
});

document.getElementById('btn-dev').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://maxlware.com?utm_source=pixhelp' });
});

document.getElementById('btn-github').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://github.com/votre-compte/pixhelp' });
});