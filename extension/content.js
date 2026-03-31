// content.js
let settingsPopup = null;
let certificationBlocked = false;
let currentUrl = location.href;
let intervalId = null;

// Button PixHelp
function injectButton() {
  const nav = document.querySelector('.app-navigation.pix-navigation .pix-navigation__nav');
  if (nav && !document.getElementById('pixhelp-btn')) {
    const button = document.createElement('button');
    button.id = 'pixhelp-btn';
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #3a6ea5;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 12px;
    `;
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/icon_active.png');
    img.style.width = '20px';
    img.style.height = '20px';
    const span = document.createElement('span');
    span.textContent = 'PixHelp';
    button.appendChild(img);
    button.appendChild(span);
    button.addEventListener('click', openSettingsPopup);
    nav.appendChild(button);
  }
}

// Popup settings
function openSettingsPopup() {
  if (settingsPopup) {
    settingsPopup.remove();
    settingsPopup = null;
    return;
  }

  chrome.storage.sync.get({ enabled: true }, (data) => {
    const isEnabled = data.enabled;

    const popup = document.createElement('div');
    popup.id = 'pixhelp-settings-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10001;
      width: 400px;
      max-width: 90%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    `;

    popup.innerHTML = `
      <div style="background: #3a6ea5; padding: 16px; color: white;">
        <h2 style="margin:0; font-size: 20px;">⚙️ Paramètres PixHelp</h2>
      </div>
      <div style="padding: 20px;">
        <div style="display: flex; gap: 10px; border-bottom: 1px solid #eee; margin-bottom: 16px;">
          <button class="tab-btn active" data-tab="info">ℹ️ Infos</button>
          <button class="tab-btn" data-tab="options">⚙️ Options</button>
        </div>
        <div id="tab-info" class="tab-content active">
          <p><strong>PixHelp</strong> – Assistant pour la plateforme Pix.</p>
          <p>Cette extension vous aide à rechercher efficacement les réponses dans le cadre autorisé.</p>
          <p>Version 1.0.0</p>
          <p>© 2026 - Développé par Maxlware pour aider les élèves.</p>
        </div>
        <div id="tab-options" class="tab-content" style="display:none;">
          <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <input type="checkbox" id="pixhelp-enabled" ${isEnabled ? 'checked' : ''}>
            <span>Activer l'extension</span>
          </label>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Si désactivé, l'icône restera grisée et aucune fonctionnalité ne sera active.
          </p>
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button id="pixhelp-close" style="
            background: #3a6ea5;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Fermer</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    settingsPopup = popup;

    const tabBtns = popup.querySelectorAll('.tab-btn');
    const tabContents = {
      info: popup.querySelector('#tab-info'),
      options: popup.querySelector('#tab-options')
    };
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.keys(tabContents).forEach(key => {
          tabContents[key].style.display = key === tab ? 'block' : 'none';
        });
      });
    });

    const checkbox = popup.querySelector('#pixhelp-enabled');
    checkbox.addEventListener('change', (e) => {
      chrome.storage.sync.set({ enabled: e.target.checked });
    });

    const closeBtn = popup.querySelector('#pixhelp-close');
    closeBtn.addEventListener('click', () => {
      popup.remove();
      settingsPopup = null;
    });

    window.addEventListener('click', (e) => {
      if (settingsPopup && !popup.contains(e.target)) {
        popup.remove();
        settingsPopup = null;
      }
    });
  });
}

// Block certification section
function blockCertificationSection() {
  chrome.storage.sync.get({ enabled: true }, (data) => {
    if (!data.enabled) return;

    if (!window.location.pathname.startsWith('/certifications')) {
      cleanupCertificationBlock();
      return;
    }

    const target = document.querySelector('.certification-joiner, .pix-block.pix-block--primary.certification-start-page__block');
    if (!target) return;

    if (certificationBlocked) return;

    target.style.filter = 'blur(8px)';
    target.style.pointerEvents = 'none';
    target.classList.add('pixhelp-blurred');

    const message = document.createElement('div');
    message.className = 'pixhelp-warning';
    message.innerHTML = `
      Conformément aux conditions d'utilisations, l'utilisation de cet extension est interdite pendant la certification pour éviter toute tricherie.
      <br><br>
      Vous pouvez soit désactiver l'extension ou la supprimer.
      <br><br>
      <a href="https://pix.fr/conditions-utilisation" target="_blank" style="color: #ffa500; text-decoration: underline;">Conditions d'utilisation</a> | <a href="https://sciences.edu.umontpellier.fr/files/2021/10/Reglement-PIX-2021.pdf" target="_blank" style="color: #ffa500; text-decoration: underline;">Informations complémentaires</a>
    `;
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      max-width: 80%;
      z-index: 10000;
      font-size: 14px;
      pointer-events: auto;
      white-space: normal;
      word-wrap: break-word;
      line-height: 1.4;
    `;

    const parent = target.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(message);
    certificationBlocked = true;
  });
}

function cleanupCertificationBlock() {
  document.querySelectorAll('.pixhelp-warning').forEach(el => el.remove());
  const targets = document.querySelectorAll('.certification-joiner, .pix-block.pix-block--primary.certification-start-page__block');
  targets.forEach(target => {
    target.style.filter = '';
    target.style.pointerEvents = '';
    target.classList.remove('pixhelp-blurred');
  });
  certificationBlocked = false;
}

// View URL changes to apply/remove certification block
function startMonitoring() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      cleanupCertificationBlock();
    }
    blockCertificationSection();
  }, 500);
}

// Initial injection
const navObserver = new MutationObserver(() => injectButton());
navObserver.observe(document.body, { childList: true, subtree: true });
injectButton();
startMonitoring();